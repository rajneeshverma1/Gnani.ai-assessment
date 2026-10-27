import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { UpdateCustomerSchema } from '@/lib/validations';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = UpdateCustomerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(validated.data.name && { name: validated.data.name.trim() }),
        ...(validated.data.phone !== undefined && { phone: validated.data.phone?.trim() || null }),
        ...(validated.data.email !== undefined && { email: validated.data.email?.trim() || null }),
        ...(validated.data.language && { language: validated.data.language }),
      },
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
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
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
