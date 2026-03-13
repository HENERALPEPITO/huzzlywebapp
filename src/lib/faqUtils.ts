/**
 * FAQ Utilities
 * Helper functions for working with FAQ data in the application
 */

import HUZLY_FAQ_CONTENT from '@/lib/faqContent';

/**
 * Get FAQ content
 */
export async function loadFAQData(category?: string): Promise<string> {
  try {
    // Return hardcoded FAQ content (category parameter ignored for now)
    return HUZLY_FAQ_CONTENT;
  } catch (error) {
    console.error('Error loading FAQ data:', error);
    return '';
  }
}

/**
 * Check if FAQ data is available
 */
export async function isFAQAvailable(): Promise<boolean> {
  try {
    return HUZLY_FAQ_CONTENT && HUZLY_FAQ_CONTENT.length > 0;
  } catch (error) {
    console.error('Error checking FAQ availability:', error);
    return false;
  }
}

/**
 * Get FAQ data from API endpoint
 */
export async function fetchFAQFromAPI(
  category?: string,
  search?: string,
  formatAsContext: boolean = false
): Promise<any> {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (formatAsContext) params.append('format', 'text');

    const url = `/api/huzly-faq${params.toString() ? '?' + params.toString() : ''}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch FAQ: ${response.statusText}`);
    }

    if (formatAsContext) {
      return await response.text();
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching FAQ from API:', error);
    return null;
  }
}

/**
 * Generate a reply using FAQ context via API
 */
export async function generateFAQBasedReply(
  message: string,
  category?: string,
  search?: string
): Promise<string | null> {
  try {
    const response = await fetch('/api/generate-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        useFAQ: true,
        faqCategory: category,
        faqSearch: search,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate FAQ-based reply');
    }

    const data = await response.json();
    return data.reply || null;
  } catch (error) {
    console.error('Error generating FAQ-based reply:', error);
    return null;
  }
}

/**
 * Get FAQ categories
 */
export async function getFAQCategories(): Promise<string[]> {
  try {
    // Extract categories from hardcoded FAQ content
    const categories = new Set<string>();
    const lines = HUZLY_FAQ_CONTENT.split('\n');
    
    lines.forEach((line) => {
      if (line.includes('FOR WORKERS') || line.includes('FOR CLIENTS')) {
        categories.add(line.trim());
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error getting FAQ categories:', error);
    return [];
  }
}

/**
 * Get FAQ count
 */
export async function getFAQCount(category?: string): Promise<number> {
  try {
    // Count Q: entries in the FAQ content
    const qCount = (HUZLY_FAQ_CONTENT.match(/^Q:/gm) || []).length;
    return qCount;
  } catch (error) {
    console.error('Error getting FAQ count:', error);
    return 0;
  }
}

/**
 * Parse FAQ search query for multiple keywords
 */
export function parseFAQSearchQuery(query: string): string[] {
  return query
    .split(/[,;]|\s+and\s+/)
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

/**
 * Format FAQ for display in UI
 */
export function formatFAQForDisplay(question: string, answer: string, category?: string): { question: string; answer: string; category?: string } {
  return {
    question,
    answer,
    category,
  };
}
