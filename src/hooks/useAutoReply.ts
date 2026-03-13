'use client';

import { useState, useCallback } from 'react';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseAutoReplyOptions {
  enabled?: boolean;
  useFAQ?: boolean;
  faqCategory?: string;
}

interface UseAutoReplyReturn {
  isGenerating: boolean;
  error: string | null;
  lastReply: string | null;
  generateAndSendAutoReply: (
    incomingMessage: string,
    senderId: string,
    receiverId: string,
    conversationHistory?: ConversationMessage[]
  ) => Promise<boolean>;
  reset: () => void;
}

/**
 * Hook to handle auto-reply generation and sending
 * Automatically generates and sends replies when messages are received
 */
export function useAutoReply(options?: UseAutoReplyOptions): UseAutoReplyReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<string | null>(null);

  const generateAndSendAutoReply = useCallback(
    async (
      incomingMessage: string,
      senderId: string,
      receiverId: string,
      conversationHistory?: ConversationMessage[]
    ): Promise<boolean> => {
      if (!options?.enabled) {
        return false;
      }

      try {
        setIsGenerating(true);
        setError(null);
        setLastReply(null);

        // Filter and validate conversation history
        const validHistory = conversationHistory
          ? conversationHistory.filter(
              (msg) =>
                msg &&
                msg.role &&
                msg.content &&
                (msg.role === 'user' || msg.role === 'assistant') &&
                msg.content.trim().length > 0
            )
          : [];

        const payload = {
          incomingMessage,
          senderId,
          receiverId,
          conversationHistory: validHistory.length > 0 ? validHistory : undefined,
          useFAQ: options?.useFAQ ?? true,
          faqCategory: options?.faqCategory,
          autoSend: true,
        };

        const response = await fetch('/api/auto-reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to generate auto-reply');
        }

        const data = await response.json();

        if (data.success && data.sent) {
          setLastReply(data.reply);
          return true;
        } else {
          throw new Error(data.error || 'Failed to send auto-reply');
        }
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error in auto-reply:', errorMessage, err);
        return false;
      } finally {
        setIsGenerating(false);
      }
    },
    [options?.enabled, options?.useFAQ, options?.faqCategory]
  );

  const reset = useCallback(() => {
    setIsGenerating(false);
    setError(null);
    setLastReply(null);
  }, []);

  return {
    isGenerating,
    error,
    lastReply,
    generateAndSendAutoReply,
    reset,
  };
}
