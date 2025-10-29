import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);


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

    // Use the new API structure
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      history: history || []
    });

    const text = response.text;

    // Get token usage information
    const usage = response.usage || {};
    const totalTokens = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);

    return NextResponse.json({ 
      response: text, 
      tokenCount: totalTokens,
      usage: {
        prompt_tokens: usage.promptTokenCount || 0,
        candidates_tokens: usage.candidatesTokenCount || 0,
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