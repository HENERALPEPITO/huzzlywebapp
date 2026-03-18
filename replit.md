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
- `src/components/` — Reusable React components
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
