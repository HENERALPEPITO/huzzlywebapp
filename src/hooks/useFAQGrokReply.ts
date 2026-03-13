'use client';

import { useState, useEffect } from 'react';
import { useGrokReply } from './useGrokReply';
import { getFAQCategories, parseFAQSearchQuery } from '@/lib/faqUtils';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseFAQGrokReplyOptions {
  category?: string;
  autoSearch?: boolean;
}

interface UseFAQGrokReplyReturn {
  reply: string | null;
  isLoading: boolean;
  error: string | null;
  faqUsed: boolean;
  faqItemsUsed: number;
  categories: string[];
  selectedCategory: string | undefined;
  generateReply: (message: string, history?: ConversationMessage[]) => Promise<void>;
  generateReplyWithSearch: (
    message: string,
    searchQuery?: string,
    history?: ConversationMessage[]
  ) => Promise<void>;
  setSelectedCategory: (category: string | undefined) => void;
  reset: () => void;
}

/**
 * Hook specifically for FAQ-based Grok replies
 * Automatically loads FAQ categories and manages FAQ-specific logic
 * 
 * @example
 * ```tsx
 * const { reply, isLoading, categories, generateReply } = useFAQGrokReply({
 *   category: 'Technical Support'
 * });
 * 
 * await generateReply('How do I reset my password?');
 * ```
 */
export function useFAQGrokReply(options?: UseFAQGrokReplyOptions): UseFAQGrokReplyReturn {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(options?.category);
  const [categories, setCategories] = useState<string[]>([]);
  const grokReply = useGrokReply({
    useFAQ: true,
    faqCategory: selectedCategory,
  });

  // Load FAQ categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getFAQCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error loading FAQ categories:', error);
      }
    };

    loadCategories();
  }, []);

  const generateReply = async (message: string, history?: ConversationMessage[]) => {
    await grokReply.generateReply(message, history);
  };

  const generateReplyWithSearch = async (
    message: string,
    searchQuery?: string,
    history?: ConversationMessage[]
  ) => {
    try {
      grokReply.reset();
      const payload = {
        message,
        conversationHistory: history,
        useFAQ: true,
        faqCategory: selectedCategory,
        faqSearch: searchQuery || message, // Use message as search query if none provided
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
      // Update the grok reply state manually
      (grokReply as any).reply = data.reply;
      (grokReply as any).faqUsed = data.usedFAQ || false;
      (grokReply as any).faqItemsUsed = data.faqItemsUsed || 0;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      (grokReply as any).error = errorMessage;
      console.error('Error generating reply with search:', err);
    }
  };

  return {
    reply: grokReply.reply,
    isLoading: grokReply.isLoading,
    error: grokReply.error,
    faqUsed: grokReply.faqUsed,
    faqItemsUsed: grokReply.faqItemsUsed,
    categories,
    selectedCategory,
    generateReply,
    generateReplyWithSearch,
    setSelectedCategory,
    reset: grokReply.reset,
  };
}
