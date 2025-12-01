import { NextResponse } from 'next/server';
import { createFileSearchService } from '../../../../lib/fileSearchService';

// POST - Generate content with File Search tool enabled
export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured' 
      }, { status: 400 });
    }

    const { message, history, fileSearchStoreNames } = await req.json();

    // Validate inputs
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Message is required and must be a non-empty string' 
      }, { status: 400 });
    }

    if (!fileSearchStoreNames || !Array.isArray(fileSearchStoreNames) || fileSearchStoreNames.length === 0) {
      return NextResponse.json({ 
        error: 'At least one File Search store name is required' 
      }, { status: 400 });
    }

    // Check message length
    if (message.length > 1000) {
      return NextResponse.json({ 
        error: 'Message too long. Please keep it under 1000 characters.' 
      }, { status: 400 });
    }

    console.log('File Search Chat - Request received:', {
      messageLength: message.length,
      historyLength: history?.length || 0,
      fileSearchStoreNames: fileSearchStoreNames,
      storeCount: fileSearchStoreNames.length
    });

    const fileSearchService = createFileSearchService(apiKey);
    const result = await fileSearchService.generateContentWithFileSearch(
      message,
      history || [],
      fileSearchStoreNames
    );

    console.log('File Search Chat - Response generated:', {
      success: result.success,
      responseLength: result.response?.length || 0,
      hasGroundingMetadata: !!result.groundingMetadata,
      citationCount: result.groundingMetadata?.groundingChunks?.length || 0
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in File Search chat API:', error);
    
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
    } else if (error.message.includes('File Search store')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
}

