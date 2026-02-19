# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run lint         # ESLint via next lint
npm run seed         # Seed DB with test accounts and events (requires SUPABASE_SERVICE_ROLE_KEY)
npm run unseed       # Remove seeded data
npm run docs:sync    # Sync docs to Confluence (requires Confluence env vars)
```

There are no automated tests in this project.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required for all functionality
- `RESEND_API_KEY` — for email sending (optional; emails are skipped with a warning if absent)
- `SUPABASE_SERVICE_ROLE_KEY` — only needed for `seed`/`unseed` scripts
- `ANTHROPIC_API_KEY` — for AI features
- Confluence vars — only needed for `docs:sync`

## Architecture

**EventTara** is a Philippine outdoor adventure event booking platform (hiking, MTB, road biking, running, trail running) built on **Next.js 14 App Router** + **Supabase** as the full backend.

### Route Groups

The app uses three Next.js route groups to separate concerns:
- `(auth)` — `/login`, `/signup`, `/guest-setup` with a shared centered layout
- `(participant)` — `/events`, `/events/[id]`, `/events/[id]/book`, `/my-events`, `/profile/[username]`
- `(organizer)` — `/dashboard` and nested pages (`/events`, `/events/new`, `/events/[id]`, `/events/[id]/edit`, `/events/[id]/checkin`, `/settings`)

Auth callback at `/auth/callback/route.ts` handles the OAuth code exchange with Supabase.

### Data Layer

All database access goes through Supabase. Two clients exist:
- **`@/lib/supabase/client`** — browser client (used in `"use client"` components)
- **`@/lib/supabase/server`** — server client (used in Server Components, API routes, layouts)

The `src/middleware.ts` runs `updateSession` on every request (excluding static assets) to keep the Supabase session cookie refreshed.

Database types are hand-maintained in `src/lib/supabase/types.ts`. Key tables: `users`, `organizer_profiles`, `events`, `event_photos`, `bookings`, `badges`, `user_badges`, `event_checkins`.

### User Roles

Three roles: `organizer`, `participant`, `guest` (anonymous via Supabase `signInAnonymously`). Guests go through `/guest-setup` after sign-in. When a user first creates an event via `POST /api/events`, an `organizer_profiles` row is auto-created and their `users.role` is updated to `organizer`.

### API Routes

Thin wrappers in `src/app/api/` that authenticate via `createClient()` server-side, then call Supabase directly:
- `POST /api/events` — create event, auto-creating organizer profile if needed
- `GET/PATCH/DELETE /api/events/[id]`
- `POST /api/bookings` — book an event
- `POST /api/checkins` — record a check-in (QR or manual)
- `GET/POST /api/badges` — badge management
- `POST /api/badges/award` — award badge to participants (triggers email via Resend)

### State Management

Redux Toolkit is set up in `src/lib/store/` with a `StoreProvider` wrapping the app in the root layout. The store currently has no slices — they are added as features require client-side state.

### Styling

Tailwind CSS with a custom theme (`tailwind.config.ts`):
- Custom color palettes: `teal`, `forest`, `golden`
- Custom fonts: `font-sans` (Inter) and `font-heading` (Plus Jakarta Sans) via CSS variables

Use the `cn()` helper from `@/lib/utils` (combines `clsx` + `tailwind-merge`) for conditional class merging.

### Email

`src/lib/email/send.ts` provides `sendEmail()` via Resend. If `RESEND_API_KEY` is unset, emails are silently skipped (logged as warning). Templates live in `src/lib/email/templates/`.

### Images

`next/image` is configured to allow images from `*.supabase.co` (storage) and `images.unsplash.com`.
