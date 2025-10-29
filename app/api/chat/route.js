import { NextResponse } from 'next/server';
import { sendMessageDirect, handleGeminiError } from '../../../lib/geminichat';

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

    const { message } = await req.json();

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

    // Send message to Gemini using the new SDK
    const result = await sendMessageDirect(message.trim(), apiKey);

    if (result.success) {
      return NextResponse.json({ 
        response: result.text,
        usage: result.usage,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        error: result.error || 'Failed to get response from AI' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Handle specific error types
    const errorMessage = handleGeminiError(error);
    const statusCode = error.message.includes('API_KEY') ? 401 : 
                      error.message.includes('QUOTA') ? 429 : 500;

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