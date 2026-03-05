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
pnpm seed:cms        # Seed CMS tables in Supabase (requires SUPABASE_SERVICE_ROLE_KEY)
pnpm test            # Run Vitest unit tests
pnpm test:e2e        # Run Playwright E2E tests (e2e/ dir, chromium only)
```

**Package manager is strictly pnpm.** Every script runs a pre-check that exits with an error if invoked via `npm` or `yarn`.

CI pipeline order: `format:check` → `lint` → `typecheck` → `test` → `build`. E2E runs only on push to main.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required for all functionality
- `RESEND_API_KEY` — for email sending (optional; emails are skipped with a warning if absent)
- `SUPABASE_SERVICE_ROLE_KEY` — only needed for `seed`/`unseed` scripts
- `ANTHROPIC_API_KEY` — for AI features
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXT_PUBLIC_STRAVA_CLIENT_ID` — for Strava integration
- `STRAVA_WEBHOOK_VERIFY_TOKEN` — random string for Strava webhook validation
- Confluence vars — only needed for `docs:sync`

## Architecture

**EventTara** is a Philippine outdoor adventure event booking platform (hiking, MTB, road biking, running, trail running) built on **Next.js 15.5.12 (App Router)** + **React 19** + **Supabase** as the full backend.

### Route Groups

The app uses Next.js route groups with a nested structure:

- `(frontend)` — parent route group containing all user-facing pages:
  - `(auth)` — `/login`, `/signup`, `/guest-setup` with a shared centered layout
  - `(participant)` — `/events`, `/events/[id]`, `/events/[id]/book`, `/my-events`, `/profile/[username]`, `/guides/[id]`, `/about`
  - `(organizer)` — `/dashboard` and nested pages (`/events`, `/events/new`, `/events/[id]`, `/events/[id]/edit`, `/events/[id]/checkin`, `/settings`)

SEO files (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`) remain at the `src/app/` root level.

Auth callback at `/auth/callback/route.ts` handles the OAuth code exchange with Supabase.

### Data Layer

All database access goes through Supabase. Two clients exist:

- **`@/lib/supabase/client`** — browser client (used in `"use client"` components)
- **`@/lib/supabase/server`** — server client (used in Server Components, API routes, layouts)

The `src/middleware.ts` runs `updateSession` on every request (excluding static assets) to keep the Supabase session cookie refreshed.

Database types are hand-maintained in `src/lib/supabase/types.ts` (not auto-generated). Key tables: `users`, `organizer_profiles`, `events`, `event_photos`, `bookings`, `badges`, `user_badges`, `event_checkins`, `event_reviews`, `guides`, `event_guides`, `guide_reviews`, plus CMS tables (`cms_site_settings`, `cms_navigation`, `cms_hero_carousel`, `cms_feature_flags`, `cms_pages`). Enum-like columns use strict union types (e.g., `'pending' | 'confirmed' | 'cancelled'`), not `string`.

### User Roles

Three roles: `organizer`, `participant`, `guest` (anonymous via Supabase `signInAnonymously`). Guests go through `/guest-setup` after sign-in. When a user first creates an event via `POST /api/events`, an `organizer_profiles` row is auto-created and their `users.role` is updated to `organizer`.

### API Routes

Thin wrappers in `src/app/api/` that authenticate via `createClient()` server-side, then call Supabase directly:

- `GET/POST /api/events` — list/create events (GET supports pagination, filters)
- `GET/PATCH/DELETE /api/events/[id]` — manage single event
- `GET/POST/DELETE /api/events/[id]/guides` — event-guide linking (hiking events)
- `GET /api/guides` — list guides (supports availability check via `check_date` param)
- `GET /api/guides/[id]` — single guide with events, reviews, and stats
- `GET/POST /api/guides/[id]/reviews` — guide reviews (POST validates booking + completed event)
- `POST /api/bookings` — book an event
- `POST /api/checkins` — record a check-in (QR or manual)
- `GET/POST /api/badges` — badge management
- `POST /api/badges/award` — award badge to participants (triggers email via Resend)
- `GET /api/strava/status` — check Strava connection status
- `DELETE /api/strava/disconnect` — remove Strava connection
- `GET /api/strava/activities` — fetch recent Strava activities
- `POST /api/strava/activities/link` — link Strava activity to booking
- `DELETE /api/strava/activities/[id]/unlink` — unlink activity
- `GET/POST/DELETE /api/events/[id]/route-data` — event route management (Strava URL or GPX)
- `GET/POST /api/webhooks/strava` — Strava webhook (validation + activity events)
- `POST /api/chat` — AI chat assistant (Coco) powered by Anthropic Claude
- `GET /api/feed` — activity feed with comments, @mentions, likes
- `GET/POST /api/waitlist` — organizer waitlist signup + count
- `GET/POST /api/notifications` — user notifications
- `GET/POST /api/reactions` — comment reactions/likes
- `POST /api/follows` — follow/unfollow users

### Strava Integration

Full Strava integration for activity tracking, verification, and route sharing:

- **OAuth login:** "Continue with Strava" on login/signup, custom OAuth flow via `/auth/strava/callback`
- **Account linking:** Existing users connect Strava from profile/settings via `StravaConnectButton`
- **Activity verification:** Manual linking via `LinkActivityModal` + auto-matching via Strava webhook
- **Profile enrichment:** `StravaStatsBar` (distance, activities, elevation) + `StravaActivityFeed` on profile page
- **Route sharing:** Organizers attach routes via Strava URL or GPX upload, displayed with `RouteMap` (Leaflet)
- **Client helper:** `src/lib/strava/client.ts` provides `getStravaClient(userId)` with automatic token refresh
- **Constants/types:** `src/lib/strava/constants.ts` (URLs, scopes, type mapping), `src/lib/strava/types.ts`
- **Database tables:** `strava_connections`, `strava_activities`, `event_routes`, `strava_webhook_subscriptions`
- **Env vars:** `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXT_PUBLIC_STRAVA_CLIENT_ID`, `STRAVA_WEBHOOK_VERIFY_TOKEN`

### AI Chat Assistant (Coco)

Floating chat bubble on every page (`src/components/chat/`). Powered by Anthropic Claude via `POST /api/chat`. Search prompt in `src/lib/ai/search-prompt.ts`. The chat panel slides up from the bottom with `z-999` overlay.

### Testing

- **Unit tests** (Vitest 4): `src/lib/**/__tests__/*.test.ts`. Config at `vitest.config.mts`. Globals enabled (`describe`, `test`, `expect`, `vi` available without import).
- **E2E tests** (Playwright): `e2e/*.spec.ts`. Config at `playwright.config.ts`. Uses chromium only, port 3001.
- **CI**: GitHub Actions (`.github/workflows/ci.yml`). Unit tests on every PR + push. E2E only on push to main with Supabase secrets.

### State Management

Redux Toolkit is set up in `src/lib/store/` with a `StoreProvider` wrapping the app in the root layout. The store currently has no slices — they are added as features require client-side state.

### Content Management (Supabase CMS)

CMS content is stored in Supabase tables (managed via Supabase dashboard):

- **`cms_site_settings`** — site name, tagline, SEO metadata, nav layout, parallax image
- **`cms_navigation`** — header links (JSONB), footer tagline/sections/legal links (JSONB)
- **`cms_hero_carousel`** — hero slides (JSONB array of `{url, alt}`)
- **`cms_feature_flags`** — boolean toggles (e.g., activity feed)
- **`cms_pages`** — dynamic pages (privacy policy, data deletion) with HTML content

All singletons use `CHECK (id = 1)`. Public read via RLS. Cached queries in `src/lib/cms/cached.ts` use `unstable_cache` with staggered revalidation (30s–300s). Types in `src/lib/cms/types.ts`.

### Path Aliases

- `@/*` → `./src/*`

### Icons

All SVG icons live in `src/components/icons/` with a barrel export from `index.ts`. Never inline SVGs — import from this folder. Create new icon components when needed. Navigation icons (Home, Explore, Calendar, Dashboard, Profile, Login) support `variant?: "outline" | "filled"`.

### Styling

Tailwind CSS with a custom theme (`tailwind.config.ts`):

- Custom color palettes: `teal`, `forest`, `golden` (each with 50–900 scale)
- Custom fonts: `font-sans` (Inter) and `font-heading` (Plus Jakarta Sans) via CSS variables
- Custom animations: `fadeUp`, `shimmer`, `borderPulse`
- Dark mode supported via `class` strategy

Use the `cn()` helper from `@/lib/utils` (combines `clsx` + `tailwind-merge`) for conditional class merging.

### Z-Index Stack

`Navbar/MobileNav (50)` < `ChatBubble (60)` < `EntryBanner (70)` < `WaitlistModal (80)` < `ChatPanel (999)` < `SplashScreen (100)`

### Email

`src/lib/email/send.ts` provides `sendEmail()` via Resend. If `RESEND_API_KEY` is unset, emails are silently skipped (logged as warning). Templates live in `src/lib/email/templates/`.

### Images

`next/image` is configured to allow images from `*.supabase.co` (storage) and `images.unsplash.com`. Formats optimized to `avif` and `webp`. Storage and media paths get 1-year immutable cache headers via rewrites in `next.config.mjs`.
