import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { CreateReminderSchema } from '@/lib/validations';

// POST /api/reminders
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateReminderSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { invoiceId, remindAt, channel } = validated.data;

    const reminder = await prisma.reminder.create({
      data: {
        invoice_id: invoiceId,
        remind_at: new Date(remindAt),
        channel: channel || 'dashboard',
        status: 'scheduled',
      },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });

    return NextResponse.json({ success: true, reminder }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
