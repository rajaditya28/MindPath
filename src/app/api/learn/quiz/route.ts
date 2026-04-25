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
    const { lessonTitle, lessonContent, difficulty, previousScore } = body;
    if (!lessonTitle) return createErrorResponse('Missing lessonTitle');

    const adaptiveNote = previousScore !== undefined
      ? `The student scored ${previousScore}% on their last quiz. ${
          previousScore < 50 ? 'Generate easier questions to build confidence.' :
          previousScore < 75 ? 'Generate medium difficulty questions.' :
          'Generate challenging questions to push their understanding.'
        }`
      : '';

    const prompt = `Generate a quiz for the lesson: "${sanitizeInput(lessonTitle)}"
${lessonContent ? `Lesson content summary: ${sanitizeInput(lessonContent).slice(0, 1000)}` : ''}
Difficulty: ${difficulty || 'medium'}
${adaptiveNote}

Create exactly 5 questions that test understanding, not just memorization.`;

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: MODELS.FLASH,
      contents: prompt,
      config: {
        systemInstruction: PROMPTS.GENERATE_QUIZ,
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'difficulty'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const text = response.text || '{}';
    const quizData = JSON.parse(text);
    return createSuccessResponse(quizData);
  } catch (error) {
    console.error('Error generating quiz:', error);
    return createErrorResponse('Failed to generate quiz.', 500);
  }
}
