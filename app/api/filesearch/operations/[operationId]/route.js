import { NextResponse } from 'next/server';
import { createFileSearchService } from '../../../../../lib/fileSearchService';

// GET - Check the status of an operation
export async function GET(req, { params }) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured' 
      }, { status: 400 });
    }

    const { operationId } = params;

    if (!operationId) {
      return NextResponse.json({ 
        error: 'Operation ID is required' 
      }, { status: 400 });
    }

    // Decode the operation ID (it's URL encoded)
    const decodedOperationId = decodeURIComponent(operationId);
    
    console.log('Checking operation status:', {
      original: operationId,
      decoded: decodedOperationId
    });

    const fileSearchService = createFileSearchService(apiKey);
    const result = await fileSearchService.checkOperationStatus(decodedOperationId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking operation status:', {
      operationId: params?.operationId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Return a more structured error response
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Failed to check operation status',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

