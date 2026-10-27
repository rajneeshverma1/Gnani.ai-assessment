// Vyapar Voice Gnani AI Pipeline Orchestrator
// Coordinates: Browser Audio -> Prisma v2.5 STT -> Evon v3.3 LLM -> Zod Validation -> PostgreSQL DB Mutation -> Timbre v2.5 TTS -> Audit Log

import prisma from '../db';
import { EvonIntent } from '../validations';
import { transcribeWithPrisma } from './stt';
import { extractIntentWithEvon } from './llm';
import { synthesizeWithTimbre } from './tts';

export interface VoiceExecutionResult {
  success: boolean;
  transcript: string;
  intent: EvonIntent;
  result: Record<string, any> | null;
  replyText: string;
  replyAudioUrl: string;
  latency: {
    sttMs: number;
    llmMs: number;
    ttsMs: number;
    totalMs: number;
  };
  error?: string;
}

export async function processVoiceCommand(options: {
  audioBase64?: string;
  mimeType?: string;
  language?: 'hi-IN' | 'en-IN' | 'hinglish';
  textOverride?: string;
}): Promise<VoiceExecutionResult> {
  const overallStart = Date.now();
  const language = options.language || 'hi-IN';

  // 1. Convert Audio Buffer if base64 provided
  let audioBuffer: Buffer | null = null;
  if (options.audioBase64) {
    const base64Data = options.audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    audioBuffer = Buffer.from(base64Data, 'base64');
  }

  // 2. Step 1: Prisma v2.5 STT
  const sttResult = await transcribeWithPrisma(
    audioBuffer,
    options.mimeType || 'audio/webm',
    language,
    options.textOverride
  );

  const transcript = sttResult.transcript;

  // 3. Step 2: Evon v3.3 Reasoning & Intent Extraction
  const llmResult = await extractIntentWithEvon(transcript, language);
  const intent = llmResult.intent;

  // 4. Step 3: Database Mutation based on validated action
  let mutationResult: Record<string, any> | null = null;
  let replyText = '';
  let actionStatus = 'success';
  let errorMessage: string | null = null;

  try {
    switch (intent.action) {
      case 'create_invoice': {
        if (!intent.customer_name || !intent.amount) {
          throw new Error('Customer name and amount are required for invoice creation.');
        }

        // Database transaction: find or create customer + create invoice
        const createdInvoice = await prisma.$transaction(async (tx) => {
          let customer = await tx.customer.findFirst({
            where: {
              name: {
                equals: intent.customer_name!,
                mode: 'insensitive',
              },
            },
          });

          if (!customer) {
            customer = await tx.customer.create({
              data: {
                name: intent.customer_name!,
                phone: intent.phone || null,
                language: intent.language || 'hi-IN',
              },
            });
          }

          // Generate next sequential invoice number with collision safety
          const lastInvoice = await tx.invoice.findFirst({
            orderBy: { invoice_number: 'desc' },
            select: { invoice_number: true },
          });

          let nextNum = 1013;
          if (lastInvoice && lastInvoice.invoice_number.startsWith('INV-')) {
            const parsedNum = parseInt(lastInvoice.invoice_number.replace('INV-', ''), 10);
            if (!isNaN(parsedNum)) nextNum = Math.max(nextNum, parsedNum + 1);
          }

          let invoiceNumber = `INV-${nextNum}`;
          while (await tx.invoice.findUnique({ where: { invoice_number: invoiceNumber } })) {
            nextNum++;
            invoiceNumber = `INV-${nextNum}`;
          }
          const dueDate = intent.due_date ? new Date(intent.due_date) : null;

          const invoice = await tx.invoice.create({
            data: {
              customer_id: customer.id,
              invoice_number: invoiceNumber,
              amount: intent.amount!,
              currency: intent.currency || 'INR',
              due_date: dueDate,
              status: 'pending',
              notes: 'Generated via Vyapar Voice assistant',
              source_transcript: transcript,
            },
            include: { customer: true },
          });

          // If due date exists, schedule a reminder automatically
          if (dueDate) {
            await tx.reminder.create({
              data: {
                invoice_id: invoice.id,
                remind_at: dueDate,
                channel: 'dashboard',
                status: 'scheduled',
              },
            });
          }

          return invoice;
        });

        mutationResult = {
          invoiceId: createdInvoice.id,
          invoiceNumber: createdInvoice.invoice_number,
          customerName: createdInvoice.customer.name,
          amount: Number(createdInvoice.amount),
          status: createdInvoice.status,
          dueDate: createdInvoice.due_date?.toISOString().split('T')[0] || null,
        };

        // Section 12 Timbre reply rule (<20 words, confirms action)
        if (language === 'en-IN') {
          replyText = `Invoice of ₹${intent.amount} created for ${intent.customer_name}.`;
        } else {
          replyText = `${intent.customer_name} ke liye ${intent.amount} rupee ka invoice ban gaya hai.`;
        }
        break;
      }

      case 'add_customer': {
        if (!intent.customer_name) {
          throw new Error('Customer name is required.');
        }

        const newCustomer = await prisma.customer.create({
          data: {
            name: intent.customer_name,
            phone: intent.phone || null,
            language: intent.language || 'hi-IN',
          },
        });

        mutationResult = {
          customerId: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone,
          language: newCustomer.language,
        };

        if (language === 'en-IN') {
          replyText = `${intent.customer_name} has been added to customer list.`;
        } else {
          replyText = `${intent.customer_name} customer list mein add ho gayi.`;
        }
        break;
      }

      case 'mark_paid': {
        if (!intent.customer_name) {
          throw new Error('Customer name is required to mark invoice paid.');
        }

        const customer = await prisma.customer.findFirst({
          where: {
            name: {
              equals: intent.customer_name,
              mode: 'insensitive',
            },
          },
        });

        if (!customer) {
          replyText = `${intent.customer_name} naam ka customer nahi mila.`;
          actionStatus = 'customer_not_found';
          mutationResult = { found: false, customerName: intent.customer_name };
          break;
        }

        const latestInvoice = await prisma.invoice.findFirst({
          where: {
            customer_id: customer.id,
            status: 'pending',
          },
          orderBy: { created_at: 'desc' },
        });

        if (!latestInvoice) {
          replyText = `${customer.name} ka koi pending invoice nahi hai.`;
          actionStatus = 'no_pending_invoice';
          mutationResult = { customerId: customer.id, customerName: customer.name, status: 'none' };
          break;
        }

        const updated = await prisma.invoice.update({
          where: { id: latestInvoice.id },
          data: { status: 'paid' },
        });

        mutationResult = {
          invoiceId: updated.id,
          invoiceNumber: updated.invoice_number,
          customerName: customer.name,
          status: 'paid',
        };

        if (language === 'en-IN') {
          replyText = `Invoice ${updated.invoice_number} for ${customer.name} marked as paid.`;
        } else {
          replyText = `${customer.name} ka invoice paid mark kar diya gaya.`;
        }
        break;
      }

      case 'query_status': {
        if (!intent.customer_name) {
          throw new Error('Customer name is required to query payment status.');
        }

        const customer = await prisma.customer.findFirst({
          where: {
            name: {
              equals: intent.customer_name,
              mode: 'insensitive',
            },
          },
          include: {
            invoices: {
              orderBy: { created_at: 'desc' },
              take: 5,
            },
          },
        });

        if (!customer || customer.invoices.length === 0) {
          replyText = `${intent.customer_name} ka koi invoice record nahi mila.`;
          actionStatus = 'no_invoices_found';
          mutationResult = { customerName: intent.customer_name, invoices: [] };
          break;
        }

        const latest = customer.invoices[0];
        mutationResult = {
          customerId: customer.id,
          customerName: customer.name,
          latestInvoiceNumber: latest.invoice_number,
          amount: Number(latest.amount),
          status: latest.status,
          dueDate: latest.due_date?.toISOString().split('T')[0] || null,
        };

        if (latest.status === 'pending') {
          replyText = `${customer.name} ka invoice pending hai. Kul ${latest.amount} baaki hain.`;
        } else if (latest.status === 'paid') {
          replyText = `${customer.name} ka invoice paid hai. Koi dues nahi hain.`;
        } else {
          replyText = `${customer.name} ka invoice status ${latest.status} hai.`;
        }
        break;
      }

      case 'schedule_reminder': {
        if (!intent.customer_name) {
          throw new Error('Customer name is required for reminder.');
        }

        const customer = await prisma.customer.findFirst({
          where: {
            name: {
              equals: intent.customer_name,
              mode: 'insensitive',
            },
          },
          include: {
            invoices: {
              where: { status: 'pending' },
              orderBy: { created_at: 'desc' },
              take: 1,
            },
          },
        });

        if (!customer || customer.invoices.length === 0) {
          replyText = `${intent.customer_name} ka koi pending invoice nahi mila jisme reminder lag sake.`;
          actionStatus = 'no_pending_invoice';
          break;
        }

        const targetInvoice = customer.invoices[0];
        const remindDate = intent.reminder_date
          ? new Date(intent.reminder_date)
          : new Date(Date.now() + 2 * 86400000);

        const reminder = await prisma.reminder.create({
          data: {
            invoice_id: targetInvoice.id,
            remind_at: remindDate,
            channel: 'dashboard',
            status: 'scheduled',
          },
        });

        mutationResult = {
          reminderId: reminder.id,
          invoiceNumber: targetInvoice.invoice_number,
          customerName: customer.name,
          remindAt: reminder.remind_at.toISOString().split('T')[0],
        };

        const dayWord = intent.reminder_date ? 'diye gaye date' : 'Friday';
        replyText = `${customer.name} ke liye reminder set ho gaya hai.`;

        // Also add to daily schedule tasks
        try {
          await prisma.scheduleTask.create({
            data: {
              time_slot: '11:00 AM - 12:00 PM',
              task_title: `Call ${customer.name} for Invoice ${targetInvoice.invoice_number}`,
              category: 'calls',
              priority: 'high',
              remind_at: remindDate,
            },
          });
        } catch (e) {
          console.warn('Failed to mirror reminder into scheduleTask:', e);
        }
        break;
      }

      case 'plan_day': {
        const pendingInvoices = await prisma.invoice.findMany({
          where: { status: 'pending' },
          include: { customer: true },
          orderBy: { due_date: 'asc' },
        });

        const overdueInvoices = await prisma.invoice.findMany({
          where: {
            status: 'pending',
            due_date: { lt: new Date() },
          },
          include: { customer: true },
        });

        const totalPendingAmount = pendingInvoices.reduce((acc, inv) => acc + Number(inv.amount), 0);
        const topPending = pendingInvoices[0];

        // Default smart time-blocked daily slots for SMB merchants
        const defaultSlots = [
          {
            time_slot: '10:00 AM - 11:30 AM',
            task_title: 'Morning Invoicing & Ledger Updates',
            category: 'billing',
            priority: 'high',
          },
          {
            time_slot: '11:30 AM - 01:00 PM',
            task_title: topPending
              ? `Priority Call: ${topPending.customer.name} (₹${Number(topPending.amount).toLocaleString('en-IN')})`
              : 'Customer Payment Follow-ups',
            category: 'calls',
            priority: 'high',
          },
          {
            time_slot: '02:00 PM - 03:30 PM',
            task_title: 'Vendor Stock & Delivery Verification',
            category: 'vendor',
            priority: 'medium',
          },
          {
            time_slot: '04:00 PM - 05:30 PM',
            task_title: 'Daily Cash Register & Accounts Balancing',
            category: 'accounts',
            priority: 'medium',
          },
        ];

        // Ensure tasks exist in database
        for (const slot of defaultSlots) {
          const existing = await prisma.scheduleTask.findFirst({
            where: { time_slot: slot.time_slot, task_title: slot.task_title },
          });
          if (!existing) {
            await prisma.scheduleTask.create({ data: slot });
          }
        }

        const currentTasks = await prisma.scheduleTask.findMany({
          orderBy: { created_at: 'asc' },
        });

        mutationResult = {
          planType: 'daily_work_plan',
          totalPendingInvoices: pendingInvoices.length,
          overdueCount: overdueInvoices.length,
          totalPendingAmount,
          topPriorityCustomer: topPending?.customer?.name || null,
          topPriorityAmount: topPending ? Number(topPending.amount) : 0,
          playChime: true,
          timeSlots: currentTasks.map((t) => ({
            id: t.id,
            time: t.time_slot,
            title: t.task_title,
            category: t.category,
            priority: t.priority,
            completed: t.is_completed,
          })),
          actionItems: [
            topPending
              ? `Priority 11:30 AM: Call ${topPending.customer.name} for ₹${Number(topPending.amount).toLocaleString('en-IN')}`
              : 'All customer invoices are cleared!',
            '10:00 AM: Start morning invoice generation and ledger sync',
            '02:00 PM: Inspect supplier deliveries and inventory records',
            '04:00 PM: Perform end-of-day accounts and cash reconciliations',
          ],
        };

        if (language === 'en-IN') {
          replyText = `Schedule ready: 10 to 11:30 AM billing, 11:30 to 1 PM payment calls, 2 to 3:30 PM vendor stock, and 4 PM accounts review.`;
        } else {
          replyText = `Schedule ready: 10 se 11:30 AM billing, 11:30 se 1 baje payment calls, 2 se 3:30 vendor stock, aur 4 baje accounts review.`;
        }
        break;
      }

      case 'business_summary': {
        const totalCustomers = await prisma.customer.count();
        const pendingInvoices = await prisma.invoice.findMany({ where: { status: 'pending' } });
        const paidInvoices = await prisma.invoice.findMany({ where: { status: 'paid' } });
        const totalPending = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

        mutationResult = {
          totalCustomers,
          pendingInvoicesCount: pendingInvoices.length,
          paidInvoicesCount: paidInvoices.length,
          totalPending,
          totalPaid,
        };

        if (language === 'en-IN') {
          replyText = `Total ${totalCustomers} customers. ₹${totalPending} pending and ₹${totalPaid} collected so far.`;
        } else {
          replyText = `Kul ${totalCustomers} customers hain. ₹${totalPending} baaki hain aur ₹${totalPaid} collect ho chuke hain.`;
        }
        break;
      }

      case 'unknown':
      default: {
        actionStatus = 'clarification_needed';
        mutationResult = { clarification: true, missing: intent.missing_fields };
        replyText = 'Main puri detail samajh nahi paya. Kripya customer ka naam aur amount boliye.';
        break;
      }
    }
  } catch (err: any) {
    actionStatus = 'failed';
    errorMessage = err.message;
    replyText = 'Koshish karte waqt dikkat aayi. Kripya dobara boliye.';
  }

  // 5. Step 4: Timbre v2.5 TTS Synthesizer
  const ttsResult = await synthesizeWithTimbre(replyText, language);

  const totalMs = Date.now() - overallStart;

  // 6. Step 5: Audit Log in voice_events
  try {
    await prisma.voiceEvent.create({
      data: {
        transcript,
        detected_language: sttResult.detectedLanguage,
        parsed_intent: intent as any,
        action_status: actionStatus,
        response_text: replyText,
        stt_latency_ms: sttResult.latencyMs,
        llm_latency_ms: llmResult.latencyMs,
        tts_latency_ms: ttsResult.latencyMs,
        error_message: errorMessage,
      },
    });
  } catch (logErr) {
    console.error('Failed to write voice audit log:', logErr);
  }

  return {
    success: actionStatus === 'success',
    transcript,
    intent,
    result: mutationResult,
    replyText,
    replyAudioUrl: ttsResult.audioUrl,
    latency: {
      sttMs: sttResult.latencyMs,
      llmMs: llmResult.latencyMs,
      ttsMs: ttsResult.latencyMs,
      totalMs,
    },
    error: errorMessage || undefined,
  };
}
