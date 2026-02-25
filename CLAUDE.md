# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branch Workflow

Before making any code changes, check the current branch. If on `main`, create a new descriptive branch based on the task:

```bash
git checkout -b <type>/<short-description>
```

Use these prefixes: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`. Keep the description short and kebab-cased (e.g., `feat/explore-dropdown`, `fix/dashboard-auth-guard`). Do NOT commit directly to `main`.

## Commands

```bash
npm run dev          # Start dev server (Next.js, port 3001)
npm run build        # Production build
npm run lint         # ESLint via next lint
npm run seed         # Seed DB with test accounts, events, guides (requires SUPABASE_SERVICE_ROLE_KEY)
npm run unseed       # Remove seeded data
npm run seed:cms     # Seed Payload CMS with sample pages
npm run test:e2e     # Run Playwright E2E tests
```

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required for all functionality
- `RESEND_API_KEY` — for email sending (optional; emails are skipped with a warning if absent)
- `SUPABASE_SERVICE_ROLE_KEY` — only needed for `seed`/`unseed` scripts
- `ANTHROPIC_API_KEY` — for AI features
- Confluence vars — only needed for `docs:sync`

## Architecture

**EventTara** is a Philippine outdoor adventure event booking platform (hiking, MTB, road biking, running, trail running) built on **Next.js 15.5.12 (App Router)** + **React 19** + **Supabase** as the full backend. **Payload CMS** is integrated for content management.

### Route Groups

The app uses Next.js route groups with a nested structure:

- `(frontend)` — parent route group containing all user-facing pages:
  - `(auth)` — `/login`, `/signup`, `/guest-setup` with a shared centered layout
  - `(participant)` — `/events`, `/events/[id]`, `/events/[id]/book`, `/my-events`, `/profile/[username]`, `/guides/[id]`
  - `(organizer)` — `/dashboard` and nested pages (`/events`, `/events/new`, `/events/[id]`, `/events/[id]/edit`, `/events/[id]/checkin`, `/guides`, `/guides/new`, `/guides/[id]`, `/settings`)
- `(payload)` — Payload CMS admin interface (accessed at `/admin`)

SEO files (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`) remain at the `src/app/` root level.

Auth callback at `/auth/callback/route.ts` handles the OAuth code exchange with Supabase.

### Data Layer

All database access goes through Supabase. Two clients exist:

- **`@/lib/supabase/client`** — browser client (used in `"use client"` components)
- **`@/lib/supabase/server`** — server client (used in Server Components, API routes, layouts)

The `src/middleware.ts` runs `updateSession` on every request (excluding static assets and `/admin` for Payload CMS) to keep the Supabase session cookie refreshed.

Database types are hand-maintained in `src/lib/supabase/types.ts`. Key tables: `users`, `organizer_profiles`, `events`, `event_photos`, `bookings`, `badges`, `user_badges`, `event_checkins`, `event_reviews`, `guides`, `event_guides`, `guide_reviews`.

### User Roles

Three roles: `organizer`, `participant`, `guest` (anonymous via Supabase `signInAnonymously`). Guests go through `/guest-setup` after sign-in. When a user first creates an event via `POST /api/events`, an `organizer_profiles` row is auto-created and their `users.role` is updated to `organizer`.

### API Routes

Thin wrappers in `src/app/api/` that authenticate via `createClient()` server-side, then call Supabase directly:

- `GET/POST /api/events` — list/create events (GET supports pagination, filters)
- `GET/PATCH/DELETE /api/events/[id]` — manage single event
- `GET/POST/DELETE /api/events/[id]/guides` — event-guide linking (hiking events)
- `GET/POST /api/guides` — list/create guides (GET supports `created_by` filter)
- `GET/PATCH/DELETE /api/guides/[id]` — manage single guide
- `GET/POST /api/guides/[id]/reviews` — guide reviews (POST validates booking + completed event)
- `POST /api/bookings` — book an event
- `POST /api/checkins` — record a check-in (QR or manual)
- `GET/POST /api/badges` — badge management
- `POST /api/badges/award` — award badge to participants (triggers email via Resend)

### State Management

Redux Toolkit is set up in `src/lib/store/` with a `StoreProvider` wrapping the app in the root layout. The store currently has no slices — they are added as features require client-side state.

### Content Management (Payload CMS)

Payload CMS v3 is integrated for headless content management:

- Admin interface accessible at `/admin`
- Uses the same Supabase Postgres database with `schemaName: 'payload'` for schema isolation
- Admin users stored in `payload-admins` collection (separate from Supabase `users` table)
- Configuration in `src/payload.config.ts`
- Content types: pages, posts, media, etc.
- GraphQL and REST APIs auto-generated at `/api/graphql` and `/api/*`

### Icons

All SVG icons live in `src/components/icons/` with a barrel export from `index.ts`. Never inline SVGs — import from this folder. Create new icon components when needed. Navigation icons (Home, Explore, Calendar, Dashboard, Profile, Login) support `variant?: "outline" | "filled"`.

### Styling

Tailwind CSS with a custom theme (`tailwind.config.ts`):

- Custom color palettes: `teal`, `forest`, `golden`
- Custom fonts: `font-sans` (Inter) and `font-heading` (Plus Jakarta Sans) via CSS variables

Use the `cn()` helper from `@/lib/utils` (combines `clsx` + `tailwind-merge`) for conditional class merging.

### Email

`src/lib/email/send.ts` provides `sendEmail()` via Resend. If `RESEND_API_KEY` is unset, emails are silently skipped (logged as warning). Templates live in `src/lib/email/templates/`.

### Images

`next/image` is configured to allow images from `*.supabase.co` (storage) and `images.unsplash.com`.
