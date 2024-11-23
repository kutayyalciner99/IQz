import { NextResponse } from 'next/server';
import { callVertexAI } from '@/lib/vertexai';

// Simple in-memory rate limiting
let lastRequestTime = 0;
const RATE_LIMIT_WINDOW = 1000; // 1 second between requests

export async function POST(req: Request) {
  try {
    // Basic rate limiting
    const now = Date.now();
    if (now - lastRequestTime < RATE_LIMIT_WINDOW) {
      return NextResponse.json(
        {
          error: 'Please wait a moment before making another request',
          retryAfter: RATE_LIMIT_WINDOW - (now - lastRequestTime)
        },
        { status: 429 }
      );
    }
    lastRequestTime = now;

    const { text } = await req.json();
    console.log('Received text to summarize:', text.slice(0, 100) + '...');

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    // Limit text length to avoid excessive API usage
    const MAX_TEXT_LENGTH = 10000;
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text must be ${MAX_TEXT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    const prompt = `Summarize the following text concisely (aim for about 25% of the original length). Focus on key points and main ideas.

Text to summarize:
"""
${text}
"""

Requirements:
1. Clear and concise language
2. Key information only
3. Maintain core message
4. No explanatory phrases or meta-text`;

    try {
      const summary = await callVertexAI(prompt);

      // Clean up the response
      const cleanSummary = summary
        .replace(/^Summary:?\s*/i, '')
        .replace(/^Here's a summary:?\s*/i, '')
        .replace(/```/g, '')
        .trim();

      return NextResponse.json({ summary: cleanSummary });

    } catch (aiError: any) {
      console.error('Vertex AI Error:', aiError);

      // Handle rate limit errors specifically
      if (aiError.message?.includes('429') || aiError.message?.includes('RESOURCE_EXHAUSTED')) {
        return NextResponse.json(
          {
            error: 'Service is currently busy. Please try again in a few moments.',
            retryAfter: 5000 // Suggest retry after 5 seconds
          },
          {
            status: 429,
            headers: {
              'Retry-After': '5'
            }
          }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to generate summary',
          details: aiError instanceof Error ? aiError.message : 'AI service error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}