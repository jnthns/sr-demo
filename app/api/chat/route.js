import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY');

export async function POST(req) {
  try {
    const { history, message } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);

    const response = await result.response;
    const text = response.text();

    // The response already contains the token count for the prompt and the response.
    const usageMetadata = response.usage_metadata;
    const totalTokens = usageMetadata.prompt_token_count + usageMetadata.candidates_token_count;

    return NextResponse.json({ response: text, tokenCount: totalTokens });
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
