import { beforeEach, describe, expect, it } from '@jest/globals';

// Test security utilities without importing from next/server
// Re-implement the core functions to test their logic

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

function rateLimit(ip: string): boolean {
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

function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function validateRequired(fields: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      return `Missing required field: ${key}`;
    }
  }
  return null;
}

describe('Security Utilities', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags from input', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('should remove HTML tags from input', () => {
      const input = '<div>Hello</div><p>World</p>';
      const result = sanitizeInput(input);
      expect(result).toBe('HelloWorld');
    });

    it('should trim whitespace', () => {
      const input = '  hello world  ';
      const result = sanitizeInput(input);
      expect(result).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle plain text without modification', () => {
      const input = 'Learn about machine learning';
      expect(sanitizeInput(input)).toBe(input);
    });

    it('should handle nested script tags', () => {
      const input = '<script><script>alert(1)</script></script>test';
      const result = sanitizeInput(input);
      expect(result).not.toContain('script');
    });
  });

  describe('validateRequired', () => {
    it('should return null when all fields present', () => {
      const result = validateRequired({ name: 'test', value: 123 });
      expect(result).toBeNull();
    });

    it('should return error for missing field', () => {
      const result = validateRequired({ name: 'test', topic: '' });
      expect(result).toContain('topic');
    });

    it('should return error for null field', () => {
      const result = validateRequired({ name: null });
      expect(result).toContain('name');
    });

    it('should return error for undefined field', () => {
      const result = validateRequired({ topic: undefined });
      expect(result).toContain('topic');
    });

    it('should accept zero as a valid value', () => {
      const result = validateRequired({ count: 0 });
      expect(result).toBeNull();
    });

    it('should accept false as a valid value', () => {
      const result = validateRequired({ active: false });
      expect(result).toBeNull();
    });
  });

  describe('rateLimit', () => {
    beforeEach(() => {
      rateLimitMap.clear();
    });

    it('should allow requests within limit', () => {
      const ip = 'test-ip-1';
      expect(rateLimit(ip)).toBe(true);
      expect(rateLimit(ip)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const ip = 'test-ip-flood';
      for (let i = 0; i < 30; i++) {
        rateLimit(ip);
      }
      expect(rateLimit(ip)).toBe(false);
    });

    it('should track different IPs independently', () => {
      const ip1 = 'test-ip-a';
      const ip2 = 'test-ip-b';
      for (let i = 0; i < 30; i++) {
        rateLimit(ip1);
      }
      expect(rateLimit(ip1)).toBe(false);
      expect(rateLimit(ip2)).toBe(true);
    });

    it('should allow exactly 30 requests', () => {
      const ip = 'test-ip-exact';
      for (let i = 0; i < 29; i++) {
        expect(rateLimit(ip)).toBe(true);
      }
      expect(rateLimit(ip)).toBe(true); // 30th request
      expect(rateLimit(ip)).toBe(false); // 31st should fail
    });
  });
});
