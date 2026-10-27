import { NextRequest, NextResponse } from 'next/server';
import { processVoiceCommand } from '@/lib/gnani';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Protection (Section 14: Rate-limit /api/voice/command)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(ip, 40, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait a few seconds before sending another voice command.',
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)) } }
      );
    }

    // 2. Parse payload
    const body = await req.json();
    const { audioBase64, mimeType = 'audio/webm', language = 'hi-IN', text } = body;

    if (!audioBase64 && !text) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either audioBase64 or text command is required.',
        },
        { status: 400 }
      );
    }

    // 3. Process through Gnani Pipeline
    const result = await processVoiceCommand({
      audioBase64,
      mimeType,
      language: language as any,
      textOverride: text,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('Error in /api/voice/command:', err);
    // User-friendly error; never expose raw stack traces
    return NextResponse.json(
      {
        success: false,
        error: 'An internal error occurred while processing the voice command.',
        replyText: 'Kuch gadbad ho gayi. Kripya thodi der baad dobara koshish karein.',
      },
      { status: 500 }
    );
  }
}
