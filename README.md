# Claim Copilot (MVP)

Claim Copilot is a focused web app for documenting residential property insurance claims (water leak/flood).

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Auth, Postgres, Storage)
- Tailwind CSS
- PDF generation with `pdf-lib` in a route handler

## Features in this MVP

- Auth (email/password via Supabase)
- Claims CRUD (create/list/view)
- Areas CRUD (create/list)
- Damage items CRUD (create/list per area)
- Evidence upload to Supabase Storage + image rendering
- Insurer request parsing (heuristic line/bullet splitter)
- Tasks auto-generated from insurer asks
- Claim Packet PDF export including:
  - Claim details
  - Damage inventory table
  - Photo appendix with captions

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in `.env.local` with your Supabase project values.
4. Run SQL migration in Supabase SQL editor:
   - `supabase/migrations/001_init.sql`
5. In Supabase Auth settings, configure site URL for local dev (`http://localhost:3000`).
6. Start the app:
   ```bash
   npm run dev
   ```

## Routes

- `/` dashboard + create claim
- `/claims/[id]` claim overview
- `/claims/[id]/areas` area list + create area
- `/claims/[id]/areas/[areaId]` damage items + evidence upload
- `/claims/[id]/requests` insurer requests + parser + tasks
- `/claims/[id]/export` claim packet export entry
- `/claims/[id]/export/pdf` PDF download endpoint

## Deployment notes

- Deploy on Vercel or similar Node-compatible hosting.
- Add environment variables in hosting dashboard.
- Ensure Supabase Auth redirect URLs include production domain and `/auth/callback`.
- Run migration SQL against production Supabase project before first use.

## MVP constraints

This app does **not** provide coverage decisions, legal advice, contractor matching, payments, or native mobile apps.
