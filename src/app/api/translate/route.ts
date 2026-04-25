import { NextRequest } from 'next/server';
import { translateText } from '@/lib/google-services';
import { createSuccessResponse, createErrorResponse, sanitizeInput, rateLimit, getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return createErrorResponse('Rate limit exceeded.', 429);
    }

    const body = await request.json();
    const { text, targetLanguage } = body;

    if (!text || !targetLanguage) {
      return createErrorResponse('Missing text or targetLanguage');
    }

    const translated = await translateText(sanitizeInput(text), targetLanguage);
    return createSuccessResponse({ translatedText: translated, targetLanguage });
  } catch (error) {
    console.error('Translation error:', error);
    return createErrorResponse('Translation service unavailable.', 503);
  }
}
