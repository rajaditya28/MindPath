import { NextRequest } from 'next/server';
import { analyzeImage } from '@/lib/google-services';
import { generateWithGemini } from '@/lib/gemini';
import { createSuccessResponse, createErrorResponse, rateLimit, getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return createErrorResponse('Rate limit exceeded.', 429);
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) return createErrorResponse('No image provided');

    const buffer = Buffer.from(await file.arrayBuffer());
    const analysis = await analyzeImage(buffer);

    // Use Gemini to generate learning insights from the image analysis
    const prompt = `Based on image analysis:
Labels: ${analysis.labels.join(', ')}
Text found: ${analysis.text || 'None'}

Generate a brief educational explanation about what's in this image. If there's text (like a textbook page, diagram, or notes), explain the concepts. If it's an object or scene, provide interesting educational facts about it.`;

    const explanation = await generateWithGemini(prompt);

    return createSuccessResponse({
      labels: analysis.labels,
      text: analysis.text,
      explanation,
    });
  } catch (error) {
    console.error('Vision error:', error);
    return createErrorResponse('Image analysis service unavailable.', 503);
  }
}
