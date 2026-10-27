import { NextResponse } from 'next/server';
import { runSeed } from '../../../../prisma/seed';

export async function POST() {
  try {
    await runSeed();
    return NextResponse.json({
      success: true,
      message: 'Database reset and seeded with 8 demo customers and 12 invoices successfully!',
    });
  } catch (error: any) {
    console.error('Error seeding database via API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}
