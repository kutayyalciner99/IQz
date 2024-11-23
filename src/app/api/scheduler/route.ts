import { NextResponse } from 'next/server';
import { callVertexAI } from '@/lib/vertexai';



export async function POST(req: Request) {
  try {
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set');
    }

    const body = await req.json();
    const { topics, scheduleType } = body;

    const prompt = `Create a detailed ${scheduleType} study schedule for the following topics:
${JSON.stringify(topics, null, 2)}

Consider these factors when creating the schedule:
1. Deadline priorities
2. Topic difficulties
3. Estimated study hours
4. Balanced distribution of study sessions
5. Regular breaks and review sessions
6. Progressive learning approach

Return the schedule in this JSON format:
{
  "blocks": [
    {
      "date": "YYYY-MM-DD",
      "timeSlot": "Morning/Afternoon/Evening",
      "topic": "Topic name",
      "activity": "Specific study activity or goal",
      "duration": "X hours"
    }
  ],
  "summary": {
    "totalHours": number,
    "topicsPerWeek": number,
    "suggestedPace": "Description of recommended study pace"
  },
  "recommendations": [
    "Specific study tips and recommendations"
  ]
}

Important guidelines:
1. Create a realistic and achievable schedule
2. Include variety in study activities
3. Account for topic dependencies
4. Include review sessions
5. Distribute difficult topics across different days
6. Consider optimal study times based on topic complexity`;

    const response = await callVertexAI(prompt);
    console.log('Received response from Vertex AI:', response);

    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const parsedResponse = JSON.parse(cleanResponse);

      // Validate response structure
      if (!parsedResponse.blocks || !Array.isArray(parsedResponse.blocks)) {
        throw new Error('Invalid response format: missing blocks array');
      }
      interface SchedulerBlock {
        date: string;
        timeSlot: string;
        topic: string;
        activity: string;
        duration: number | string;
      }
      parsedResponse.blocks.forEach((block: SchedulerBlock, index: number) => {
        if (!block.date || !block.timeSlot || !block.topic || !block.activity || !block.duration) {
          throw new Error(`Invalid block format at index ${index}`);
        }
      });

      return NextResponse.json(parsedResponse);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Clean response that failed to parse:', cleanResponse);
      throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
    }
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}