import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    const events = await prisma.voiceEvent.findMany({
      orderBy: { created_at: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });

    return NextResponse.json({
      success: true,
      events: events.map((ev) => ({
        id: ev.id,
        transcript: ev.transcript,
        detectedLanguage: ev.detected_language,
        parsedIntent: ev.parsed_intent,
        actionStatus: ev.action_status,
        responseText: ev.response_text,
        sttLatencyMs: ev.stt_latency_ms,
        llmLatencyMs: ev.llm_latency_ms,
        ttsLatencyMs: ev.tts_latency_ms,
        totalLatencyMs:
          (ev.stt_latency_ms || 0) + (ev.llm_latency_ms || 0) + (ev.tts_latency_ms || 0),
        errorMessage: ev.error_message,
        createdAt: ev.created_at,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching voice history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch voice history' },
      { status: 500 }
    );
  }
}
