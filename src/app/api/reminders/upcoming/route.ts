import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);

    const reminders = await prisma.reminder.findMany({
      where: {
        remind_at: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Include today
          lte: next7Days,
        },
      },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
      orderBy: { remind_at: 'asc' },
    });

    const formatted = reminders.map((r) => ({
      id: r.id,
      invoiceId: r.invoice_id,
      invoiceNumber: r.invoice.invoice_number,
      customerName: r.invoice.customer.name,
      customerPhone: r.invoice.customer.phone,
      amount: Number(r.invoice.amount),
      invoiceStatus: r.invoice.status,
      remindAt: r.remind_at,
      channel: r.channel,
      status: r.status,
      createdAt: r.created_at,
    }));

    return NextResponse.json({ success: true, reminders: formatted });
  } catch (error: any) {
    console.error('Error fetching upcoming reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch upcoming reminders' },
      { status: 500 }
    );
  }
}
