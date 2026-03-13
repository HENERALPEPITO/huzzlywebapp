import { NextRequest, NextResponse } from 'next/server';
import HUZLY_FAQ_CONTENT from '@/lib/faqContent';

interface FAQQueryParams {
  category?: string;
  search?: string;
  format?: 'json' | 'text';
}

/**
 * GET /api/huzly-faq
 * Retrieve FAQ data (hardcoded)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') as 'json' | 'text') || 'json';

    // Format response
    if (format === 'text') {
      return new NextResponse(HUZLY_FAQ_CONTENT, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Default JSON format - return FAQ content as string
    return NextResponse.json({
      success: true,
      content: HUZLY_FAQ_CONTENT,
      source: 'hardcoded',
    });
  } catch (error: any) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch FAQs',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/huzly-faq
 * Search FAQs with advanced options
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formatAsContext = false } = body;

    // Return formatted context if requested
    if (formatAsContext) {
      return NextResponse.json({
        success: true,
        context: HUZLY_FAQ_CONTENT,
        source: 'hardcoded',
      });
    }

    // Default - return FAQ content as string
    return NextResponse.json({
      success: true,
      content: HUZLY_FAQ_CONTENT,
      source: 'hardcoded',
    });
  } catch (error: any) {
    console.error('Error processing FAQ request:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process FAQ request',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
