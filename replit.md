# Huzzly Web

A Next.js 16 web application migrated from Vercel to Replit.

## Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **React**: 19
- **Styling**: Tailwind CSS v4
- **Backend/DB**: Supabase
- **AI**: xAI (Grok) via XAI_API_KEY
- **Package manager**: npm

## Project Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/app/messages/` — Messaging page (responsive, mobile-first)
- `src/components/` — Reusable React components
  - `LeftSidebar.tsx` — Desktop: vertical icon sidebar; Mobile: bottom nav bar
  - `ConversationListPanel.tsx` — Search, tabs, conversation list with mobile header
  - `ContactList.tsx` — Contact cards with search filtering
  - `ChatHeader.tsx` — Chat header with back button (mobile) and action icons
  - `ChatMessages.tsx` — Message list with date separators
  - `MessageBubble.tsx` — Colored message bubbles with attachment rendering (images/PDFs)
  - `MessageInputWithFAQ.tsx` — Input bar with FAQ/AI suggestions and file upload
  - `ContactDetails.tsx` — Right panel (desktop) / overlay (mobile) with contact info
  - `EmptyConversation.tsx` — Empty state for no selected conversation
- `src/lib/` — Utilities, Supabase client, FAQ content, Grok service
- `src/hooks/` — Custom React hooks (useAutoReply, useGrokReply, useFAQGrokReply)
- `src/services/` — Service layer (messages with file upload, auth, contacts)
- `public/images/` — Static assets (logo.png)
- `supabase/` — Supabase config

## Responsive Design
- **Desktop (lg+)**: Full 3-column layout — sidebar | contacts | chat | details
- **Tablet (md-lg)**: Sidebar + contacts + chat (details hidden, accessible via button)
- **Mobile (<md)**: Bottom nav, full-screen views toggled via `mobileView` state (contacts → chat → details)
- Breakpoints: `md` (768px) for sidebar/contact list, `lg` (1024px) for contact details panel

## Attachment System
- Attachments stored as `{fileUrl, fileName, fileSize, fileType}` objects in Supabase `messages.attachments` column
- Upload via Supabase Storage bucket `message-files` with 7-day signed URLs
- Supports images (inline preview), PDFs (file card), and documents

## AI / FAQ System
- Auto-reply: uses `/api/auto-reply` with Grok + FAQ content as system context
- Manual suggestions: sparkles button in input, uses `/api/generate-reply` with FAQ
- FAQ content: hardcoded in `src/lib/faqContent.ts`, covers worker and client topics
- System prompts strongly prioritize FAQ as authoritative source

## Running the App
```
npm run dev     # Development server on port 5000
npm run build   # Production build
npm run start   # Production server on port 5000
```

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `XAI_API_KEY` — xAI (Grok) API key

## Replit Notes
- Dev/start scripts bind to `0.0.0.0:5000` for Replit preview pane compatibility
- Workflow: "Start application" runs `npm run dev`
- Tailwind CSS v4 uses `@import "tailwindcss" source(none)` with `@source` directives to avoid Turbopack compatibility issues with generated mask utilities
