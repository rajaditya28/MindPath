import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export const MODELS = {
  FLASH: 'gemini-2.5-flash',
} as const;

export const PROMPTS = {
  GENERATE_LEARNING_PATH: `You are MindPath, an expert educational AI. Generate a personalized learning path for the given topic.
Return a valid JSON object with this exact structure:
{
  "title": "Learning Path Title",
  "description": "Brief description of what the learner will achieve",
  "estimatedHours": <number>,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "lessons": [
    {
      "id": "<unique-id>",
      "title": "Lesson Title",
      "description": "What this lesson covers",
      "order": <number>,
      "estimatedMinutes": <number>,
      "topics": ["topic1", "topic2"]
    }
  ]
}
Generate 5-8 lessons that progressively build knowledge. Be specific and practical.`,

  GENERATE_LESSON_CONTENT: `You are MindPath, an expert teacher. Generate detailed lesson content.
Return a valid JSON object:
{
  "title": "Lesson Title",
  "content": "<detailed markdown content with headings, examples, code snippets if relevant, and explanations>",
  "keyTakeaways": ["takeaway1", "takeaway2", "takeaway3"],
  "practiceExercises": [
    { "question": "exercise question", "hint": "helpful hint" }
  ]
}
Make the content engaging, clear, and thorough. Use markdown formatting with headers, bullet points, code blocks where appropriate, and real-world examples.`,

  GENERATE_QUIZ: `You are MindPath quiz generator. Create an adaptive quiz based on the lesson content.
Return a valid JSON object:
{
  "questions": [
    {
      "id": "<unique-id>",
      "question": "The question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": <0-3>,
      "explanation": "Why this answer is correct",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}
Generate exactly 5 questions with increasing difficulty. Make questions test understanding, not just memorization.`,

  AI_TUTOR_SYSTEM: `You are MindPath AI Tutor — a patient, encouraging, and knowledgeable learning companion.

Your teaching approach:
- Use the Socratic method: guide through questions rather than giving direct answers
- Break complex concepts into digestible pieces
- Provide real-world analogies and examples
- Celebrate progress and encourage persistence
- Adapt explanations to the student's level
- Use markdown formatting for clarity (headers, bullet points, code blocks)
- Keep responses focused and not too long (aim for 150-300 words unless more detail is needed)

If the student is struggling, simplify your explanation. If they're excelling, challenge them further.`,

  ANALYZE_DIFFICULTY: `Analyze the following educational content and return a JSON object:
{
  "readabilityScore": <1-10>,
  "gradeLevel": "<estimated grade level>",
  "complexity": "basic" | "intermediate" | "advanced" | "expert",
  "keyEntities": ["entity1", "entity2"],
  "suggestedPrerequisites": ["prerequisite1", "prerequisite2"]
}`,
};

export async function generateWithGemini(prompt: string, systemInstruction?: string, retries = 3): Promise<string> {
  const client = getGeminiClient();
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model: MODELS.FLASH,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });
      return response.text || '';
    } catch (err: unknown) {
      const isRetryable = err instanceof Error && (
        err.message.includes('503') || err.message.includes('UNAVAILABLE') || err.message.includes('overloaded')
      );
      if (isRetryable && attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function generateStreamingResponse(
  prompt: string,
  systemInstruction?: string
): Promise<AsyncIterable<string>> {
  const client = getGeminiClient();
  const response = await client.models.generateContentStream({
    model: MODELS.FLASH,
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  async function* streamText() {
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  }

  return streamText();
}

export function parseJsonResponse<T>(text: string): T {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}
