import { NextRequest, NextResponse } from 'next/server';

// Rate limiting using in-memory store (suitable for single-instance Cloud Run)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

export function validateRequired(fields: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      return `Missing required field: ${key}`;
    }
  }
  return null;
}

export function createErrorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function createSuccessResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

// Clean up old rate limit entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}
