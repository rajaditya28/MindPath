import { NextRequest } from 'next/server';
import { analyzeContent } from '@/lib/google-services';
import { createSuccessResponse, createErrorResponse, sanitizeInput, rateLimit, getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return createErrorResponse('Rate limit exceeded.', 429);
    }

    const body = await request.json();
    const { text } = body;

    if (!text) return createErrorResponse('Missing text');

    const analysis = await analyzeContent(sanitizeInput(text));
    return createSuccessResponse(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return createErrorResponse('Content analysis service unavailable.', 503);
  }
}
