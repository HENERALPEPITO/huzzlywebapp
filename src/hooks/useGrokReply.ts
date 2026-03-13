'use client';

import { useState } from 'react';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseGrokReplyOptions {
  context?: string;
  useFAQ?: boolean;
  faqCategory?: string;
}

interface UseGrokReplyReturn {
  reply: string | null;
  isLoading: boolean;
  error: string | null;
  faqUsed: boolean;
  faqItemsUsed: number;
  generateReply: (message: string, history?: ConversationMessage[]) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to generate AI replies using Grok, optionally with FAQ context
 * 
 * @example
 * ```tsx
 * const { reply, isLoading, generateReply } = useGrokReply({
 *   useFAQ: true,
 *   context: 'You are a customer service representative'
 * });
 * 
 * const handleGenerateReply = async () => {
 *   await generateReply('How can I help?');
 * };
 * ```
 */
export function useGrokReply(options?: UseGrokReplyOptions): UseGrokReplyReturn {
  const [reply, setReply] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faqUsed, setFaqUsed] = useState(false);
  const [faqItemsUsed, setFaqItemsUsed] = useState(0);

  const generateReply = async (message: string, history?: ConversationMessage[]) => {
    try {
      setIsLoading(true);
      setError(null);
      setReply(null);
      setFaqUsed(false);
      setFaqItemsUsed(0);

      const payload = {
        message,
        conversationHistory: history,
        context: options?.context,
        useFAQ: options?.useFAQ || false,
        faqCategory: options?.faqCategory,
      };

      const response = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate reply');
      }

      const data = await response.json();
      setReply(data.reply);
      setFaqUsed(data.usedFAQ || false);
      setFaqItemsUsed(data.faqItemsUsed || 0);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error generating reply:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setReply(null);
    setError(null);
    setIsLoading(false);
    setFaqUsed(false);
    setFaqItemsUsed(0);
  };

  return {
    reply,
    isLoading,
    error,
    faqUsed,
    faqItemsUsed,
    generateReply,
    reset,
  };
}
