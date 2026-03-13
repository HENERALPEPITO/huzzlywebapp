# Grok + FAQ Integration Guide

This guide explains how Grok AI is now integrated with your FAQ system to provide contextual, accurate answers based on your knowledge base.

## Overview

The FAQ integration allows Grok to:
- **Answer based on your FAQ knowledge base** – Responses are grounded in your actual FAQ data
- **Search FAQs dynamically** – Find relevant FAQs based on user questions
- **Maintain conversation context** – Keep FAQ context across multiple messages
- **Filter by category** – Use FAQ categories to narrow responses
- **Provide intelligent suggestions** – AI-enhanced answers with FAQ references

## Architecture

```
User Message
    ↓
[Generate Reply API] ← Calls → [Grok Service]
    ↓                                  ↓
 [FAQ Service] ← Loads → [Supabase FAQ Table]
    ↓
 [Format FAQ Context]
    ↓
 [Grok with FAQ Context]
    ↓
Response to User
```

## Database Setup

### FAQ Table Schema

Your Supabase should have a `faq` table with this structure:

```sql
CREATE TABLE faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(255),
  order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id` – Unique identifier
- `question` – The FAQ question
- `answer` – The FAQ answer
- `category` – Optional category grouping (e.g., "Billing", "Technical Support")
- `order` – Display order (optional)
- `created_at` – Creation timestamp
- `updated_at` – Last update timestamp

### Sample Data

```sql
INSERT INTO faq (question, answer, category, "order") VALUES
('How do I reset my password?', 'To reset your password, click "Forgot Password" on the login page and follow the email instructions.', 'Account', 1),
('What payment methods do you accept?', 'We accept all major credit cards and PayPal.', 'Billing', 1),
('Do you offer a free trial?', 'Yes, we offer a 14-day free trial with full access to all features.', 'Billing', 2);
```

## File Structure

### New Files Created

```
src/lib/
├── faqService.ts          # FAQ fetch and format functions
├── faqUtils.ts            # FAQ utilities and helpers
src/hooks/
├── useFAQGrokReply.ts     # Hook for FAQ-based Grok replies
src/components/
├── MessageInputWithFAQ.tsx # UI component with FAQ selector
src/app/api/
├── huzly-faq/route.ts     # API endpoint for FAQ operations
```

### Modified Files

- `src/lib/grokService.ts` – Added FAQ context methods
- `src/app/api/generate-reply/route.ts` – Added FAQ parameters
- `src/hooks/useGrokReply.ts` – Added FAQ state tracking

## Core Components

### 1. FAQ Service (`src/lib/faqService.ts`)

Handles all FAQ data operations.

**Key Functions:**

```typescript
// Fetch all FAQs
const faqs = await fetchAllFAQs();

// Fetch by category
const billingFAQs = await fetchFAQsByCategory('Billing');

// Fetch single FAQ
const faq = await fetchFAQById('faq-id');

// Format FAQs for AI context
const context = formatFAQsAsContext(faqs);
// Output:
// Q1: How do I reset my password?
// A1: To reset your password...

// Create system prompt with FAQ context
const prompt = createFAQSystemPrompt(faqs, 'Custom instructions');
```

### 2. FAQ API Endpoint (`src/app/api/huzly-faq/route.ts`)

RESTful endpoint for FAQ operations.

**GET Requests:**
```bash
# Get all FAQs
GET /api/huzly-faq

# Get FAQs by category
GET /api/huzly-faq?category=Billing

# Search FAQs
GET /api/huzly-faq?search=password,reset

# Get as formatted text (for Grok context)
GET /api/huzly-faq?format=text
```

**POST Requests:**
```bash
# Search with advanced options
POST /api/huzly-faq
{
  "category": "Billing",
  "search": ["payment", "methods"],
  "formatAsContext": true
}
```

**Response Example:**
```json
{
  "success": true,
  "count": 2,
  "faqs": [
    {
      "id": "123",
      "question": "How do I reset my password?",
      "answer": "Click 'Forgot Password' on login...",
      "category": "Account"
    }
  ]
}
```

### 3. Grok Service Enhancements

New methods for FAQ-based responses:

```typescript
import { getGrokService } from '@/lib/grokService';

const grok = getGrokService();

// Generate response based on FAQ
const reply = await grok.generateFAQBasedResponse(
  "How do I reset my password?",
  faqContext  // Formatted FAQ string
);

// Continue conversation with FAQ context
const response = await grok.continueConversationWithFAQ(
  messageHistory,
  "Tell me more",
  faqContext
);
```

### 4. React Hooks

#### `useGrokReply` (Enhanced)

```typescript
import { useGrokReply } from '@/hooks/useGrokReply';

const {
  reply,
  isLoading,
  error,
  faqUsed,           // Whether FAQ was used
  faqItemsUsed,      // Number of FAQ items referenced
  generateReply
} = useGrokReply({
  useFAQ: true,
  faqCategory: 'Billing'
});

await generateReply(userMessage);
```

#### `useFAQGrokReply` (Specialized)

```typescript
import { useFAQGrokReply } from '@/hooks/useFAQGrokReply';

const {
  reply,
  isLoading,
  faqUsed,
  categories,          // Available FAQ categories
  selectedCategory,
  generateReply,
  generateReplyWithSearch,  // Search within FAQ
  setSelectedCategory
} = useFAQGrokReply({
  category: 'Billing'
});

// With search
await generateReplyWithSearch(
  "Payment methods?",
  "payment,credit card"
);
```

### 5. UI Component

#### `MessageInputWithFAQ`

Enhanced message input with FAQ category selector and AI suggestions.

```tsx
import MessageInputWithFAQ from '@/components/MessageInputWithFAQ';

<MessageInputWithFAQ 
  onSend={handleSendMessage}
  defaultCategory="Billing"
  showFAQIndicator={true}
/>
```

**Features:**
- FAQ category dropdown selector
- AI suggestion button (with Sparkles icon)
- FAQ usage indicator badge
- Category-filtered suggestions

## Usage Patterns

### Pattern 1: Simple FAQ-Based Reply

```typescript
const { reply, generateReply } = useGrokReply({ useFAQ: true });

await generateReply("How do I reset my password?");
// Grok will check FAQ and provide answer based on knowledge base
```

### Pattern 2: Category-Specific FAQ

```typescript
const { reply, generateReply } = useGrokReply({
  useFAQ: true,
  faqCategory: 'Billing'
});

await generateReply("Do you have a free trial?");
// Only Billing FAQs will be used as context
```

### Pattern 3: FAQ Search

```typescript
const { reply, generateReplyWithSearch } = useFAQGrokReply();

await generateReplyWithSearch(
  "Can I change my plan?",
  "plan,upgrade,downgrade"  // Search keywords
);
```

### Pattern 4: Server-Side FAQ Integration

```typescript
import { getGrokService } from '@/lib/grokService';
import { fetchAllFAQs, formatFAQsAsContext } from '@/lib/faqService';

const grok = getGrokService();
const faqs = await fetchAllFAQs();
const faqContext = formatFAQsAsContext(faqs);

const response = await grok.generateFAQBasedResponse(userMessage, faqContext);
```

### Pattern 5: Component Integration

```tsx
import MessageInputWithFAQ from '@/components/MessageInputWithFAQ';

export function SupportChat() {
  const handleSend = async (message: string) => {
    // Message already processed with FAQ context
    // by MessageInputWithFAQ component
    await sendMessage(message);
  };

  return (
    <MessageInputWithFAQ
      onSend={handleSend}
      defaultCategory="Technical Support"
    />
  );
}
```

## API Request Examples

### Get FAQ-Based Reply with cURL

```bash
curl -X POST http://localhost:3000/api/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I reset my password?",
    "useFAQ": true,
    "faqCategory": "Account"
  }'
```

### Search FAQs and Get Context

```bash
curl http://localhost:3000/api/huzly-faq \
  -G --data-urlencode "search=password,reset" \
  --data-urlencode "format=text"
```

### Get FAQ with Advanced Search

```bash
curl -X POST http://localhost:3000/api/huzly-faq \
  -H "Content-Type: application/json" \
  -d '{
    "search": ["payment", "card"],
    "category": "Billing",
    "formatAsContext": true
  }'
```

## FAQ Utilities (`src/lib/faqUtils.ts`)

Available helper functions:

```typescript
import {
  loadFAQData,              // Load FAQ from service
  isFAQAvailable,           // Check if FAQs exist
  fetchFAQFromAPI,          // Get FAQ from API endpoint
  generateFAQBasedReply,    // Generate reply with FAQ
  getFAQCategories,         // Get all categories
  getFAQCount,              // Count FAQs
  parseFAQSearchQuery,      // Parse search keywords
  formatFAQForDisplay       // Format for UI display
} from '@/lib/faqUtils';

// Examples:
const categories = await getFAQCategories();
// ['Account', 'Billing', 'Technical Support']

const count = await getFAQCount('Billing');
// 5

const reply = await generateFAQBasedReply(
  "What payment methods?",
  "Billing"
);
```

## API Response Fields

### Generate Reply Response

```json
{
  "success": true,
  "reply": "Your assistant's response...",
  "model": "grok-beta",
  "usedFAQ": true,
  "faqItemsUsed": 2
}
```

### Health Check Response

```json
{
  "status": "ok",
  "service": "grok-ai",
  "model": "grok-beta",
  "faqAvailable": true,
  "faqCount": 15
}
```

## Best Practices

1. **Keep FAQ Answers Concise** – 2-3 sentences maximum
2. **Use Clear Categories** – Organize FAQs logically
3. **Update Regularly** – Keep answers current
4. **Test Responses** – Verify Grok uses FAQ data appropriately
5. **Provide Fallback** – Have general instructions if FAQ is empty
6. **Monitor Usage** – Check `faqUsed` and `faqItemsUsed` in responses
7. **Search Keywords** – Use relevant, short keywords for FAQ search

## Troubleshooting

### FAQ Table Not Found

**Error:** `relation "faq" does not exist`

**Solution:**
1. Create the FAQ table in Supabase:
```sql
CREATE TABLE faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(255),
  "order" INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
2. Add some FAQ data

### No FAQs Being Used

**Symptoms:** `usedFAQ` is false, `faqItemsUsed` is 0

**Solution:**
1. Check if FAQ table has data: `GET /api/huzly-faq`
2. Verify `useFAQ: true` is passed to the hook
3. Check `faqCategory` filter if using categories
4. Ensure FAQ content is relevant to the question

### Empty FAQ List

**Error:** FAQ endpoint returns `count: 0`

**Solution:**
1. Insert sample FAQ data
2. Verify table permissions in Supabase
3. Check network requests in browser DevTools

## Migration from Previous Implementation

If upgrading from the basic Grok integration:

1. **Update imports:**
```typescript
// Old
import { useGrokReply } from '@/hooks/useGrokReply';

// New (for FAQ support)
import { useFAQGrokReply } from '@/hooks/useFAQGrokReply';
```

2. **Update component:**
```tsx
// Old
<MessageInputWithSuggestions onSend={handleSend} />

// New
<MessageInputWithFAQ onSend={handleSend} />
```

3. **Don't forget to:**
   - Create FAQ table in Supabase
   - Add FAQ data
   - Restart dev server

## Examples

### Full Chat Component with FAQ

```tsx
import { useState } from 'react';
import MessageInputWithFAQ from '@/components/MessageInputWithFAQ';
import ChatMessages from '@/components/ChatMessages';

export function FAQChat() {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = async (message: string) => {
    // Message is already processed with FAQ context
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: message,
      isSender: true,
      timestamp: new Date()
    }]);

    // Send to server...
  };

  return (
    <div className="h-screen flex flex-col">
      <ChatMessages messages={messages} />
      <MessageInputWithFAQ 
        onSend={handleSendMessage}
        defaultCategory="Support"
        showFAQIndicator={true}
      />
    </div>
  );
}
```

## Summary

- ✅ FAQ data integrated with Grok responses
- ✅ Category-based filtering
- ✅ Search functionality
- ✅ Conversational context maintained
- ✅ UI components with category selector
- ✅ React hooks for easy integration
- ✅ RESTful API endpoints
- ✅ Comprehensive utilities

Your Grok AI now provides answers grounded in your actual FAQ knowledge base!
