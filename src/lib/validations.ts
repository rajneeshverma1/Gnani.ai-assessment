import { z } from 'zod';

export const SupportedActionSchema = z.enum([
  'create_invoice',
  'add_customer',
  'mark_paid',
  'query_status',
  'schedule_reminder',
  'unknown',
]);

export type SupportedAction = z.infer<typeof SupportedActionSchema>;

// Strict Evon v3.3 JSON output schema as per Section 11
export const EvonIntentSchema = z.object({
  action: SupportedActionSchema,
  customer_name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
  currency: z.literal('INR').default('INR'),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .nullable()
    .optional(),
  reminder_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .nullable()
    .optional(),
  language: z.enum(['hi-IN', 'en-IN', 'hinglish']).default('hi-IN'),
  confidence: z.number().min(0).max(1).default(0.9),
  missing_fields: z.array(z.string()).default([]),
});

export type EvonIntent = z.infer<typeof EvonIntentSchema>;

// Voice command request schema
export const VoiceCommandRequestSchema = z.object({
  audioBase64: z.string().optional(),
  mimeType: z.string().default('audio/webm'),
  language: z.enum(['hi-IN', 'en-IN', 'hinglish']).default('hi-IN'),
  text: z.string().optional(), // For quick testing / typed fallback
});

// Customer CRUD schemas
export const CreateCustomerSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  language: z.string().default('hi-IN'),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

// Invoice CRUD schemas
export const CreateInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().default('INR'),
  dueDate: z.string().optional().nullable(), // YYYY-MM-DD
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  notes: z.string().optional().nullable(),
  sourceTranscript: z.string().optional().nullable(),
});

export const UpdateInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Reminder CRUD schema
export const CreateReminderSchema = z.object({
  invoiceId: z.string().uuid(),
  remindAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  channel: z.string().default('dashboard'),
});
