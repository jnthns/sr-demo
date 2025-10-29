import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY');

export async function POST(req) {
  try {
    const { history, message } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const contents = [...history, { role: 'user', parts: [{ text: message }] }];

    const result = await model.generateContent({ contents });
    const response = result.response;
    const text = response.text();

    // The response already contains the token count for the prompt and the response.
    // Note: The property names are now camelCase in the new SDK.
    const usageMetadata = response.usageMetadata;
    const totalTokens = usageMetadata.promptTokenCount + usageMetadata.candidatesTokenCount;

    return NextResponse.json({ response: text, tokenCount: totalTokens });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
