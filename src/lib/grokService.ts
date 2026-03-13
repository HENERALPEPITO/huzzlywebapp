import axios, { AxiosInstance } from 'axios';

interface GrokMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GrokCompletionParams {
  messages: GrokMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface GrokCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class GrokService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseURL: string = 'https://api.x.ai/v1';
  private model: string = 'grok-4-1-fast-non-reasoning'; // Latest available model

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.XAI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('XAI_API_KEY environment variable is not set');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a completion using Grok
   */
  async createCompletion(params: GrokCompletionParams): Promise<GrokCompletionResponse> {
    try {
      const payload = {
        model: params.model || this.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens ?? 1024,
        stream: params.stream ?? false,
      };

      // Log request for debugging
      console.log('[GROK] Sending request:', {
        model: payload.model,
        messagesCount: payload.messages.length,
        messageLengths: payload.messages.map(m => `role:${m.role}(${m.content.length})`),
        temperature: payload.temperature,
        max_tokens: payload.max_tokens,
      });

      const response = await this.client.post<GrokCompletionResponse>(
        '/chat/completions',
        payload
      );

      console.log('[GROK] Response received successfully');
      return response.data;
    } catch (error: any) {
      // Enhanced error logging
      console.error('[GROK] API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorData: error.response?.data,
        message: error.message,
      });

      let errorMessage = 'Unknown Grok API error';
      
      if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (error.response.data.error.message) {
          errorMessage = error.response.data.error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(`Grok API Error: ${errorMessage}`);
    }
  }

  /**
   * Generate an auto-reply message
   */
  async generateAutoReply(userMessage: string, context?: string): Promise<string> {
    try {
      if (!userMessage || !userMessage.trim()) {
        throw new Error('User message cannot be empty');
      }

      const systemPrompt = context || 'You are a helpful assistant. Provide concise and friendly responses to user messages.';

      console.log('[GROK] generatingAutoReply with message length:', userMessage.length);

      const response = await this.createCompletion({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 512,
      });

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('No content in Grok response');
      }

      console.log('[GROK] AutoReply generated successfully');
      return assistantMessage;
    } catch (error: any) {
      console.error('[GROK] AutoReply generation failed:', error.message);
      throw new Error(`Failed to generate auto-reply: ${error.message}`);
    }
  }

  /**
   * Continue a conversation thread with history
   */
  async continueConversation(
    messageHistory: GrokMessage[],
    userMessage: string
  ): Promise<string> {
    try {
      const messages: GrokMessage[] = [
        ...messageHistory,
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await this.createCompletion({
        messages,
        temperature: 0.7,
        max_tokens: 512,
      });

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('No content in Grok response');
      }

      return assistantMessage;
    } catch (error: any) {
      throw new Error(`Failed to continue conversation: ${error.message}`);
    }
  }

  /**
   * Summarize messages
   */
  async summarizeMessages(messages: string[]): Promise<string> {
    try {
      const messageText = messages.join('\n');

      const response = await this.createCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes conversations concisely.',
          },
          {
            role: 'user',
            content: `Please summarize the following conversation:\n\n${messageText}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 256,
      });

      const summary = response.choices[0]?.message?.content;
      if (!summary) {
        throw new Error('No content in Grok response');
      }

      return summary;
    } catch (error: any) {
      throw new Error(`Failed to summarize messages: ${error.message}`);
    }
  }

  /**
   * Generate a response based on FAQ knowledge base
   */
  async generateFAQBasedResponse(userMessage: string, faqContext: string): Promise<string> {
    try {
      if (!userMessage || !userMessage.trim()) {
        throw new Error('User message cannot be empty');
      }

      if (!faqContext || !faqContext.trim()) {
        console.warn('[GROK] Empty FAQ context provided, using simple response');
        return this.generateAutoReply(userMessage);
      }

      console.log('[GROK] Generating FAQ-based response with context length:', faqContext.length);

      const systemPrompt = `You are a helpful assistant with access to an FAQ knowledge base. Use the FAQ information below to answer user questions accurately.

--- FAQ KNOWLEDGE BASE ---
${faqContext}
--- END FAQ KNOWLEDGE BASE ---

Instructions:
1. Check if the user question is answered in the FAQ above
2. If yes, provide the FAQ answer as your primary response
3. You may enhance it with additional helpful context
4. If not in FAQ, provide a helpful response based on your knowledge
5. Always be professional and friendly
6. If uncertain, acknowledge and offer to help further`;

      const response = await this.createCompletion({
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      });

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('No content in Grok response');
      }

      console.log('[GROK] FAQ-based response generated successfully');
      return assistantMessage;
    } catch (error: any) {
      console.error('[GROK] FAQ-based response generation failed:', error.message);
      throw new Error(`Failed to generate FAQ-based response: ${error.message}`);
    }
  }

  /**
   * Continue a conversation with FAQ context
   */
  async continueConversationWithFAQ(
    messageHistory: GrokMessage[],
    userMessage: string,
    faqContext: string
  ): Promise<string> {
    try {
      const systemPrompt = `You are a helpful assistant with access to an FAQ knowledge base. Use the FAQ information below to answer user questions accurately.

--- FAQ KNOWLEDGE BASE ---
${faqContext}
--- END FAQ KNOWLEDGE BASE ---

Instructions:
1. Use previous conversation context when relevant
2. Check if current or previous questions are answered in the FAQ
3. Provide consistent, helpful responses
4. Enhance FAQ answers with relevant context from the conversation
5. Always maintain a professional and friendly tone`;

      // Build messages array carefully
      const messages: GrokMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      // Add conversation history only if it's valid
      if (messageHistory && Array.isArray(messageHistory) && messageHistory.length > 0) {
        // Filter and validate history messages
        const validHistory = messageHistory.filter(
          (msg) => msg && msg.role && msg.content && (msg.role === 'user' || msg.role === 'assistant')
        );
        messages.push(...validHistory);
      }

      // Add the current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      const response = await this.createCompletion({
        messages,
        temperature: 0.6,
        max_tokens: 1024,
      });

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('No content in Grok response');
      }

      return assistantMessage;
    } catch (error: any) {
      throw new Error(`Failed to continue conversation with FAQ: ${error.message}`);
    }
  }
}

// Create a singleton instance
let instance: GrokService | null = null;

export function getGrokService(): GrokService {
  if (!instance) {
    instance = new GrokService();
  }
  return instance;
}

export default GrokService;
