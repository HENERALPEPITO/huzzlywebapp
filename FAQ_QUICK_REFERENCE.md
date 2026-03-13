# FAQ + Grok Integration Quick Reference

## Setup Required

### 1. Create FAQ Table in Supabase

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

### 2. Add Sample FAQ Data

```sql
INSERT INTO faq (question, answer, category, "order") VALUES
('How do I reset my password?', 'Click Forgot Password on login...', 'Account', 1),
('Do you offer a free trial?', 'Yes, 14 days free...', 'Billing', 1),
('What payment methods?', 'Credit cards and PayPal...', 'Billing', 2);
```

### 3. Install Dependencies
```bash
npm install  # Already includes axios
```

### 4. Restart Dev Server
```bash
npm run dev
```

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/faqService.ts` | FAQ CRUD operations |
| `src/lib/faqUtils.ts` | FAQ helper utilities |
| `src/hooks/useFAQGrokReply.ts` | FAQ-specific React hook |
| `src/components/MessageInputWithFAQ.tsx` | UI with category selector |
| `src/app/api/huzly-faq/route.ts` | FAQ REST API |

## Quick Start

### Option 1: Use FAQ Hook (Easiest)

```tsx
import { useFAQGrokReply } from '@/hooks/useFAQGrokReply';

export function MyComponent() {
  const { reply, isLoading, generateReply } = useFAQGrokReply({
    category: 'Billing'
  });

  const handleClick = async () => {
    await generateReply('Do you have a free trial?');
    console.log(reply); // FAQ-based answer
  };

  return <button onClick={handleClick}>Get Answer</button>;
}
```

### Option 2: Use FAQ Component

```tsx
import MessageInputWithFAQ from '@/components/MessageInputWithFAQ';

<MessageInputWithFAQ 
  onSend={handleSendMessage}
  defaultCategory="Support"
/>
```

### Option 3: API Call

```typescript
// Generate FAQ-based reply
fetch('/api/generate-reply', {
  method: 'POST',
  body: JSON.stringify({
    message: 'How do I reset my password?',
    useFAQ: true,
    faqCategory: 'Account'
  })
})
.then(r => r.json())
.then(data => console.log(data.reply));
```

### Option 4: API Fetch FAQs

```typescript
// Get all FAQs
fetch('/api/huzly-faq')
  .then(r => r.json())
  .then(data => console.log(data.faqs));

// Get FAQs by category
fetch('/api/huzly-faq?category=Billing')
  .then(r => r.json())
  .then(data => console.log(data.faqs));

// Search FAQs
fetch('/api/huzly-faq?search=password,reset')
  .then(r => r.json())
  .then(data => console.log(data.faqs));
```

## Core Functions

### Grok Service (Server-Side)

```typescript
import { getGrokService } from '@/lib/grokService';

const grok = getGrokService();

// Answer based on FAQ
const reply = await grok.generateFAQBasedResponse(
  userMessage,
  faqContextString
);

// Continue conversation with FAQ
const reply = await grok.continueConversationWithFAQ(
  messageHistory,
  userMessage,
  faqContextString
);
```

### FAQ Service

```typescript
import { 
  fetchAllFAQs,
  fetchFAQsByCategory,
  formatFAQsAsContext,
  createFAQSystemPrompt,
  searchFAQs
} from '@/lib/faqService';

// Get and format FAQs
const faqs = await fetchAllFAQs();
const context = formatFAQsAsContext(faqs);

// Filter by category
const billingFAQs = await fetchFAQsByCategory('Billing');

// Search
const results = searchFAQs(faqs, ['password', 'reset']);
```

### FAQ Utils

```typescript
import {
  loadFAQData,
  isFAQAvailable,
  fetchFAQFromAPI,
  generateFAQBasedReply,
  getFAQCategories,
  getFAQCount
} from '@/lib/faqUtils';

const categories = await getFAQCategories();
const count = await getFAQCount('Billing');
const isAvailable = await isFAQAvailable();
```

## Hook API

### useGrokReply (Enhanced with FAQ)

```typescript
const {
  reply,              // AI-generated response
  isLoading,          // Is generating?
  error,              // Error message if any
  faqUsed,            // Was FAQ used?
  faqItemsUsed,       // How many FAQ items?
  generateReply,      // Function to generate
  reset              // Clear state
} = useGrokReply({
  context: 'Optional custom context',
  useFAQ: true,
  faqCategory: 'Billing'
});

await generateReply(message, conversationHistory);
```

### useFAQGrokReply (Specialized)

```typescript
const {
  reply,
  isLoading,
  error,
  faqUsed,
  faqItemsUsed,
  categories,              // Available FAQ categories
  selectedCategory,        // Currently selected
  generateReply,
  generateReplyWithSearch, // With keyword search
  setSelectedCategory,     // Change category
  reset
} = useFAQGrokReply({
  category: 'Billing'
});

// Generate with search
await generateReplyWithSearch(
  message,
  'payment,methods'  // Search keywords
);
```

## API Endpoints

### POST /api/generate-reply

**Request:**
```json
{
  "message": "How do I reset password?",
  "useFAQ": true,
  "faqCategory": "Account",
  "faqSearch": "password,reset",
  "conversationHistory": [...]
}
```

**Response:**
```json
{
  "success": true,
  "reply": "To reset your password...",
  "model": "grok-beta",
  "usedFAQ": true,
  "faqItemsUsed": 1
}
```

### GET /api/generate-reply

Health check:
```json
{
  "status": "ok",
  "service": "grok-ai",
  "faqAvailable": true,
  "faqCount": 15
}
```

### GET /api/huzly-faq

Query parameters:
- `category` - Filter by category
- `search` - Search keywords (comma-separated)
- `format` - Response format: `json` or `text`

**Examples:**
```bash
GET /api/huzly-faq
GET /api/huzly-faq?category=Billing
GET /api/huzly-faq?search=password,reset
GET /api/huzly-faq?format=text
```

### POST /api/huzly-faq

Advanced search:
```json
{
  "category": "Billing",
  "search": ["payment", "methods"],
  "formatAsContext": true
}
```

## Common Patterns

### Pattern 1: Auto-Suggest with FAQ

```tsx
const { reply, generateReply } = useFAQGrokReply();

const handleGenerateSuggestion = async () => {
  await generateReply(userMessage);
};
```

### Pattern 2: Category Filtering

```tsx
const { reply, selectedCategory, setSelectedCategory, generateReply } = useFAQGrokReply();

const handleCategoryChange = (cat) => {
  setSelectedCategory(cat);
};

await generateReply(message);
```

### Pattern 3: FAQ Search

```tsx
const { reply, generateReplyWithSearch } = useFAQGrokReply();

await generateReplyWithSearch(
  userMessage,
  'billing,payment'
);
```

### Pattern 4: Server-Side Processing

```typescript
import { fetchAllFAQs, formatFAQsAsContext } from '@/lib/faqService';
import { getGrokService } from '@/lib/grokService';

const faqs = await fetchAllFAQs();
const context = formatFAQsAsContext(faqs);
const grok = getGrokService();
const response = await grok.generateFAQBasedResponse(message, context);
```

## Check FAQ Status

```typescript
// Health check
const response = await fetch('/api/generate-reply');
const data = await response.json();
console.log(data.faqAvailable);  // true/false
console.log(data.faqCount);      // number of FAQs
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| FAQ not used | Check if table exists, has data, `useFAQ: true` is set |
| Empty categories | Ensure FAQ entries have `category` field |
| No results on search | Verify search keywords match FAQ content |
| API 500 error | Check Supabase connection, FAQ table exists |

## Next Steps

1. ✅ Create FAQ table in Supabase
2. ✅ Add FAQ data
3. ✅ Deploy code changes
4. ✅ Test with `/api/generate-reply`
5. ✅ Integrate component into UI
6. ✅ Monitor FAQ usage in responses

## Documentation

- **Full Guide:** See `FAQ_INTEGRATION_GUIDE.md`
- **Grok Guide:** See `GROK_GUIDE.md`
- **Grok Reference:** See `GROK_QUICK_REFERENCE.md`

## Support

Test endpoints:
- `GET /api/generate-reply` – Health check
- `GET /api/huzly-faq` – List all FAQs
- `POST /api/huzly-faq` – Advanced FAQ search
