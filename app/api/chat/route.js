import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Validate API key
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured. Please set it in your environment variables.' 
      }, { status: 400 });
    }

    const { history, message } = await req.json();

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message is required and must be a non-empty string.' 
      }, { status: 400 });
    }

    // Check message length
    if (message.length > 1000) {
      return NextResponse.json({ 
        error: 'Message too long. Please keep it under 1000 characters.' 
      }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({ history: history || [] });
    const result = await chat.sendMessage(message);

    const response = await result.response;
    const text = response.text();

    // The response already contains the token count for the prompt and the response.
    const usageMetadata = response.usage_metadata;
    const totalTokens = usageMetadata.prompt_token_count + usageMetadata.candidates_token_count;

    return NextResponse.json({ 
      response: text, 
      tokenCount: totalTokens,
      usage: {
        prompt_tokens: usageMetadata.prompt_token_count,
        candidates_tokens: usageMetadata.candidates_token_count,
        total_tokens: totalTokens
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Handle specific error types
    let errorMessage = 'An error occurred while processing your request';
    let statusCode = 500;
    
    if (error.message.includes('API_KEY') || error.message.includes('API key')) {
      errorMessage = 'Invalid or missing API key';
      statusCode = 401;
    } else if (error.message.includes('QUOTA') || error.message.includes('quota')) {
      errorMessage = 'API quota exceeded. Please try again later';
      statusCode = 429;
    } else if (error.message.includes('RATE_LIMIT')) {
      errorMessage = 'Rate limit exceeded. Please try again later';
      statusCode = 429;
    } else if (error.message.includes('SAFETY')) {
      errorMessage = 'Content blocked by safety filters';
      statusCode = 400;
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
}

// Health check endpoint
export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const hasApiKey = !!apiKey;
    
    return NextResponse.json({
      status: 'ok',
      hasApiKey,
      timestamp: new Date().toISOString(),
      message: hasApiKey ? 'Chat API is ready' : 'API key not configured',
      sdk: '@google/genai',
      model: 'gemini-2.5-flash'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}