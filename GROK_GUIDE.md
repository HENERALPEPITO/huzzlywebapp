# Grok AI Integration Guide

This guide explains how to use Grok AI in your Huzzly messaging application to generate intelligent, context-aware responses and suggestions.

## Overview

The Grok integration provides:
- **Auto-reply generation**: Generate smart replies to user messages
- **Conversation continuation**: Maintain context across multiple messages
- **Message summarization**: Summarize conversation threads
- **Topic extraction**: Identify key topics in messages
- **API endpoint**: `POST /api/generate-reply` for generating replies

## Configuration

### Environment Variables



If you need to update or change your API key:
1. Generate a new API key from [x.ai](https://api.x.ai)
2. Update `XAI_API_KEY` in `.env.local`
3. Restart your development server

## Core Components

### 1. GrokService (`src/lib/grokService.ts`)

The main service class for interacting with the Grok API.

**Features:**
- Direct API communication with Grok
- Error handling and validation
- Support for system prompts and conversation history
- Singleton pattern for efficient resource usage

**Example Usage:**

```typescript
import { getGrokService } from '@/lib/grokService';

const grokService = getGrokService();

// Generate a simple reply
const reply = await grokService.generateAutoReply(
  'How do I reset my password?',
  'You are a helpful customer support agent.'
);

// Continue a conversation
const messages = [
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'What is AI?' },
  { role: 'assistant', content: 'AI is...' }
];
const response = await grokService.continueConversation(messages, 'Tell me more');

// Summarize messages
const summary = await grokService.summarizeMessages([
  'I need help with X',
  'Here are the steps...',
  'Thanks! That worked!'
]);
```

### 2. API Endpoint (`src/app/api/generate-reply/route.ts`)

RESTful endpoint for generating replies from client-side code.

**Endpoints:**
- `POST /api/generate-reply` - Generate a reply
- `GET /api/generate-reply` - Health check

**POST Request Example:**

```typescript
const response = await fetch('/api/generate-reply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What are your business hours?',
    context: 'You are a helpful business assistant.',
    conversationHistory: [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello! How can I help?' }
    ]
  })
});

const data = await response.json();
console.log(data.reply); // AI-generated response
```

### 3. React Hook (`src/hooks/useGrokReply.ts`)

Custom React hook for easy integration in components.

**Features:**
- Automatic loading states
- Error handling
- Support for conversation history
- Reset functionality

**Example Usage:**

```tsx
import { useGrokReply } from '@/hooks/useGrokReply';

export function ChatComponent() {
  const { reply, isLoading, error, generateReply } = useGrokReply({
    context: 'You are a customer service agent.'
  });

  const handleGenerateSuggestion = async () => {
    await generateReply(userMessage, conversationHistory);
  };

  return (
    <div>
      {error && <p className="error">{error}</p>}
      {isLoading && <p>Generating...</p>}
      {reply && <p className="suggestion">{reply}</p>}
      <button onClick={handleGenerateSuggestion}>Get Suggestion</button>
    </div>
  );
}
```

### 4. Utilities (`src/lib/grokUtils.ts`)

Helper functions and constants for common operations.

**Available Contexts:**
```typescript
import { GROK_CONTEXTS } from '@/lib/grokUtils';

// Pre-defined contexts for different use cases
GROK_CONTEXTS.customer_service
GROK_CONTEXTS.technical_support
GROK_CONTEXTS.sales
GROK_CONTEXTS.general
```

**Helper Functions:**
```typescript
import { 
  generateReplySuggestion,
  isGrokAvailable,
  extractTopics 
} from '@/lib/grokUtils';

// Generate a suggestion with a specific context
const suggestion = await generateReplySuggestion(
  'How much does it cost?',
  GROK_CONTEXTS.sales
);

// Check if Grok service is available
const available = await isGrokAvailable();

// Extract topics from a message
const topics = await extractTopics('I need help with billing and accounts');
```

### 5. Enhanced Message Input Component

The `MessageInputWithSuggestions` component provides an integrated UI for message input with Grok suggestions.

**Features:**
- AI suggestion button with loading state
- Suggestion preview with accept/dismiss options
- Seamless integration with existing message flow

**Usage:**

```tsx
import MessageInputWithSuggestions from '@/components/MessageInputWithSuggestions';

export function ChatWindow() {
  return (
    <MessageInputWithSuggestions
      onSend={handleSendMessage}
      isLoading={isSending}
      enableSuggestions={true}
      suggestionsContext="You are a helpful customer service representative."
    />
  );
}
```

## Common Patterns

### Pattern 1: Simple Reply Suggestion

```typescript
// User types a message, clicks a button to get an AI suggestion
const { reply, isLoading, generateReply } = useGrokReply();

const handleGetSuggestion = async () => {
  await generateReply(userInput);
  // `reply` state will be updated with the suggestion
};
```

### Pattern 2: Conversation Context

```typescript
// Maintain conversation history for contextual replies
const messages = [
  { role: 'user', content: 'What services do you offer?' },
  { role: 'assistant', content: 'We offer...' },
  { role: 'user', content: 'What about pricing?' }
];

const { reply, generateReply } = useGrokReply();
await generateReply(messages[messages.length - 1].content, messages);
```

### Pattern 3: Scheduled Auto-Replies

```typescript
// Generate automatic replies for offline availability
async function setupAutoReply(message, autoReplyContext) {
  const grokService = getGrokService();
  const autoReply = await grokService.generateAutoReply(
    message,
    'You are an automated assistant. Reply automatically to messages.'
  );
  
  // Store in database or send immediately
  await sendAutoReply(autoReply);
}
```

### Pattern 4: Summary Generation

```typescript
// Generate a summary when closing a conversation
const conversationMessages = messageHistory.map(m => m.content);
const summary = await grokService.summarizeMessages(conversationMessages);
await saveSummary(conversationId, summary);
```

## API Models

Currently supported models:
- `grok-beta` (default) - Latest Grok model for balanced performance and quality

## Configuration Options

When calling Grok functions, you can customize:

```typescript
const params = {
  temperature: 0.7,      // 0-1: Lower = more focused, Higher = more creative
  max_tokens: 512,       // Maximum length of the response
  stream: false,         // Toggle streaming responses
  model: 'grok-beta'     // Model to use
};
```

**Temperature Guidelines:**
- **0.0-0.3**: Deterministic, fact-focused (ideal for support)
- **0.5-0.7**: Balanced (ideal for suggestions)
- **0.8-1.0**: Creative, varied (ideal for brainstorming)

## Error Handling

```typescript
try {
  const reply = await grokService.generateAutoReply(message);
} catch (error) {
  if (error.message.includes('XAI_API_KEY')) {
    // Handle missing API key
    console.error('Grok API key not configured');
  } else if (error.message.includes('rate limit')) {
    // Handle rate limiting
    console.error('Grok rate limit exceeded');
  } else {
    // Handle other errors
    console.error('Grok API error:', error);
  }
}
```

## Troubleshooting

### "XAI_API_KEY not configured"
- Check that `XAI_API_KEY` is set in `.env.local`
- Restart your development server after changing environment variables
- Ensure the key is valid at [x.ai](https://api.x.ai)

### "Failed to generate reply"
- Check the browser console for detailed error messages
- Verify your internet connection
- Check if API rate limits have been exceeded
- Ensure the Grok API service status is operational

### Empty or low-quality responses
- Improve your prompt/context instruction
- Adjust the temperature parameter (try 0.5-0.7)
- Provide conversation history for better context
- Use specific, clear language in prompts

## Best Practices

1. **Always provide context**: Use system prompts to define the AI's role and behavior
2. **Include conversation history**: For better contextual understanding
3. **Handle errors gracefully**: Show appropriate UI feedback when Grok is unavailable
4. **Set reasonable timeouts**: Client-side requests should have timeout handling
5. **Monitor token usage**: Keep track of API costs through response usage statistics
6. **Test different temperatures**: Find the right balance for your use case
7. **Cache results**: Avoid regenerating the same suggestions

## Integration Examples

### Example 1: Customer Service Assistant

```tsx
import MessageInputWithSuggestions from '@/components/MessageInputWithSuggestions';

export function CustomerServiceChat() {
  return (
    <MessageInputWithSuggestions
      onSend={handleSendMessage}
      enableSuggestions={true}
      suggestionsContext={GROK_CONTEXTS.customer_service}
    />
  );
}
```

### Example 2: Server-Side Auto-Reply

```typescript
// Supabase Edge Function
import { getGrokService } from '@/lib/grokService';

export async function handleIncomingMessage(message) {
  const grokService = getGrokService();
  
  const autoReply = await grokService.generateAutoReply(
    message.content,
    'Generate a brief, helpful auto-reply. Be professional and friendly.'
  );
  
  return {
    originalMessage: message.id,
    autoReply: autoReply,
    timestamp: new Date(),
  };
}
```

## Migration from OpenAI

If you were previously using OpenAI, here's how to migrate:

1. **Remove OpenAI package**: `npm remove openai`
2. **Remove OpenAI key from .env.local**: Delete `OPENAI_API_KEY=...`
3. **Replace imports**:
   ```typescript
   // Old: import OpenAI from 'openai';
   // New:
   import { getGrokService } from '@/lib/grokService';
   ```
4. **Update API calls**: Use the Grok methods instead
5. **Test thoroughly**: Verify all AI features work with Grok

## License

This Grok integration follows the same license as your Huzzly application.

## Support

For issues with:
- **Grok API**: Visit [x.ai](https://x.ai)
- **Integration**: Check this guide's troubleshooting section
- **App**: See your project documentation
