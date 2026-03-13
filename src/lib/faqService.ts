import { supabase } from './supabaseClient';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all FAQ items from the database
 */
export async function fetchAllFAQs(): Promise<FAQ[]> {
  try {
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.warn('Error fetching FAQs:', error);
      return [];
    }

    return (data as FAQ[]) || [];
  } catch (error) {
    console.error('Failed to fetch FAQs:', error);
    return [];
  }
}

/**
 * Fetch FAQs by category
 */
export async function fetchFAQsByCategory(category: string): Promise<FAQ[]> {
  try {
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .eq('category', category)
      .order('order', { ascending: true });

    if (error) {
      console.warn('Error fetching FAQs by category:', error);
      return [];
    }

    return (data as FAQ[]) || [];
  } catch (error) {
    console.error('Failed to fetch FAQs by category:', error);
    return [];
  }
}

/**
 * Fetch a single FAQ by ID
 */
export async function fetchFAQById(id: string): Promise<FAQ | null> {
  try {
    const { data, error } = await supabase
      .from('faq')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('Error fetching FAQ:', error);
      return null;
    }

    return (data as FAQ) || null;
  } catch (error) {
    console.error('Failed to fetch FAQ:', error);
    return null;
  }
}

/**
 * Format FAQs into a context string for AI prompts
 */
export function formatFAQsAsContext(faqs: FAQ[]): string {
  if (!faqs || faqs.length === 0) {
    return '';
  }

  const faqText = faqs
    .map((faq, index) => {
      let text = `Q${index + 1}: ${faq.question}\nA${index + 1}: ${faq.answer}`;
      if (faq.category) {
        text += ` (Category: ${faq.category})`;
      }
      return text;
    })
    .join('\n\n');

  return faqText;
}

/**
 * Create a system prompt that includes FAQ context
 */
export function createFAQSystemPrompt(faqs: FAQ[], customPrompt?: string): string {
  const faqContext = formatFAQsAsContext(faqs);

  if (!faqContext) {
    return customPrompt || 'You are a helpful assistant.';
  }

  const prompt = `You are a helpful assistant. Use the following FAQ information to answer questions accurately:

--- START FAQ KNOWLEDGE BASE ---
${faqContext}
--- END FAQ KNOWLEDGE BASE ---

${customPrompt ? `Additional instructions: ${customPrompt}` : ''}

When answering questions:
1. First, check if the answer is in the FAQ knowledge base above.
2. If the question matches or is related to an FAQ, provide the FAQ answer as the primary response.
3. You may enhance the FAQ answer with additional helpful information if relevant.
4. If the question is not in the FAQ, provide a helpful response based on your knowledge.
5. Always maintain a professional and friendly tone.`;

  return prompt;
}

/**
 * Search FAQs by keywords
 */
export function searchFAQs(faqs: FAQ[], keywords: string[]): FAQ[] {
  if (!faqs || faqs.length === 0 || !keywords || keywords.length === 0) {
    return [];
  }

  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  return faqs.filter((faq) => {
    const questionLower = faq.question.toLowerCase();
    const answerLower = faq.answer.toLowerCase();

    return lowerKeywords.some((keyword) => questionLower.includes(keyword) || answerLower.includes(keyword));
  });
}