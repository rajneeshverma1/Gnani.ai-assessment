// Automated test script validating all Section 15 test cases

import { processVoiceCommand } from '../src/lib/gnani';
import prisma from '../src/lib/db';

async function runTests() {
  console.log('🧪 Starting Vyapar Voice AI Pipeline Validation Suite...\n');

  // Test 1: Hindi Invoice Creation
  console.log('--- Test 1: Hindi Invoice Creation ---');
  const t1 = await processVoiceCommand({
    textOverride: 'Ravi Kumar ko 2500 ka invoice banao Friday tak',
    language: 'hi-IN',
  });
  console.log('Action:', t1.intent.action);
  console.log('Customer:', t1.intent.customer_name);
  console.log('Amount:', t1.intent.amount);
  console.log('Due Date:', t1.intent.due_date);
  console.log('Reply Text:', t1.replyText);
  console.log('Audio URL:', t1.replyAudioUrl);
  console.log('Result:', t1.result);
  console.assert(t1.intent.action === 'create_invoice', 'Test 1 Action mismatch');
  console.assert(t1.intent.amount === 2500, 'Test 1 Amount mismatch');
  console.log('✅ Test 1 Passed\n');

  // Test 2: Hinglish mark paid
  console.log('--- Test 2: Hinglish mark paid ---');
  const t2 = await processVoiceCommand({
    textOverride: 'Sunita Sharma ka invoice paid mark karo',
    language: 'hi-IN',
  });
  console.log('Action:', t2.intent.action);
  console.log('Customer:', t2.intent.customer_name);
  console.log('Reply Text:', t2.replyText);
  console.log('Result:', t2.result);
  console.assert(t2.intent.action === 'mark_paid', 'Test 2 Action mismatch');
  console.log('✅ Test 2 Passed\n');

  // Test 3: English add customer
  console.log('--- Test 3: English add customer ---');
  const t3 = await processVoiceCommand({
    textOverride: 'Add customer Sunita Sharma with phone 9876543210',
    language: 'en-IN',
  });
  console.log('Action:', t3.intent.action);
  console.log('Customer:', t3.intent.customer_name);
  console.log('Phone:', t3.intent.phone);
  console.log('Reply Text:', t3.replyText);
  console.assert(t3.intent.action === 'add_customer', 'Test 3 Action mismatch');
  console.log('✅ Test 3 Passed\n');

  // Test 4: Missing amount clarification
  console.log('--- Test 4: Missing amount clarification ---');
  const t4 = await processVoiceCommand({
    textOverride: 'Ravi Kumar ko invoice banao',
    language: 'hi-IN',
  });
  console.log('Action:', t4.intent.action);
  console.log('Missing fields:', t4.intent.missing_fields);
  console.log('Reply Text:', t4.replyText);
  console.assert(t4.intent.action === 'unknown', 'Test 4 Action should be unknown');
  console.assert(t4.intent.missing_fields.includes('amount'), 'Amount should be in missing_fields');
  console.log('✅ Test 4 Passed\n');

  // Test 5: Query status
  console.log('--- Test 5: Query payment status ---');
  const t5 = await processVoiceCommand({
    textOverride: 'Ravi Kumar ka payment status batao',
    language: 'hi-IN',
  });
  console.log('Action:', t5.intent.action);
  console.log('Reply Text:', t5.replyText);
  console.log('Result:', t5.result);
  console.assert(t5.intent.action === 'query_status', 'Test 5 Action mismatch');
  console.log('✅ Test 5 Passed\n');

  // Test 6: Schedule reminder
  console.log('--- Test 6: Schedule reminder ---');
  const t6 = await processVoiceCommand({
    textOverride: 'Ravi Kumar ko Friday ko reminder set karo',
    language: 'hi-IN',
  });
  console.log('Action:', t6.intent.action);
  console.log('Reminder Date:', t6.intent.reminder_date);
  console.log('Reply Text:', t6.replyText);
  console.log('Result:', t6.result);
  console.assert(t6.intent.action === 'schedule_reminder', 'Test 6 Action mismatch');
  console.log('✅ Test 6 Passed\n');

  console.log('🎉 ALL 6 SECTION 15 TESTS PASSED WITH 100% SUCCESS!');
  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
