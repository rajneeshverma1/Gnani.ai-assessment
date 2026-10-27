import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runSeed() {
  console.log('🌱 Starting Vyapar Voice database seed...');

  // Clean existing records in reverse dependency order
  await prisma.voiceEvent.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.customer.deleteMany();

  // Helper date generators
  const now = new Date();
  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  const subDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  // 1. Seed 8 Indian SMB Customers
  const ravi = await prisma.customer.create({
    data: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      email: 'ravi.kumar@gmail.com',
      language: 'hi-IN',
    },
  });

  const sunita = await prisma.customer.create({
    data: {
      name: 'Sunita Sharma',
      phone: '+91 98765 43211',
      email: 'sunita.sharma@sharmatextiles.in',
      language: 'hi-IN',
    },
  });

  const rajesh = await prisma.customer.create({
    data: {
      name: 'Rajesh Patel',
      phone: '+91 98200 12345',
      email: 'rajesh.patel@pateltraders.com',
      language: 'hi-IN',
    },
  });

  const amit = await prisma.customer.create({
    data: {
      name: 'Amit Verma',
      phone: '+91 98111 22334',
      email: 'amit.verma@vermaelec.com',
      language: 'en-IN',
    },
  });

  const priya = await prisma.customer.create({
    data: {
      name: 'Priya Singh',
      phone: '+91 98450 99887',
      email: 'priya@singhorganics.com',
      language: 'hi-IN',
    },
  });

  const faizan = await prisma.customer.create({
    data: {
      name: 'Mohammed Faizan',
      phone: '+91 97333 44556',
      email: 'faizan.spares@gmail.com',
      language: 'hi-IN',
    },
  });

  const deepa = await prisma.customer.create({
    data: {
      name: 'Deepa Nair',
      phone: '+91 94470 11223',
      email: 'deepa@kochispices.com',
      language: 'en-IN',
    },
  });

  const vikram = await prisma.customer.create({
    data: {
      name: 'Vikram Malhotra',
      phone: '+91 99888 77665',
      email: 'vikram@malhotrahardware.in',
      language: 'hi-IN',
    },
  });

  console.log('✅ Seeded 8 customers');

  // 2. Seed 12 Invoices
  const inv1 = await prisma.invoice.create({
    data: {
      customer_id: ravi.id,
      invoice_number: 'INV-1001',
      amount: 2500.0,
      currency: 'INR',
      due_date: addDays(4),
      status: 'pending',
      notes: 'Hardware fittings and PVC pipes supplied',
      source_transcript: 'Ravi Kumar ko 2500 ka invoice banao, payment Friday tak',
    },
  });

  const inv2 = await prisma.invoice.create({
    data: {
      customer_id: ravi.id,
      invoice_number: 'INV-1002',
      amount: 7800.0,
      currency: 'INR',
      due_date: subDays(15),
      status: 'paid',
      notes: 'Bulk electrical wire spools',
      source_transcript: 'Ravi Kumar ko 7800 ka invoice banao last week ka',
    },
  });

  const inv3 = await prisma.invoice.create({
    data: {
      customer_id: sunita.id,
      invoice_number: 'INV-1003',
      amount: 14500.0,
      currency: 'INR',
      due_date: addDays(2),
      status: 'pending',
      notes: 'Cotton dress material roll lot #402',
      source_transcript: 'Sunita Sharma ko 14500 ka bill banao 2 din mein payment',
    },
  });

  const inv4 = await prisma.invoice.create({
    data: {
      customer_id: sunita.id,
      invoice_number: 'INV-1004',
      amount: 6200.0,
      currency: 'INR',
      due_date: subDays(8),
      status: 'paid',
      notes: 'Silk borders and lace accessories',
      source_transcript: 'Sunita Sharma ka purana invoice paid mark karo',
    },
  });

  const inv5 = await prisma.invoice.create({
    data: {
      customer_id: rajesh.id,
      invoice_number: 'INV-1005',
      amount: 32000.0,
      currency: 'INR',
      due_date: addDays(6),
      status: 'pending',
      notes: 'Industrial grade bearings x50 units',
      source_transcript: 'Rajesh Patel ko 32000 ka invoice banao agle hafte tak',
    },
  });

  const inv6 = await prisma.invoice.create({
    data: {
      customer_id: rajesh.id,
      invoice_number: 'INV-1006',
      amount: 18500.0,
      currency: 'INR',
      due_date: subDays(20),
      status: 'paid',
      notes: 'Machine lubricants & grease drums',
    },
  });

  const inv7 = await prisma.invoice.create({
    data: {
      customer_id: amit.id,
      invoice_number: 'INV-1007',
      amount: 9400.0,
      currency: 'INR',
      due_date: subDays(4),
      status: 'overdue',
      notes: 'Switchboards and modular switches batch',
      source_transcript: 'Amit Verma ko 9400 ka bill banao',
    },
  });

  const inv8 = await prisma.invoice.create({
    data: {
      customer_id: priya.id,
      invoice_number: 'INV-1008',
      amount: 5600.0,
      currency: 'INR',
      due_date: addDays(3),
      status: 'pending',
      notes: 'Cold-pressed coconut & mustard oil cartons',
      source_transcript: 'Priya Singh ko 5600 ka invoice banao 3 din tak',
    },
  });

  const inv9 = await prisma.invoice.create({
    data: {
      customer_id: faizan.id,
      invoice_number: 'INV-1009',
      amount: 11200.0,
      currency: 'INR',
      due_date: subDays(5),
      status: 'paid',
      notes: 'Two-wheeler brake shoes and clutch cables',
    },
  });

  const inv10 = await prisma.invoice.create({
    data: {
      customer_id: faizan.id,
      invoice_number: 'INV-1010',
      amount: 4300.0,
      currency: 'INR',
      due_date: addDays(5),
      status: 'pending',
      notes: 'Spark plugs and engine oil filters',
      source_transcript: 'Faizan ko 4300 ka invoice banao Friday tak',
    },
  });

  const inv11 = await prisma.invoice.create({
    data: {
      customer_id: deepa.id,
      invoice_number: 'INV-1011',
      amount: 24000.0,
      currency: 'INR',
      due_date: subDays(12),
      status: 'paid',
      notes: 'Premium Malabar black pepper 50kg bag',
    },
  });

  const inv12 = await prisma.invoice.create({
    data: {
      customer_id: vikram.id,
      invoice_number: 'INV-1012',
      amount: 8900.0,
      currency: 'INR',
      due_date: subDays(2),
      status: 'cancelled',
      notes: 'Order cancelled due to item specification change',
      source_transcript: 'Vikram Malhotra ka quotation cancel kar do',
    },
  });

  console.log('✅ Seeded 12 invoices across pending, paid, overdue, and cancelled');

  // 3. Seed Reminders for upcoming due dates (within next 7 days)
  await prisma.reminder.create({
    data: {
      invoice_id: inv1.id,
      remind_at: addDays(2),
      channel: 'dashboard',
      status: 'scheduled',
    },
  });

  await prisma.reminder.create({
    data: {
      invoice_id: inv3.id,
      remind_at: addDays(1),
      channel: 'dashboard',
      status: 'scheduled',
    },
  });

  await prisma.reminder.create({
    data: {
      invoice_id: inv8.id,
      remind_at: addDays(3),
      channel: 'dashboard',
      status: 'scheduled',
    },
  });

  console.log('✅ Seeded 3 reminders');

  // 4. Seed sample Voice Events in history
  await prisma.voiceEvent.create({
    data: {
      transcript: 'Ravi Kumar ko 2500 ka invoice banao, payment Friday tak',
      detected_language: 'hi-IN',
      parsed_intent: {
        action: 'create_invoice',
        customer_name: 'Ravi Kumar',
        amount: 2500,
        currency: 'INR',
        due_date: addDays(4).toISOString().split('T')[0],
        language: 'hi-IN',
        confidence: 0.96,
        missing_fields: [],
      },
      action_status: 'success',
      response_text: 'Ravi Kumar ke liye 2,500 rupee ka invoice ban gaya hai.',
      stt_latency_ms: 780,
      llm_latency_ms: 940,
      tts_latency_ms: 820,
    },
  });

  await prisma.voiceEvent.create({
    data: {
      transcript: 'Sunita Sharma ka invoice paid mark karo',
      detected_language: 'hi-IN',
      parsed_intent: {
        action: 'mark_paid',
        customer_name: 'Sunita Sharma',
        phone: null,
        amount: null,
        currency: 'INR',
        due_date: null,
        reminder_date: null,
        language: 'hi-IN',
        confidence: 0.94,
        missing_fields: [],
      },
      action_status: 'success',
      response_text: 'Sunita Sharma ka invoice paid mark kar diya gaya.',
      stt_latency_ms: 690,
      llm_latency_ms: 880,
      tts_latency_ms: 750,
    },
  });

  console.log('✅ Seeded voice events history');
  console.log('🎉 Vyapar Voice seeding completed successfully!');
}

if (require.main === module) {
  runSeed()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
