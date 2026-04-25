import { NextRequest } from 'next/server';
import { getGeminiClient, MODELS, PROMPTS } from '@/lib/gemini';
import { createSuccessResponse, createErrorResponse, sanitizeInput, rateLimit, getClientIp } from '@/lib/security';
import { Type } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return createErrorResponse('Rate limit exceeded.', 429);
    }

    const body = await request.json();
    const { lessonTitle, lessonDescription, pathTopic, difficulty } = body;
    if (!lessonTitle) return createErrorResponse('Missing lessonTitle');

    const prompt = `Generate a detailed lesson for:
Title: ${sanitizeInput(lessonTitle)}
Description: ${sanitizeInput(lessonDescription || '')}
Part of learning path: ${sanitizeInput(pathTopic || '')}
Difficulty: ${difficulty || 'beginner'}

Create engaging, thorough educational content with clear explanations, examples, and practice exercises.`;

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: MODELS.FLASH,
      contents: prompt,
      config: {
        systemInstruction: PROMPTS.GENERATE_LESSON_CONTENT,
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            practiceExercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['question', 'hint'],
              },
            },
          },
          required: ['title', 'content', 'keyTakeaways', 'practiceExercises'],
        },
      },
    });

    const text = response.text || '{}';
    const lessonData = JSON.parse(text);
    return createSuccessResponse(lessonData);
  } catch (error) {
    console.error('Error generating lesson:', error);
    return createErrorResponse('Failed to generate lesson content.', 500);
  }
}
