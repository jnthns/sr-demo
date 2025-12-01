import { NextResponse } from 'next/server';
import { createFileSearchService } from '../../../../lib/fileSearchService';

// GET - List all File Search stores or get details of a specific store
export async function GET(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured' 
      }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const storeName = searchParams.get('name');

    const fileSearchService = createFileSearchService(apiKey);
    
    // If storeName is provided, get details of that specific store
    if (storeName) {
      const result = await fileSearchService.getStoreDetails(storeName);
      return NextResponse.json(result);
    }
    
    // Otherwise, list all stores
    const result = await fileSearchService.listStores();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET stores:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to get stores',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// POST - Create a new File Search store
export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured' 
      }, { status: 400 });
    }

    const body = await req.json();
    const { displayName } = body;

    const fileSearchService = createFileSearchService(apiKey);
    const result = await fileSearchService.createStore(displayName || 'My File Search Store');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating File Search store:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create store',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// DELETE - Delete a File Search store
export async function DELETE(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured' 
      }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const storeName = searchParams.get('name');

    if (!storeName) {
      return NextResponse.json({ 
        error: 'Store name is required' 
      }, { status: 400 });
    }

    const fileSearchService = createFileSearchService(apiKey);
    const result = await fileSearchService.deleteStore(storeName);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting File Search store:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete store',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

