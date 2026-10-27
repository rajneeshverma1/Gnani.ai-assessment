import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { CreateCustomerSchema } from '@/lib/validations';


// GET /api/customers?q=search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    const whereClause: any = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        invoices: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Compute aggregated metrics for each customer
    const data = customers.map((c) => {
      const invoiceCount = c.invoices.length;
      const outstandingAmount = c.invoices
        .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + Number(inv.amount), 0);
      const totalBilled = c.invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        language: c.language,
        invoiceCount,
        outstandingAmount,
        totalBilled,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    });

    return NextResponse.json({ success: true, customers: data });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = CreateCustomerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, errors: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: validated.data.name.trim(),
        phone: validated.data.phone?.trim() || null,
        email: validated.data.email?.trim() || null,
        language: validated.data.language || 'hi-IN',
      },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
