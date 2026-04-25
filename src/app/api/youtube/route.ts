import { NextRequest } from 'next/server';
import { searchYouTubeVideos } from '@/lib/google-services';
import { createSuccessResponse, createErrorResponse, sanitizeInput, rateLimit, getClientIp } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return createErrorResponse('Rate limit exceeded.', 429);
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('max') || '5');

    if (!query) return createErrorResponse('Missing query parameter "q"');

    const videos = await searchYouTubeVideos(sanitizeInput(query), Math.min(maxResults, 10));
    return createSuccessResponse({ videos });
  } catch (error) {
    console.error('YouTube search error:', error);
    return createErrorResponse('YouTube search unavailable.', 503);
  }
}
