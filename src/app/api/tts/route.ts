import { NextRequest } from 'next/server';
import { synthesizeSpeech } from '@/lib/google-services';
import { createErrorResponse, rateLimit, getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return createErrorResponse('Rate limit exceeded.', 429);
    }

    const body = await request.json();
    const { text, languageCode } = body;

    if (!text) return createErrorResponse('Missing text');

    // Limit text length for TTS
    const truncatedText = text.slice(0, 5000);
    const audioBuffer = await synthesizeSpeech(truncatedText, languageCode || 'en-US');
    const uint8 = new Uint8Array(audioBuffer);

    return new Response(uint8, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': uint8.length.toString(),
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return createErrorResponse('Text-to-speech service unavailable.', 503);
  }
}
