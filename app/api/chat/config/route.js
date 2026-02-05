import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    return NextResponse.json({
      hasApiKey: !!apiKey,
      timestamp: new Date().toISOString(),
      message: apiKey ? 'API key is configured' : 'API key not configured'
    });
  } catch (error) {
    return NextResponse.json({
      hasApiKey: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
