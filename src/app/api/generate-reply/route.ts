import { NextRequest, NextResponse } from 'next/server';
import { getGrokService } from '@/lib/grokService';
import HUZLY_FAQ_CONTENT from '@/lib/faqContent';

interface GenerateReplyRequest {
  message: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context?: string;
  useFAQ?: boolean;
  faqCategory?: string;
  faqSearch?: string;
}

/**
 * POST /api/generate-reply
 * Generates an AI-powered reply to a user message using Grok
 * Optionally uses FAQ data as context
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateReplyRequest = await request.json();
    const { message, conversationHistory, context, useFAQ = false, faqCategory, faqSearch } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    const grokService = getGrokService();
    let reply: string;
    let faqContext: string | null = null;

    // Use hardcoded FAQ context if requested
    if (useFAQ) {
      faqContext = HUZLY_FAQ_CONTENT;
    }

    // Generate response with or without FAQ context
    if (faqContext) {
      if (conversationHistory && conversationHistory.length > 0) {
        // Convert conversation history to the format Grok expects
        const messages = conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

        reply = await grokService.continueConversationWithFAQ(messages, message, faqContext);
      } else {
        reply = await grokService.generateFAQBasedResponse(message, faqContext);
      }
    } else {
      // Generate response without FAQ context
      if (conversationHistory && conversationHistory.length > 0) {
        const messages = conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

        reply = await grokService.continueConversation(messages, message);
      } else {
        reply = await grokService.generateAutoReply(message, context);
      }
    }

    return NextResponse.json({
      success: true,
      reply,
      model: 'grok-4-1-fast-non-reasoning',
      usedFAQ: !!faqContext,
      faqItemsUsed: faqContext ? faqContext.split('\n\n').length : 0,
    });
  } catch (error: any) {
    console.error('Error generating reply:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate reply',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-reply
 * Health check endpoint
 */
export async function GET() {
  try {
    // Verify Grok service is properly initialized
    const grokService = getGrokService();

    return NextResponse.json({
      status: 'ok',
      service: 'grok-ai',
      model: 'grok-4-1-fast-non-reasoning',
      faqAvailable: true,
      faqSource: 'hardcoded',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
