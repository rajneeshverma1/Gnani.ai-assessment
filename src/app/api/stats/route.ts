import { NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function GET() {
  try {
    const [customerCount, invoices, voiceEvents, upcomingRemindersCount] = await Promise.all([
      prisma.customer.count(),
      prisma.invoice.findMany({
        select: {
          id: true,
          amount: true,
          status: true,
        },
      }),
      prisma.voiceEvent.findMany({
        select: {
          action_status: true,
          stt_latency_ms: true,
          llm_latency_ms: true,
          tts_latency_ms: true,
        },
      }),
      prisma.reminder.count({
        where: {
          remind_at: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 86400000),
          },
        },
      }),
    ]);

    let pendingCount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let paidAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let totalBilled = 0;

    for (const inv of invoices) {
      const amt = Number(inv.amount);
      totalBilled += amt;
      if (inv.status === 'pending') {
        pendingCount++;
        pendingAmount += amt;
      } else if (inv.status === 'paid') {
        paidCount++;
        paidAmount += amt;
      } else if (inv.status === 'overdue') {
        overdueCount++;
        overdueAmount += amt;
      }
    }

    // Voice analytics
    const totalVoiceCommands = voiceEvents.length;
    const successfulVoiceCommands = voiceEvents.filter((v) => v.action_status === 'success').length;
    const successRate =
      totalVoiceCommands > 0
        ? Math.round((successfulVoiceCommands / totalVoiceCommands) * 100)
        : 100;

    let totalStt = 0;
    let totalLlm = 0;
    let totalTts = 0;
    let countLat = 0;

    for (const v of voiceEvents) {
      if (v.stt_latency_ms && v.llm_latency_ms && v.tts_latency_ms) {
        totalStt += v.stt_latency_ms;
        totalLlm += v.llm_latency_ms;
        totalTts += v.tts_latency_ms;
        countLat++;
      }
    }

    const avgLatency = countLat > 0
      ? {
          sttMs: Math.round(totalStt / countLat),
          llmMs: Math.round(totalLlm / countLat),
          ttsMs: Math.round(totalTts / countLat),
          totalMs: Math.round((totalStt + totalLlm + totalTts) / countLat),
        }
      : { sttMs: 780, llmMs: 950, ttsMs: 820, totalMs: 2550 };

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers: customerCount,
        totalInvoices: invoices.length,
        pendingInvoices: pendingCount,
        pendingAmount,
        paidInvoices: paidCount,
        paidAmount,
        overdueInvoices: overdueCount,
        overdueAmount,
        totalAmountDue: pendingAmount + overdueAmount,
        totalBilled,
        upcomingRemindersCount,
        voiceAnalytics: {
          totalCommands: totalVoiceCommands,
          successRate,
          avgLatency,
        },
      },
    });
  } catch (error: any) {
    console.error('Error computing stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute dashboard stats' },
      { status: 500 }
    );
  }
}
