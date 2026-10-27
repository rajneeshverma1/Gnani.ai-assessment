import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { CreateInvoiceSchema } from '@/lib/validations';


// GET /api/invoices?status=pending&search=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.trim();

    const whereClause: any = {};
    if (status && ['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { invoice_number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        reminders: {
          orderBy: { remind_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      customerId: inv.customer_id,
      customerName: inv.customer.name,
      customerPhone: inv.customer.phone,
      amount: Number(inv.amount),
      currency: inv.currency,
      dueDate: inv.due_date ? inv.due_date.toISOString().split('T')[0] : null,
      status: inv.status,
      notes: inv.notes,
      sourceTranscript: inv.source_transcript,
      remindersCount: inv.reminders.length,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    }));

    return NextResponse.json({ success: true, invoices: formatted });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateInvoiceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { customerId, customerName, amount, currency, dueDate, status, notes, sourceTranscript } =
      validated.data;

    let targetCustomerId = customerId;

    // If customerName given instead of customerId, find or create
    if (!targetCustomerId && customerName) {
      let customer = await prisma.customer.findFirst({
        where: { name: { equals: customerName.trim(), mode: 'insensitive' } },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName.trim(),
            language: 'hi-IN',
          },
        });
      }
      targetCustomerId = customer.id;
    }

    if (!targetCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Customer is required.' },
        { status: 400 }
      );
    }

    // Generate collision-safe unique sequential invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoice_number: 'desc' },
      select: { invoice_number: true },
    });

    let nextNum = 1013;
    if (lastInvoice && lastInvoice.invoice_number.startsWith('INV-')) {
      const parsedNum = parseInt(lastInvoice.invoice_number.replace('INV-', ''), 10);
      if (!isNaN(parsedNum)) nextNum = Math.max(nextNum, parsedNum + 1);
    }
    let invoiceNumber = `INV-${nextNum}`;
    while (await prisma.invoice.findUnique({ where: { invoice_number: invoiceNumber } })) {
      nextNum++;
      invoiceNumber = `INV-${nextNum}`;
    }

    const newInvoice = await prisma.invoice.create({
      data: {
        customer_id: targetCustomerId,
        invoice_number: invoiceNumber,
        amount,
        currency,
        due_date: dueDate ? new Date(dueDate) : null,
        status,
        notes: notes || null,
        source_transcript: sourceTranscript || null,
      },
      include: { customer: true },
    });

    // If dueDate provided and status is pending, schedule default reminder
    if (dueDate && status === 'pending') {
      await prisma.reminder.create({
        data: {
          invoice_id: newInvoice.id,
          remind_at: new Date(dueDate),
          channel: 'dashboard',
          status: 'scheduled',
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        invoice: {
          id: newInvoice.id,
          invoiceNumber: newInvoice.invoice_number,
          customerName: newInvoice.customer.name,
          amount: Number(newInvoice.amount),
          status: newInvoice.status,
          dueDate: newInvoice.due_date ? newInvoice.due_date.toISOString().split('T')[0] : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
