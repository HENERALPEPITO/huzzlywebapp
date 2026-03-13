/**
 * Grok Utilities
 * Helper functions and constants for working with Grok AI in the messaging app
 */

export const GROK_CONTEXTS = {
  customer_service: 'You are a professional customer service representative. Provide helpful, friendly, and concise responses to customer inquiries.',
  technical_support: 'You are a technical support specialist. Provide clear, step-by-step solutions to technical problems.',
  sales: 'You are a sales representative. Provide helpful information about products and services in a friendly manner.',
  general: 'You are a helpful assistant. Provide clear, concise, and friendly responses.',
};

export const GROK_MODELS = {
  default: 'grok-4-1-fast-non-reasoning',
  // Add more models as they become available
};

/**
 * Generate a reply suggestion for a message
 */
export async function generateReplySuggestion(
  userMessage: string,
  context: string = GROK_CONTEXTS.general
): Promise<string | null> {
  try {
    const response = await fetch('/api/generate-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        context,
      }),
    });

    if (!response.ok) {
      console.error('Failed to generate reply suggestion:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.reply || null;
  } catch (error) {
    console.error('Error generating reply suggestion:', error);
    return null;
  }
}

/**
 * Check if Grok service is available
 */
export async function isGrokAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/generate-reply', {
      method: 'GET',
    });

    return response.ok;
  } catch (error) {
    console.error('Error checking Grok service:', error);
    return false;
  }
}

/**
 * Extract key topics from a message
 */
export async function extractTopics(message: string): Promise<string[]> {
  try {
    const response = await fetch('/api/generate-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Extract the main topics from this message in a comma-separated list format: "${message}"`,
        context: 'You are a helpful assistant. Extract and list the main topics from the given message.',
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (data.reply) {
      return data.reply
        .split(',')
        .map((topic: string) => topic.trim())
        .filter((topic: string) => topic.length > 0);
    }

    return [];
  } catch (error) {
    console.error('Error extracting topics:', error);
    return [];
  }
}
