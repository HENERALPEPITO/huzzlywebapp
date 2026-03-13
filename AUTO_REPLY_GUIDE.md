# Auto-Reply Feature Guide

This guide explains how automatic AI replies work in your messaging system.

## Overview

When **Auto-Reply is enabled**, the AI automatically generates and sends replies when you receive messages from workers.

## How It Works

1. **Worker sends you a message** 📨
2. **Real-time: Message arrives** in your inbox
3. **Auto-Reply triggers** (if enabled) ⚡
4. **Grok analyzes the message** against your FAQ
5. **AI-generated reply is sent** automatically 🤖
6. **Both messages appear** in the conversation

## Enabling/Disabling Auto-Reply

In the messaging page, toggle the **Auto-Reply** switch in the top-right:

```
┌─────────────────────────────────────────────────────┐
│ Messaging App      Auto-Reply: [Toggle]  Logout    │
└─────────────────────────────────────────────────────┘
```

- **Blue toggle** = Auto-Reply is ON ✅
- **Gray toggle** = Auto-Reply is OFF ❌

## API Endpoint

### POST /api/auto-reply

**Request:**
```json
{
  "incomingMessage": "What are your business hours?",
  "senderId": "worker-id",
  "receiverId": "your-id",
  "useFAQ": true,
  "faqCategory": "Business",
  "conversationHistory": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello!" }
  ],
  "autoSend": true
}
```

**Response:**
```json
{
  "success": true,
  "reply": "Our business hours are 9 AM to 5 PM, Monday to Friday.",
  "sent": true,
  "messageId": "msg-123"
}
```

## React Hook

### useAutoReply

```typescript
import { useAutoReply } from '@/hooks/useAutoReply';

const { 
  isGenerating,              // Is generating a reply?
  error,                     // Error message if any
  lastReply,                 // Last generated reply
  generateAndSendAutoReply,  // Function to trigger
  reset                      // Clear state
} = useAutoReply({
  enabled: true,             // Turn on/off
  useFAQ: true,             // Use FAQ context
  faqCategory: 'Support'    // Optional category filter
});

// Manually trigger
await generateAndSendAutoReply(
  message,
  senderId,
  receiverId,
  conversationHistory
);
```

## Auto-Reply Format

Auto-replies are sent with `[Auto-Reply]` prefix:

```
[Auto-Reply] Our business hours are 9 AM to 5 PM.
```

This prefix helps both you and the worker know it was auto-generated.

## Conversation Context

Auto-replies use the full conversation history for better context:

1. Previous messages in the thread are analyzed
2. Grok understands the conversation flow
3. Replies are relevant and coherent
4. FAQ knowledge base is applied throughout

## FAQ Integration

Auto-replies automatically use your FAQ knowledge base:

✅ **Questions in FAQ** → Answers from FAQ are provided
✅ **Related topics** → FAQ information is enhanced intelligently
❌ **Unknown questions** → Grok provides helpful general responses

## Customization

### Change FAQ Category

```typescript
const { generateAndSendAutoReply } = useAutoReply({
  useFAQ: true,
  faqCategory: 'Billing'  // Only use Billing FAQs
});
```

### Disable FAQ Usage

```typescript
const { generateAndSendAutoReply } = useAutoReply({
  useFAQ: false  // No FAQ context
});
```

### Generate Without Sending

```typescript
const response = await fetch('/api/auto-reply', {
  method: 'POST',
  body: JSON.stringify({
    incomingMessage: 'Your question?',
    senderId: '...',
    receiverId: '...',
    autoSend: false  // Generate only, don't send
  })
});

const data = await response.json();
console.log('Generated reply:', data.reply);
// You can review before sending
```

## Use Cases

### Business Hours
**Message:** "What are your business hours?"
**Auto-Reply:** "We're open 9 AM to 5 PM, Monday to Friday." (from FAQ)

### Pricing Questions
**Message:** "How much does a plan cost?"
**Auto-Reply:** Detailed pricing from FAQ + availability info

### Account Help
**Message:** "How do I reset my password?"
**Auto-Reply:** Step-by-step instructions from FAQ

### Technical Support
**Message:** "The app is crashing"
**Auto-Reply:** Troubleshooting steps + contact info

## Best Practices

1. **Keep FAQ Updated** – Accurate FAQs = better replies
2. **Test First** – Enable auto-reply, observe quality before wide deployment
3. **Monitor Responses** – Review generated replies occasionally
4. **Use Categories** – Organize FAQs by topic for targeted responses
5. **Set Realistic Expectations** – AI is helpful but not perfect
6. **Fallback Plan** – Have manual support ready for complex issues

## Troubleshooting

### Auto-Reply Not Triggering

**Check:**
- ✅ Toggle is enabled (blue)
- ✅ You're receiving messages in the current conversation
- ✅ FAQ table has data in Supabase
- ✅ Check browser console for errors

### Low Quality Replies

**Solutions:**
- Improve FAQ answers
- Ensure questions in FAQ match common patterns
- Add more specific FAQs
- Check temperature settings in Grok service

### No FAQ Being Used

**Verify:**
- FAQ table exists in Supabase
- FAQ entries have content
- `useFAQ: true` is set in hook
- FAQ category matches if filtering

### Replies Not Sending

**Check:**
- ✅ Database permissions
- ✅ Supabase connection
- ✅ `autoSend` is `true`
- ✅ Check API errors in console

## Utilities

Helper functions in `src/lib/autoReplyUtils.ts`:

```typescript
import {
  generateAutoReply,        // Direct API call
  shouldAutoReply,          // Check if should reply
  formatAutoReplyMessage    // Format with prefix
} from '@/lib/autoReplyUtils';

// Generate programmatically
const result = await generateAutoReply(message, senderId, receiverId);

// Check conditions
if (shouldAutoReply(messageSenderId, currentUserId, isEnabled)) {
  // Trigger auto-reply
}

// Format message
const formatted = formatAutoReplyMessage('My reply');
// Output: "[Auto-Reply] My reply"
```

## API Status Check

```bash
# Test health
curl http://localhost:3000/api/generate-reply
```

## Configuration

Auto-reply settings in `useAutoReply()`:

```typescript
{
  enabled: boolean;        // Enable/disable
  useFAQ: boolean;        // Use FAQ context
  faqCategory?: string;   // Filter FAQs by category
}
```

## Example: Full Setup

```tsx
export function MessagesPage() {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);

  const { generateAndSendAutoReply } = useAutoReply({
    enabled: autoReplyEnabled,
    useFAQ: true,
    faqCategory: 'Support'
  });

  // When message arrives
  const handleNewMessage = async (message) => {
    if (autoReplyEnabled && message.isFromOtherUser) {
      await generateAndSendAutoReply(
        message.content,
        message.senderId,
        currentUserId,
        previousMessages
      );
    }
  };

  return (
    <div>
      <button onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}>
        Auto-Reply: {autoReplyEnabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
```

## Summary

✅ **Auto-replies enabled** in messaging  
✅ **FAQ-based answers** automatically generated  
✅ **One-click toggle** in UI  
✅ **Conversation context** maintained  
✅ **Easy to customize** per use case  

Workers will now receive intelligent, FAQ-backed auto-replies immediately! 🎉
