import { NextRequest } from 'next/server';
import { generateStreamingResponse, PROMPTS } from '@/lib/gemini';
import { sanitizeInput, rateLimit, getClientIp } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(getClientIp(request))) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { message, context, history } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sanitizedMessage = sanitizeInput(message);
    const historyContext = (history || [])
      .slice(-6)
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}${context ? `Learning context: ${sanitizeInput(context)}\n\n` : ''}Student: ${sanitizedMessage}`;

    const stream = await generateStreamingResponse(prompt, PROMPTS.AI_TUTOR_SYSTEM);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
