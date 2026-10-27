import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { UpdateInvoiceSchema } from '@/lib/validations';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = UpdateInvoiceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        ...(validated.data.status && { status: validated.data.status }),
        ...(validated.data.amount && { amount: validated.data.amount }),
        ...(validated.data.dueDate !== undefined && {
          due_date: validated.data.dueDate ? new Date(validated.data.dueDate) : null,
        }),
        ...(validated.data.notes !== undefined && { notes: validated.data.notes }),
      },
      include: { customer: true },
    });

    return NextResponse.json({
      success: true,
      invoice: {
        id: updated.id,
        invoiceNumber: updated.invoice_number,
        customerName: updated.customer.name,
        amount: Number(updated.amount),
        status: updated.status,
        dueDate: updated.due_date ? updated.due_date.toISOString().split('T')[0] : null,
      },
    });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
