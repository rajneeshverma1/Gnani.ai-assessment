import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const audioPath = path.join(process.cwd(), 'public', 'audio', safeFilename);

    if (!fs.existsSync(audioPath)) {
      return new NextResponse('Audio file not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(audioPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error streaming audio:', error);
    return new NextResponse('Failed to retrieve audio', { status: 500 });
  }
}
