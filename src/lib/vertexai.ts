import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-1.5-flash-002';

// Define proper types for Vertex AI response
interface Part {
  text: string;
}

interface Content {
  role: string;
  parts: Part[];
}

interface Candidate {
  content: Content;
  finishReason: string;
}

interface VertexAIResponse {
  candidates: Candidate[];
  promptFeedback: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

export async function callVertexAI(prompt: string): Promise<string> {
  try {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credentialsPath) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
    }

    const credentials = JSON.parse(
      fs.readFileSync(path.resolve(credentialsPath), 'utf8')
    );

    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const accessToken = "ya29.a0AeDClZAe2j0TnzHqrpb0m18_RbKTp3JDAeEGrxRB_h0-mFk2zmWLkjGo3K_z-yqNQErW9Fuk17zzks1YPmVk6UOddHOaFO0vYSsoQc44yJGZ99qVSLYWL1ncoDvPSQL5bMiOJAi7lVhrV7u6ol83dS0FDbjpgNKjfQcRKbchTgaCgYKAWESARASFQHGX2Mi15DxIWR3ETuLxhO3cuOFEg0177"

    if (!PROJECT_ID) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable is not set');
    }

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:generateContent`;

    const requestBody = {
      "contents": {
        "role": "user",
        "parts": [
          {
            "text": prompt
          }
        ]
      }
    };


    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI API error: ${response.status} ${errorText}`);
    }

    const data: VertexAIResponse = await response.json();

    // Check if we have a valid response with candidates
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Vertex AI');
    }

    // Get the text from the first candidate's content
    const firstCandidate = data.candidates[0];
    if (!firstCandidate.content || !firstCandidate.content.parts || firstCandidate.content.parts.length === 0) {
      throw new Error('Invalid response format from Vertex AI');
    }

    return firstCandidate.content.parts[0].text;

  } catch (error) {
    console.error('Error calling Vertex AI:', error);
    throw error;
  }
}