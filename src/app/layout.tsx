import type { Metadata, Viewport } from 'next';
import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Vyapar Voice | Voice-First AI Billing & Customer Assistant for Indian Small Businesses',
  description:
    'Create invoices, manage customers, check payment status, and schedule reminders using natural spoken commands in Hindi, English, and Hinglish. Powered by Gnani AI (Prisma v2.5 STT, Evon v3.3 LLM, Timbre v2.5 TTS).',
  keywords: [
    'Vyapar Voice',
    'Gnani AI',
    'Voice Billing',
    'Indian Small Business',
    'GST Invoicing',
    'Prisma STT',
    'Evon LLM',
    'Timbre TTS',
    'Hinglish AI',
  ],
  authors: [{ name: 'Vyapar Voice Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${jetbrainsMono.variable} dark antialiased`}>
      <body className="min-h-screen bg-[#1c2028] text-[#f2f4f8] font-sans selection:bg-[#6c3cf5]/30 selection:text-[#b39dff]">
        {children}
      </body>
    </html>
  );
}
