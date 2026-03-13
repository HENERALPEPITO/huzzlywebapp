import { NextRequest, NextResponse } from 'next/server';
import { getGrokService } from '@/lib/grokService';
import HUZLY_FAQ_CONTENT from '@/lib/faqContent';
import { supabase } from '@/lib/supabaseClient';

interface AutoReplyRequest {
  incomingMessage: string;
  senderId: string;
  receiverId: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  useFAQ?: boolean;
  faqCategory?: string;
  autoSend?: boolean;
}

/**
 * POST /api/auto-reply
 * Generates an auto-reply to a received message and optionally sends it
 */
export async function POST(request: NextRequest) {
  try {
    const body: AutoReplyRequest = await request.json();
    const {
      incomingMessage,
      senderId,
      receiverId,
      useFAQ = false, // Changed to false by default to test
      faqCategory,
      autoSend = true,
    } = body;

    console.log('[AUTO-REPLY] Request received:', { 
      incomingMessage: incomingMessage?.substring(0, 50), 
      senderId, 
      receiverId, 
      useFAQ 
    });

    if (!incomingMessage || !senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required fields: incomingMessage, senderId, receiverId' },
        { status: 400 }
      );
    }

    const trimmedMessage = incomingMessage.trim();
    if (!trimmedMessage) {
      return NextResponse.json(
        { error: 'incomingMessage cannot be empty' },
        { status: 400 }
      );
    }

    const grokService = getGrokService();
    let autoReply: string;

    // Try simple reply first (no FAQ) to test if Grok API is working
    try {
      console.log('[AUTO-REPLY] Using simple reply method (no FAQ context)');
      autoReply = await grokService.generateAutoReply(
        trimmedMessage,
        'You are a helpful assistant. Reply briefly and professionally.'
      );

      console.log('[AUTO-REPLY] Reply generated successfully:', autoReply.substring(0, 100));
    } catch (simpleError: any) {
      console.error('[AUTO-REPLY] Simple reply failed, trying with FAQ...');
      
      // If simple reply fails, try with FAQ as backup
      try {
        console.log('[AUTO-REPLY] Using FAQ context as fallback...');
        autoReply = await grokService.generateFAQBasedResponse(
          trimmedMessage, 
          HUZLY_FAQ_CONTENT
        );
      } catch (faqError: any) {
        console.error('[AUTO-REPLY] FAQ fallback also failed');
        throw faqError;
      }
    }

    // Send the auto-reply if requested
    if (autoSend) {
      console.log('[AUTO-REPLY] Sending to database...');
      const { data: sentMessage, error: sendError } = await supabase
        .from('messages')
        .insert({
          sender_id: receiverId,
          receiver_id: senderId,
          content: `[Auto-Reply] ${autoReply}`,
          shift_id: null,
        })
        .select('*')
        .single();

      if (sendError) {
        console.error('Error sending auto-reply:', sendError);
        return NextResponse.json(
          {
            success: false,
            reply: autoReply,
            sent: false,
            error: 'Generated reply but failed to send',
            details: sendError.message,
          },
          { status: 400 }
        );
      }

      console.log('[AUTO-REPLY] Successfully sent:', sentMessage?.id);
      return NextResponse.json({
        success: true,
        reply: autoReply,
        sent: true,
        messageId: sentMessage?.id,
      });
    }

    return NextResponse.json({
      success: true,
      reply: autoReply,
      sent: false,
    });
  } catch (error: any) {
    console.error('[AUTO-REPLY] Fatal error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate auto-reply',
        details: error.message || String(error),
      },
      { status: 500 }
    );
  }
}
