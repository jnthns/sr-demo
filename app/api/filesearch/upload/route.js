import { NextResponse } from 'next/server';
import { createFileSearchService } from '../../../../lib/fileSearchService';

// POST - Upload a file to a File Search store
export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY is not configured' 
      }, { status: 400 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    const storeName = formData.get('storeName');
    const displayName = formData.get('displayName') || file?.name;

    // Validate inputs
    if (!file) {
      return NextResponse.json({ 
        error: 'File is required' 
      }, { status: 400 });
    }

    if (!storeName) {
      return NextResponse.json({ 
        error: 'Store name is required' 
      }, { status: 400 });
    }

    // Validate file size (100MB max)
    const fileSize = file.size;
    if (fileSize > 100 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size exceeds 100MB limit' 
      }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileSearchService = createFileSearchService(apiKey);
    const result = await fileSearchService.uploadFile(
      buffer,
      storeName,
      displayName || file.name,
      file.type || null // Pass MIME type from the uploaded file
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload file',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

