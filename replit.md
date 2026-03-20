# Huzzly Web

A Next.js 16 web application migrated from Vercel to Replit.

## Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **React**: 19
- **Styling**: Tailwind CSS v4
- **Backend/DB**: Supabase (DMs, auth) + Replit PostgreSQL (groups)
- **AI**: xAI (Grok) via XAI_API_KEY
- **Package manager**: npm

## Project Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/app/messages/` — Messaging page (responsive, mobile-first)
- `src/app/api/groups/` — Group CRUD API routes (Replit PostgreSQL)
- `src/app/api/groups/[groupId]/messages/` — Group messaging API
- `src/app/api/groups/[groupId]/members/` — Add members to group
- `src/app/api/groups/setup/` — Auto-creates group tables on first use
- `src/app/api/unread-counts/` — Real unread message counts from Supabase
- `src/components/` — Reusable React components
  - `LeftSidebar.tsx` — Desktop: vertical icon sidebar; Mobile: bottom nav bar
  - `ConversationListPanel.tsx` — Search, tabs (Worker/Groups/Support), real unread badge
  - `ContactList.tsx` — Contact cards with real unread counts
  - `GroupList.tsx` — Group list with create button
  - `CreateGroupModal.tsx` — Modal to name group and select contacts
  - `ChatHeader.tsx` — Chat header with back button (mobile), group subtitle support
  - `ChatMessages.tsx` — Message list with date separators
  - `MessageBubble.tsx` — Colored message bubbles with attachment rendering (images/PDFs)
  - `MessageInputWithFAQ.tsx` — Input bar with FAQ/AI suggestions and file upload
  - `ContactDetails.tsx` — Right panel (desktop) / overlay (mobile) with contact info
  - `EmptyConversation.tsx` — Empty state for no selected conversation
- `src/lib/` — Utilities, Supabase client, FAQ content, Grok service
- `src/hooks/` — Custom React hooks (useAutoReply, useGrokReply, useFAQGrokReply)
- `src/services/` — Service layer
  - `messages.service.ts` — DM messages via Supabase (fetch, send, subscribe, mark read)
  - `groups.service.ts` — Groups + group messages via API routes (fetch, create, send)
- `public/images/` — Static assets (logo.png)

## Database Architecture
- **Supabase**: `messages` table (DMs), `users`, `worker` tables, auth, storage
- **Replit PostgreSQL**: `groups`, `group_members`, `group_messages` tables
  - Auto-created via `/api/groups/setup` on first group operation

## Unread Badge System
- Uses real `is_read` column from Supabase `messages` table
- `/api/unread-counts` aggregates unread counts per sender
- Badges shown on contact list items; total count in Messages header
- Counts refresh on conversation open (after marking read) and every 30s

## Group Chat System
- Groups stored in Replit PostgreSQL (not Supabase, due to FK constraints)
- Group messages stored in `group_messages` table with sender_name for display
- Groups tab in ConversationListPanel shows "Create New Group" button
- CreateGroupModal: name the group, search/select contacts, create
- Group messages poll every 5s for updates (no real-time subscription)

## Responsive Design
- **Desktop (lg+)**: Full 3-column layout — sidebar | contacts | chat | details
- **Tablet (md-lg)**: Sidebar + contacts + chat (details hidden, accessible via button)
- **Mobile (<md)**: Bottom nav, full-screen views toggled via `mobileView` state
- Breakpoints: `md` (768px) for sidebar/contact list, `lg` (1024px) for contact details

## Attachment System
- Attachments stored as `{fileUrl, fileName, fileSize, fileType}` objects in Supabase
- Upload via Supabase Storage bucket `message-files` with 7-day signed URLs
- Supports images (inline preview), PDFs (file card), and documents

## AI / FAQ System
- Auto-reply: uses `/api/auto-reply` with Grok + FAQ content as system context
- Manual suggestions: sparkles button in input, uses `/api/generate-reply` with FAQ
- FAQ content: hardcoded in `src/lib/faqContent.ts`

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
- `DATABASE_URL` — Replit PostgreSQL connection string (auto-provided)

## Replit Notes
- Dev/start scripts bind to `0.0.0.0:5000` for Replit preview pane compatibility
- Workflow: "Start application" runs `npm run dev`
- Tailwind CSS v4 uses `@import "tailwindcss" source(none)` with `@source` directives
- `pg` package used for Replit PostgreSQL access (groups feature)
