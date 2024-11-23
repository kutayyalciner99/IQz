import { NextResponse } from 'next/server';
import { callVertexAI } from '@/lib/vertexai';

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

interface QuizResponse {
  questions: QuizQuestion[];
}

export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set');
    }

    const body = await req.json();
    console.log('Received request body:', body);

    const { topic, difficulty, action, userAnswers } = body;

    if (action === 'feedback' && userAnswers) {
      const feedbackPrompt = `Given these quiz answers about ${topic}, provide detailed feedback for each answer.
Questions and answers: ${JSON.stringify(userAnswers)}
Provide feedback in this JSON format:
{
  "feedback": [
    {
      "questionIndex": 0,
      "isCorrect": true/false,
      "explanation": "Detailed explanation why this answer is correct/incorrect and what the correct answer is"
    }
  ],
  "totalScore": "x/y",
  "suggestions": "Overall suggestions for improvement"
}`;

      const feedbackResponse = await callVertexAI(feedbackPrompt);
      const cleanFeedback = feedbackResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      return NextResponse.json(JSON.parse(cleanFeedback));
    }

    // Generate new questions
    const prompt = `Generate a new and unique quiz about ${topic} with difficulty level ${difficulty}.
Create exactly 5 multiple choice questions with varying complexity and structure to test different aspects of the topic.
Each question should have 4 options with only one correct answer.
Add a brief explanation for each correct answer to help with learning.
Format as clean JSON without any markdown:
{
  "questions": [
    {
      "question": "question text",
      "options": ["option1", "option2", "option3", "option4"],
      "correct": 0,
      "explanation": "Brief explanation why this answer is correct"
    }
  ]
}

To ensure uniqueness:
1. Vary question types (mix of factual, conceptual, and applied knowledge)
2. Use different question structures (what, how, why, which, etc.)
3. Include some scenario-based questions when appropriate
4. Ensure options are distinct and plausible
5. Make sure questions build on different aspects of ${topic}`;

    const response = await callVertexAI(prompt);
    console.log('Received response from Vertex AI:', response);

    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const parsedResponse: QuizResponse = JSON.parse(cleanResponse);

      // Validate response structure
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        throw new Error('Invalid response format: missing questions array');
      }

      // Validate each question
      parsedResponse.questions.forEach((q, index) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
          typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
          throw new Error(`Invalid question format at index ${index}`);
        }
      });

      return NextResponse.json(parsedResponse.questions);

    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Clean response that failed to parse:', cleanResponse);
      throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }

  } catch (error) {
    console.error('Detailed error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate quiz',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}