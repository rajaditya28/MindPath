import { NextRequest } from 'next/server';
import { getGeminiClient, MODELS, PROMPTS, parseJsonResponse, generateWithGemini } from '@/lib/gemini';
import { createSuccessResponse, createErrorResponse, sanitizeInput, validateRequired, rateLimit, getClientIp } from '@/lib/security';
import { saveDocument, queryByUser, COLLECTIONS } from '@/lib/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Type } from '@google/genai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return createErrorResponse('Missing userId', 400);

    const paths = await queryByUser(COLLECTIONS.LEARNING_PATHS, userId);
    return createSuccessResponse(paths);
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    return createErrorResponse('Failed to fetch learning paths.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return createErrorResponse('Rate limit exceeded. Please try again later.', 429);
    }

    const body = await request.json();
    const validation = validateRequired({ topic: body.topic });
    if (validation) return createErrorResponse(validation);

    const topic = sanitizeInput(body.topic);
    const difficulty = body.difficulty || 'beginner';
    const userGoal = body.goal ? sanitizeInput(body.goal) : '';
    const userId = body.userId as string | undefined;

    const prompt = `Topic: ${topic}
Difficulty Level: ${difficulty}
${userGoal ? `User's Goal: ${userGoal}` : ''}

Generate a comprehensive learning path for this topic.`;

    type PathData = {
      title: string; description: string; estimatedHours: number; difficulty: string;
      lessons: Array<{ id?: string; title: string; description: string; order: number; estimatedMinutes: number; topics: string[] }>;
    };

    let pathData: PathData;
    try {
      const client = getGeminiClient();
      const structuredResponse = await client.models.generateContent({
        model: MODELS.FLASH,
        contents: prompt,
        config: {
          systemInstruction: PROMPTS.GENERATE_LEARNING_PATH,
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedHours: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              lessons: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    order: { type: Type.NUMBER },
                    estimatedMinutes: { type: Type.NUMBER },
                    topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['title', 'description', 'order', 'estimatedMinutes', 'topics'],
                },
              },
            },
            required: ['title', 'description', 'estimatedHours', 'difficulty', 'lessons'],
          },
        },
      });
      pathData = parseJsonResponse<PathData>(structuredResponse.text || '{}');
    } catch {
      const rawResponse = await generateWithGemini(prompt, PROMPTS.GENERATE_LEARNING_PATH);
      pathData = parseJsonResponse<PathData>(rawResponse);
    }

    const lessons = pathData.lessons.map((lesson, index) => ({
      ...lesson,
      id: lesson.id || uuidv4(),
      order: index + 1,
      status: index === 0 ? 'available' : 'locked',
    }));

    const id = uuidv4();
    const learningPath = {
      id,
      title: pathData.title,
      description: pathData.description,
      topic,
      difficulty: pathData.difficulty || difficulty,
      estimatedHours: pathData.estimatedHours,
      lessons,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      progress: 0,
      ...(userId ? { userId } : {}),
    };

    if (userId) {
      await saveDocument(COLLECTIONS.LEARNING_PATHS, id, learningPath);
    }

    return createSuccessResponse(learningPath);
  } catch (error) {
    console.error('Error generating learning path:', error);
    return createErrorResponse('Failed to generate learning path. Please try again.', 500);
  }
}
