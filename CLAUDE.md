# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Request Processing Protocol

**Every request — no exceptions — must be structured before acting.** Extract context from the user's message, ask clarifying questions one at a time until full context is established, then display a quick preview template and proceed.

### Template Fields

**All request types:**

| Field              | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| **Type**           | `bug` / `feature` / `refactor` / `style` / `chore` / `docs` |
| **Location**       | Route, component, or file path affected                     |
| **Scope**          | Single component, page-level, or cross-cutting              |
| **Priority files** | Files to read first (derived from location)                 |
| **Action plan**    | 2-3 bullet list of what will be done                        |

**Bug-specific fields (in addition to above):**

| Field                 | Description                                                          |
| --------------------- | -------------------------------------------------------------------- |
| **Current behavior**  | What is happening now                                                |
| **Expected behavior** | What it should do                                                    |
| **Visual context**    | If screenshot provided — jump straight to identifying relevant files |

**Feature-specific fields (in addition to above):**

| Field                   | Description                 |
| ----------------------- | --------------------------- |
| **Requirements**        | What the feature must do    |
| **Acceptance criteria** | How to verify it's complete |

**Refactor/style/chore/docs fields (in addition to base):**

| Field           | Description               |
| --------------- | ------------------------- |
| **Reason**      | Why this change is needed |
| **Constraints** | What must stay the same   |

### Rules

1. **Always structured.** Even trivial requests, follow-ups, and explanations get the template treatment.
2. **Ask until clear.** Ask clarifying questions one at a time until every relevant field can be confidently filled. Do not guess — ask.
3. **Preview before acting.** Print the filled template fields for the user to review before reading files or writing code.
4. **Scope starts narrow, expands with justification.** Begin with priority files. If the fix requires touching additional files, note why in the chat before expanding.
5. **Screenshots = fast path.** When an image is attached, identify the relevant files from the visual context immediately — no need to describe the image back.

## Code Rules

- **No `as` type assertions in components.** Use explicit type annotations (e.g., `const data: MyType = ...`) instead of `as` casts. Enforced by ESLint in `src/components/`. Page/API files may still use `as` for Supabase joined-query types until the type system is improved.
- **Dynamic imports — use `dynamic()` only when justified.** Apply `next/dynamic` for: (1) components with heavy third-party deps like maps (leaflet), date pickers (react-day-picker), confetti (canvas-confetti); (2) components behind user interaction (modals, drawers, dropdowns that may never open); (3) components requiring `ssr: false` (browser-only APIs like leaflet, canvas). Do NOT dynamically import: critical above-fold layout components (navbar, footer), lightweight components (<100 lines, no heavy deps), or components that always render on page load.
- **Import ordering.** ESLint enforces strict alphabetical imports with group separation (builtin > external > internal > parent > sibling > index), with newlines between groups. Use inline type imports: `import { type X }` (not `import type { X }`).
- **Prettier.** Print width is 100 (not default 80). Double quotes, semicolons, trailing commas everywhere.

## Branch Workflow

Feature branches → PRs target **`main`** directly. CI runs and Vercel deploys on approval.

Before making any code changes, check the current branch. If on `main`, create a new descriptive branch:

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

CI pipeline order: `format:check` → `lint` → `typecheck` → `test` → `build`. E2E runs on push to `main`.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required for all functionality
- `RESEND_API_KEY` — for email sending (optional; emails are skipped with a warning if absent)
- `SUPABASE_SERVICE_ROLE_KEY` — only needed for `seed`/`unseed` scripts
- `ANTHROPIC_API_KEY` — for AI features
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXT_PUBLIC_STRAVA_CLIENT_ID` — for Strava integration
- `STRAVA_WEBHOOK_VERIFY_TOKEN` — random string for Strava webhook validation

## Architecture

**EventTara** is a Philippine outdoor adventure event booking platform (hiking, MTB, road biking, running, trail running) built on **Next.js 15.5.12 (App Router)** + **React 19** + **Supabase** as the full backend.

### Route Groups

The app uses Next.js route groups with a nested structure:

- `(frontend)` — parent route group containing all user-facing pages:
  - `(auth)` — `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/guest-setup`, `/setup-username`
  - `(participant)` — public-facing pages:
    - `/events`, `/events/[id]`, `/events/[id]/book`
    - `/clubs`, `/clubs/new`, `/clubs/[slug]`, `/clubs/join/[code]`
    - `/achievements`, `/badges/[id]`
    - `/feed`, `/post/[id]`, `/notifications`
    - `/profile`, `/profile/[username]`
    - `/guides/[id]`, `/about`, `/contact`
  - `(organizer)` — `/dashboard` with club-scoped management:
    - `/dashboard` (overview)
    - `/dashboard/clubs/[slug]` (club dashboard, events, members, invites, settings)
    - `/dashboard/events` (legacy all-events view)
    - `/dashboard/settings`
- `(admin)` — admin panel at `/admin` with sub-pages: `/admin/clubs`, `/admin/feature-flags`, `/admin/hero`, `/admin/sections`
- `/claim/[token]` — club claim page for ownership transfer

SEO files (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`) remain at the `src/app/` root level.

Auth callbacks at `/auth/callback/route.ts` (Supabase OAuth) and `/auth/strava/callback/route.ts` (Strava OAuth).

### Data Layer

All database access goes through Supabase. Two clients exist:

- **`@/lib/supabase/client`** — browser client (used in `"use client"` components)
- **`@/lib/supabase/server`** — server client (used in Server Components, API routes, layouts)

The `src/middleware.ts` runs `updateSession` on every request (excluding static assets) to keep the Supabase session cookie refreshed.

Database types are hand-maintained in `src/lib/supabase/types.ts` (not auto-generated). Key tables:

- **Users:** `users`
- **Clubs:** `clubs`, `club_members`, `club_invites`, `club_reviews`, `club_review_photos`
- **Events:** `events` (has `club_id` FK), `event_photos`, `event_checkins`, `event_reviews`, `event_guides`, `event_routes`, `event_distances`, `event_mountains`, `mountains`
- **Bookings:** `bookings`, `booking_companions`
- **Badges & Gamification:** `badges`, `user_badges`, `badge_shares`, `user_badge_showcase`, `avatar_borders`, `user_avatar_borders`
- **Social Feed:** `user_follows`, `feed_reactions`, `feed_comments`, `feed_comment_likes`, `feed_reposts`
- **Notifications:** `notifications`, `push_subscriptions`
- **Strava:** `strava_connections`, `strava_activities`, `strava_webhook_subscriptions`
- **CMS:** `cms_site_settings`, `cms_navigation`, `cms_hero_carousel`, `cms_feature_flags`, `cms_pages`, `cms_homepage_sections`
- **Other:** `guides`, `guide_reviews`, `quiz_responses`, `chat_queries`, `app_testimonials`, `organizer_waitlist`

Enum-like columns use strict union types (e.g., `'pending' | 'confirmed' | 'cancelled'`), not `string`.

### User Roles

Four roles: `user`, `participant`, `organizer`, `guest` (anonymous via Supabase `signInAnonymously`). Guests go through `/guest-setup` after sign-in. Events are managed through clubs — when a user creates a club, they become its owner.

**Club roles** (in `club_members`): `owner`, `admin`, `moderator`, `member`. Permissions logic in `src/lib/clubs/permissions.ts`.

### Clubs System

Clubs replaced the old organizer profiles. A club is the organizational unit that owns events.

- **Types & permissions:** `src/lib/clubs/types.ts`, `src/lib/clubs/permissions.ts`
- **Components:** `src/components/clubs/` — `ClubCard`, `ClubGrid`, `ClubProfileHeader`, `ClubRoleBadge`, `ClubSelector`, `CreateClubForm`, `JoinClubButton`, `JoinViaInviteButton`
- **Dashboard:** `src/components/dashboard/` — `ClubEventsTable`, `ClubMembersList`, `ClubInvitesList`, `ClubSettingsForm`, `ClubSwitcher`
- **Claim flow:** Admin generates claim tokens → `/claim/[token]` page → user claims club ownership
- **Invite codes:** `/clubs/join/[code]` for joining via shareable invite links
- **Ownership transfer:** `/api/clubs/[slug]/transfer-ownership`

### API Routes

Thin wrappers in `src/app/api/` that authenticate via `createClient()` server-side, then call Supabase directly:

- **Events:** `GET/POST /api/events`, `GET/PATCH/DELETE /api/events/[id]`, `/api/events/[id]/guides`, `/api/events/[id]/reviews`, `/api/events/[id]/route-data`, `/api/events/[id]/participants`, `/api/events/[id]/payments`
- **Clubs:** `GET/POST /api/clubs`, `GET/PATCH/DELETE /api/clubs/[slug]`, `/api/clubs/[slug]/members`, `/api/clubs/[slug]/invites`, `/api/clubs/[slug]/reviews`, `/api/clubs/[slug]/transfer-ownership`
- **Bookings:** `POST /api/bookings`, `/api/bookings/[id]/verify`, `/api/bookings/[id]/participant`
- **Check-ins:** `POST /api/checkins`
- **Badges:** `GET/POST /api/badges`, `POST /api/badges/award`, `/api/badges/[id]/share`, `/api/badges/showcase`
- **Guides:** `GET /api/guides`, `GET /api/guides/[id]`, `/api/guides/[id]/reviews`
- **Feed:** `GET /api/feed`, `/api/feed/comments`, `/api/feed/reposts`, `/api/reactions`, `/api/follows`
- **Strava:** `/api/strava/status`, `/api/strava/disconnect`, `/api/strava/activities`, `/api/strava/activities/link`, `/api/strava/activities/[id]/unlink`, `/api/webhooks/strava`
- **Other:** `POST /api/chat`, `/api/notifications`, `/api/leaderboards`, `/api/quiz`, `/api/claim/[token]`, `/api/contact`, `/api/waitlist`
- **Admin:** `/api/admin/clubs`, `/api/admin/clubs/[id]/claim-token`, `/api/admin/feature-flags`, `/api/admin/hero-carousel`, `/api/admin/homepage-sections`

### Activity Feed

Social feed (`/feed`) showing user activity. Activity types: `booking`, `checkin`, `badge`, `border`, `review`. Supports likes (`feed_reactions`), comments (`feed_comments`), reposts (`feed_reposts`), and follows (`user_follows`). Individual posts viewable at `/post/[id]`.

### Gamification

- **Badges:** Earned via event participation, check-ins, and milestones. Shareable via `/api/badges/[id]/share`. Badge showcase on profiles via `user_badge_showcase`.
- **Avatar borders:** Earned via achievements. Users set active border via `/api/users/active-border`. Displayed on avatars throughout the app.
- **Leaderboards:** Rankings via `/api/leaderboards`. Displayed in `/achievements` page.
- **Onboarding quiz:** `OnboardingQuizModal` shown to anonymous visitors. Responses stored in `quiz_responses`.

### Strava Integration

Full Strava integration for activity tracking, verification, and route sharing:

- **OAuth login:** "Continue with Strava" on login/signup, custom OAuth flow via `/auth/strava/callback`
- **Account linking:** Existing users connect Strava from profile/settings via `StravaConnectButton`
- **Activity verification:** Manual linking via `LinkActivityModal` + auto-matching via Strava webhook
- **Profile enrichment:** `StravaStatsBar` (distance, activities, elevation) + `StravaActivityFeed` on profile page
- **Route sharing:** Organizers attach routes via Strava URL or GPX upload, displayed with `RouteMap` (Leaflet)
- **Client helper:** `src/lib/strava/client.ts` provides `getStravaClient(userId)` with automatic token refresh
- **Database tables:** `strava_connections`, `strava_activities`, `event_routes`, `strava_webhook_subscriptions`

### AI Chat Assistant (Coco)

Floating chat bubble on every page (`src/components/chat/`). Powered by Anthropic Claude via `POST /api/chat`. Search prompt in `src/lib/ai/search-prompt.ts`. The chat panel slides up from the bottom with `z-999` overlay.

### Testing

**Every new feature or bugfix must include tests.** Unit tests for business logic and utility functions; E2E tests for user-facing workflows.

#### Unit Tests (Vitest 4)

- **Location:** `src/lib/<module>/__tests__/<module>.test.ts` — colocated with the code they test.
- **Config:** `vitest.config.mts`. Globals enabled (`describe`, `test`, `expect`, `vi` available without import). Environment: `node`. Path alias `@/*` works.
- **What to test:** Pure functions, utility helpers, validation logic, constants, normalization logic. Extract testable logic from API routes into `src/lib/` when possible.
- **What NOT to unit test:** React components (use E2E instead), Supabase queries that just delegate to the client.

**Supabase mock pattern:**

```typescript
function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return { from: vi.fn().mockReturnValue(chainable), _chain: chainable } as any;
}
```

#### E2E Tests (Playwright)

- **Location:** `e2e/*.spec.ts`. Config at `playwright.config.ts`. Chromium only, port 3001.
- **Auth:** Setup in `e2e/auth.setup.ts` saves organizer + participant state to `e2e/.auth/`. Tests reuse via `storageState`.
- **Patterns:** Use `test.step()` for multi-step flows. Prefer accessible selectors (`getByRole`, `getByLabel`) over CSS. Timeouts at 10s for async UI.

#### CI

GitHub Actions (`.github/workflows/ci.yml`). Unit tests on every PR + push. E2E only on push to main/staging with Supabase secrets.

**Run before creating PRs:** `pnpm typecheck && pnpm lint && pnpm test`

### State Management

Redux Toolkit is set up in `src/lib/store/` with a `StoreProvider` wrapping the app in the root layout. The store currently has no slices — they are added as features require client-side state.

### Content Management (Supabase CMS)

CMS content is stored in Supabase tables (managed via Supabase dashboard):

- **`cms_site_settings`** — site name, tagline, SEO metadata, nav layout, parallax image
- **`cms_navigation`** — header links (JSONB), footer tagline/sections/legal links (JSONB)
- **`cms_hero_carousel`** — hero slides (JSONB array of `{url, alt}`)
- **`cms_feature_flags`** — boolean toggles (e.g., activity feed, onboarding quiz)
- **`cms_pages`** — dynamic pages (privacy policy, data deletion) with HTML content
- **`cms_homepage_sections`** — configurable homepage content sections

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

`Navbar/MobileNav (50)` < `ChatBubble (60)` < `EntryBanner (70)` < `WaitlistModal (80)` < `ChatPanel (999)`

### Email

`src/lib/email/send.ts` provides `sendEmail()` via Resend. If `RESEND_API_KEY` is unset, emails are silently skipped (logged as warning). Templates live in `src/lib/email/templates/`.

### Images

`next/image` is configured to allow images from `*.supabase.co` (storage) and `images.unsplash.com`. Formats optimized to `avif` and `webp`. Storage and media paths get 1-year immutable cache headers via rewrites in `next.config.mjs`.
