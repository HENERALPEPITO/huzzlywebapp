# Grok Integration Quick Reference

## Files Created

### Core Services
- **`src/lib/grokService.ts`** - Main Grok API service class
- **`src/lib/grokUtils.ts`** - Helper functions and constants
- **`src/hooks/useGrokReply.ts`** - React hook for component integration

### API Endpoints
- **`src/app/api/generate-reply/route.ts`** - REST API for generating replies

### Components
- **`src/components/MessageInputWithSuggestions.tsx`** - UI component with built-in AI suggestions

### Documentation
- **`GROK_GUIDE.md`** - Comprehensive integration guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Use in Your App

**Option A: React Hook (Easiest)**
```tsx
import { useGrokReply } from '@/hooks/useGrokReply';

const { reply, isLoading, generateReply } = useGrokReply({
  context: 'You are a helpful assistant.'
});

await generateReply('User message here');
```

**Option B: Component**
```tsx
import MessageInputWithSuggestions from '@/components/MessageInputWithSuggestions';

<MessageInputWithSuggestions 
  onSend={handleSend}
  enableSuggestions={true}
/>
```

**Option C: Direct API Call**
```typescript
const response = await fetch('/api/generate-reply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Your message' })
});
```

**Option D: Server-Side Service**
```typescript
import { getGrokService } from '@/lib/grokService';

const grokService = getGrokService();
const reply = await grokService.generateAutoReply('message');
```

## Key Features

✅ **Auto-reply generation** - Generate intelligent responses  
✅ **Conversation context** - Maintain message history  
✅ **Message summarization** - Summary generation  
✅ **API endpoint** - RESTful interface  
✅ **React integration** - Hooks and components  
✅ **Error handling** - Comprehensive error management  
✅ **Customizable context** - Define AI behavior  

## Environment Setup

Your `.env.local` already has:
```env
XAI_API_KEY=xai-qS7zZQxepkKUMeUucIyexhPyrxdDvJWx9qQCLgpFkweucxNBn1wzFEI8Ci6Y1cuzuPdC54Yizx656lLL
```

## Usage Examples

### Customer Service Context
```typescript
import { GROK_CONTEXTS } from '@/lib/grokUtils';

const { reply, generateReply } = useGrokReply({
  context: GROK_CONTEXTS.customer_service
});
```

### Suggest a Reply
```typescript
const { reply, isLoading, generateReply } = useGrokReply();
await generateReply('How can I help you?');
if (reply) console.log('Suggestion:', reply);
```

### Conversation with History
```typescript
const history = [
  { role: 'user', content: 'What is AI?' },
  { role: 'assistant', content: 'AI is artificial intelligence...' }
];
await generateReply('Tell me more', history);
```

## API Reference

### POST /api/generate-reply
```json
{
  "message": "User message",
  "context": "Optional system prompt",
  "conversationHistory": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response:
```json
{
  "success": true,
  "reply": "Generated AI response",
  "model": "grok-beta"
}
```

### GET /api/generate-reply
Health check endpoint - returns status.

## Updating the Original MessageInput Component

To add AI suggestions to your existing `MessageInput` component:

```tsx
// Import the new component with suggestions
import MessageInputWithSuggestions from '@/components/MessageInputWithSuggestions';

// Use it instead of MessageInput
<MessageInputWithSuggestions 
  onSend={handleSendMessage} 
  isLoading={isSending}
  enableSuggestions={true}
  suggestionsContext="You are a helpful customer service representative."
/>
```

## Removed/Updated

- ✅ Replaced OpenAI references with Grok
- ✅ Removed dependency on `openai` package
- ✅ Updated `package.json` to include `axios`

## Next Steps

1. **Run `npm install`** to install axios
2. **Restart your dev server** - `npm run dev`
3. **Test the API** - Visit `/api/generate-reply` with GET
4. **Integrate into your UI** - Use the components, hooks, or API
5. **Review `GROK_GUIDE.md`** for detailed documentation and patterns

## Supported Contexts

```typescript
GROK_CONTEXTS.customer_service    // For support scenarios
GROK_CONTEXTS.technical_support   // For tech help
GROK_CONTEXTS.sales              // For sales interactions
GROK_CONTEXTS.general            // Default helpful assistant
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API key not found | Check `XAI_API_KEY` in `.env.local` |
| Failed to generate | Check internet connection, API status |
| Low quality responses | Adjust temperature (0.5-0.7), improve context |
| Rate limit errors | Reduce request frequency, check API quota |

## Support Resources

- **Full Guide**: See `GROK_GUIDE.md`
- **Grok API**: https://api.x.ai
- **x.ai**: https://x.ai
