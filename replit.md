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
- `src/app/messages/` — Messaging page (redesigned to match Figma)
- `src/components/` — Reusable React components
  - `LeftSidebar.tsx` — Dark navy sidebar with icon navigation
  - `ConversationListPanel.tsx` — Search, tabs, group conversation list
  - `ContactList.tsx` — Group conversation cards with avatar stacks
  - `ChatHeader.tsx` — Chat header with member avatars and action icons
  - `ChatMessages.tsx` — Message list with date separators
  - `MessageBubble.tsx` — Colored message bubbles with sender metadata
  - `MessageInputWithFAQ.tsx` — Input bar with FAQ/AI suggestion support
  - `ContactDetails.tsx` — Right panel with group/contact info
  - `EmptyConversation.tsx` — Empty state for no selected conversation
- `src/lib/` — Utilities, Supabase client, services
- `src/hooks/` — Custom React hooks
- `src/services/` — Service layer (auth, FAQ, contacts, etc.)
- `public/` — Static assets
- `supabase/` — Supabase config

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
