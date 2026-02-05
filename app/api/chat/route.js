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

    // Build conversation history for context
    // Gemini 3 prefers concise, direct instructions without verbose system prompts
    const conversationHistory = [];
    
    // Add conversation history if provided (alternating user/model messages)
    if (history && Array.isArray(history) && history.length > 0) {
      history.forEach(msg => {
        conversationHistory.push({
          role: msg.role,
          parts: [{ text: msg.parts[0].text }]
        });
      });
    }

    // Add the current user message
    conversationHistory.push({
      role: 'user',
      parts: [{
        text: message
      }]
    });

    // Log the request for debugging (without sensitive data)
    console.log('Chat API Request:', {
      messageLength: message.length,
      historyLength: conversationHistory.length,
      model: 'gemini-2.5-flash'
    });

    // Generate response with conversation context using Gemini 2.5 Flash
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: conversationHistory,
      config: {
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        }
      }
    });

    const text = response.text;

    // Debug logging - check the full response structure
    console.log('Full API Response:', JSON.stringify(response, null, 2));
    console.log('Response keys:', Object.keys(response));

    // Try different ways to get usage information
    const usage = response.usage || response.usageMetadata || {};
    const totalTokens = usage.totalTokenCount || usage.totalTokens || 0;

    console.log('Usage object:', usage);
    console.log('Total tokens:', totalTokens);

    return NextResponse.json({ 
      response: text, 
      tokenCount: totalTokens,
      usage: {
        prompt_tokens: usage.promptTokenCount || usage.promptTokens || 0,
        candidates_tokens: usage.candidatesTokenCount || usage.candidatesTokens || 0,
        total_tokens: totalTokens
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    // Handle specific error types
    let errorMessage = 'An error occurred while processing your request';
    let statusCode = 500;
    
    // Check for rate limiting errors from Gemini API
    const errorString = JSON.stringify(error).toLowerCase();
    const errorMessageLower = error.message?.toLowerCase() || '';
    
    if (errorMessageLower.includes('api_key') || errorMessageLower.includes('api key') || errorString.includes('api_key')) {
      errorMessage = 'Invalid or missing API key';
      statusCode = 401;
    } else if (errorMessageLower.includes('quota') || errorMessageLower.includes('rate_limit') || errorMessageLower.includes('rate limit') || 
               errorString.includes('quota') || errorString.includes('rate_limit') || errorString.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      statusCode = 429;
    } else if (errorMessageLower.includes('safety') || errorString.includes('safety')) {
      errorMessage = 'Content blocked by safety filters';
      statusCode = 400;
    } else if (error.status === 429 || error.code === 429) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      statusCode = 429;
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      statusCode: statusCode
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