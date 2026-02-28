# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Rules

- **No `as` type assertions in components.** Use explicit type annotations (e.g., `const data: MyType = ...`) instead of `as` casts. Enforced by ESLint in `src/components/`. Page/API files may still use `as` for Supabase joined-query types until the type system is improved.
- **Dynamic imports — use `dynamic()` only when justified.** Apply `next/dynamic` for: (1) components with heavy third-party deps like maps (leaflet), date pickers (react-day-picker), confetti (canvas-confetti); (2) components behind user interaction (modals, drawers, dropdowns that may never open); (3) components requiring `ssr: false` (browser-only APIs like leaflet, canvas). Do NOT dynamically import: critical above-fold layout components (navbar, footer), lightweight components (<100 lines, no heavy deps), or components that always render on page load.
- **Import ordering.** ESLint enforces strict alphabetical imports with group separation (builtin > external > internal > parent > sibling > index), with newlines between groups. Use inline type imports: `import { type X }` (not `import type { X }`).
- **Prettier.** Print width is 100 (not default 80). Double quotes, semicolons, trailing commas everywhere.

## Branch Workflow

Before making any code changes, check the current branch. If on `main`, create a new descriptive branch based on the task:

```bash
git checkout -b <type>/<short-description>
```

Use these prefixes: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`. Keep the description short and kebab-cased (e.g., `feat/explore-dropdown`, `fix/dashboard-auth-guard`). Do NOT commit directly to `main`.

Pre-commit hook (`husky` + `lint-staged`) automatically runs Prettier and ESLint on staged `.ts`/`.tsx` files.

## Commands

```bash
pnpm dev             # Start dev server (Next.js, port 3001)
pnpm build           # Production build
pnpm lint            # ESLint
pnpm typecheck       # TypeScript type checking (tsc --noEmit)
pnpm format          # Prettier — format all files
pnpm format:check    # Prettier — check formatting (CI enforces this)
pnpm seed            # Seed DB with test accounts, events, guides (requires SUPABASE_SERVICE_ROLE_KEY)
pnpm unseed          # Remove seeded data
pnpm seed:cms        # Seed Payload CMS with sample pages
pnpm test:e2e        # Run Playwright E2E tests (e2e/ dir, chromium only)
```

**Package manager is strictly pnpm.** Every script runs a pre-check that exits with an error if invoked via `npm` or `yarn`.

CI pipeline order: `format:check` → `lint` → `typecheck` → `build`.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required for all functionality
- `RESEND_API_KEY` — for email sending (optional; emails are skipped with a warning if absent)
- `SUPABASE_SERVICE_ROLE_KEY` — only needed for `seed`/`unseed` scripts
- `ANTHROPIC_API_KEY` — for AI features
- `DATABASE_URI` and `PAYLOAD_SECRET` — for Payload CMS (Supabase session pooler connection string)
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

Database types are hand-maintained in `src/lib/supabase/types.ts` (not auto-generated). Key tables: `users`, `organizer_profiles`, `events`, `event_photos`, `bookings`, `badges`, `user_badges`, `event_checkins`, `event_reviews`, `guides`, `event_guides`, `guide_reviews`. Enum-like columns use strict union types (e.g., `'pending' | 'confirmed' | 'cancelled'`), not `string`.

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
- Collections: `payload-admins`, `Pages`, `Media`. Globals: `SiteSettings`, `Navigation`, `HeroCarousel`
- Rich text via Lexical editor
- ESLint ignores the auto-generated `src/app/(payload)/admin/importMap.js`
- `next.config.mjs` skips ESLint during build (`ignoreDuringBuilds: true`) to avoid errors on Payload-generated files — CI runs lint separately

### Path Aliases

- `@/*` → `./src/*`
- `@payload-config` → `./src/payload.config.ts`

### Icons

All SVG icons live in `src/components/icons/` with a barrel export from `index.ts`. Never inline SVGs — import from this folder. Create new icon components when needed. Navigation icons (Home, Explore, Calendar, Dashboard, Profile, Login) support `variant?: "outline" | "filled"`.

### Styling

Tailwind CSS with a custom theme (`tailwind.config.ts`):

- Custom color palettes: `teal`, `forest`, `golden` (each with 50–900 scale)
- Custom fonts: `font-sans` (Inter) and `font-heading` (Plus Jakarta Sans) via CSS variables
- Custom animations: `fadeUp`, `shimmer`, `borderPulse`
- Dark mode supported via `class` strategy

Use the `cn()` helper from `@/lib/utils` (combines `clsx` + `tailwind-merge`) for conditional class merging.

### Email

`src/lib/email/send.ts` provides `sendEmail()` via Resend. If `RESEND_API_KEY` is unset, emails are silently skipped (logged as warning). Templates live in `src/lib/email/templates/`.

### Images

`next/image` is configured to allow images from `*.supabase.co` (storage) and `images.unsplash.com`. Formats optimized to `avif` and `webp`. Storage and media paths get 1-year immutable cache headers via rewrites in `next.config.mjs`.
