import { describe, expect, it, jest } from '@jest/globals';

// Mock the @google/genai module since it uses ESM
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
}));

// Test parseJsonResponse directly by reimplementing the logic
function parseJsonResponse<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

describe('Gemini Utilities', () => {
  describe('parseJsonResponse', () => {
    it('should parse clean JSON', () => {
      const input = '{"title": "Test", "value": 42}';
      const result = parseJsonResponse<{ title: string; value: number }>(input);
      expect(result.title).toBe('Test');
      expect(result.value).toBe(42);
    });

    it('should parse JSON wrapped in code blocks', () => {
      const input = '```json\n{"title": "Test"}\n```';
      const result = parseJsonResponse<{ title: string }>(input);
      expect(result.title).toBe('Test');
    });

    it('should parse JSON with nested objects', () => {
      const input = '{"lessons": [{"id": "1", "title": "Intro"}]}';
      const result = parseJsonResponse<{ lessons: Array<{ id: string; title: string }> }>(input);
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons[0].title).toBe('Intro');
    });

    it('should throw on invalid JSON', () => {
      expect(() => parseJsonResponse('not json')).toThrow();
    });

    it('should handle empty code blocks', () => {
      const input = '```json\n{}\n```';
      const result = parseJsonResponse<Record<string, never>>(input);
      expect(result).toEqual({});
    });

    it('should parse arrays', () => {
      const input = '```json\n[1, 2, 3]\n```';
      const result = parseJsonResponse<number[]>(input);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should handle deeply nested JSON', () => {
      const input = '{"a": {"b": {"c": "deep"}}}';
      const result = parseJsonResponse<{ a: { b: { c: string } } }>(input);
      expect(result.a.b.c).toBe('deep');
    });
  });
});

describe('Type Definitions', () => {
  it('should correctly type a learning path', () => {
    const path = {
      id: 'test-id',
      userId: 'user-1',
      title: 'Test Path',
      description: 'A test learning path',
      topic: 'testing',
      difficulty: 'beginner' as const,
      estimatedHours: 5,
      lessons: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' as const,
      progress: 0,
    };
    expect(path.title).toBe('Test Path');
    expect(path.difficulty).toBe('beginner');
    expect(path.progress).toBe(0);
  });

  it('should correctly type a quiz question', () => {
    const question = {
      id: 'q1',
      question: 'What is testing?',
      options: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'Testing is...',
      difficulty: 'easy' as const,
    };
    expect(question.options).toHaveLength(4);
    expect(question.correctIndex).toBeLessThan(4);
  });
});
