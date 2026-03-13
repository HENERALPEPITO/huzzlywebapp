/**
 * Auto-Reply Utilities
 * Helper functions for automatic message reply generation
 */

/**
 * Generate and send an auto-reply via API
 */
export async function generateAutoReply(
  incomingMessage: string,
  senderId: string,
  receiverId: string,
  options?: {
    useFAQ?: boolean;
    faqCategory?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    autoSend?: boolean;
  }
): Promise<{ success: boolean; reply: string; sent: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auto-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incomingMessage,
        senderId,
        receiverId,
        useFAQ: options?.useFAQ ?? true,
        faqCategory: options?.faqCategory,
        conversationHistory: options?.conversationHistory,
        autoSend: options?.autoSend ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        reply: '',
        sent: false,
        error: errorData.details || 'Failed to generate auto-reply',
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      reply: data.reply,
      sent: data.sent || false,
      error: data.error,
    };
  } catch (error: any) {
    console.error('Error generating auto-reply:', error);
    return {
      success: false,
      reply: '',
      sent: false,
      error: error.message,
    };
  }
}

/**
 * Check if auto-reply should be triggered for a message
 */
export function shouldAutoReply(
  messageFromUserId: string,
  currentUserId: string,
  autoReplyEnabled: boolean
): boolean {
  // Only auto-reply to messages from other users
  return messageFromUserId !== currentUserId && autoReplyEnabled;
}

/**
 * Format auto-reply message
 */
export function formatAutoReplyMessage(reply: string, includePrefix: boolean = true): string {
  if (includePrefix) {
    return `[AI response:] ${reply}`;
  }
  return reply;
}
