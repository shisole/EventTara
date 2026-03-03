# Breadcrumbs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add breadcrumbs to every page showing the navigation path from Home.

**Architecture:** Central route config maps URL patterns to breadcrumb segments. A `<Breadcrumbs>` client component in ClientShell resolves the current path. Dynamic titles (event names, etc.) are passed from server pages via `BreadcrumbContext`.

**Tech Stack:** React Context, Next.js `usePathname()`, existing `ChevronRightIcon`

**Design doc:** `docs/plans/2026-03-03-breadcrumbs-design.md`

---

### Task 1: Create BreadcrumbContext

**Files:**

- Create: `src/lib/contexts/BreadcrumbContext.tsx`

Create a React context with `{ title: string | null, setTitle }`. Export `BreadcrumbProvider`, `useBreadcrumbTitle()` hook, and a `BreadcrumbTitle` client component that calls `setTitle` via `useEffect` (resets to null on unmount). The provider should reset title to null on pathname change.

**Commit:** `feat(breadcrumbs): add BreadcrumbContext for dynamic titles`

---

### Task 2: Create breadcrumb route config

**Files:**

- Create: `src/lib/constants/breadcrumb-routes.ts`

Define a `BREADCRUMB_ROUTES` array where each entry has a `pattern` (regex or path template like `/events/:id/book`), a `segments` array of `{ label, href }` objects. Dynamic segments use `:id` or `:username` placeholders resolved at runtime. The last segment with a dynamic title uses `{ label: null }` to signal "use context title". Include a `fallbackLabel` for when context hasn't loaded (e.g., "Event", "Guide").

Full route table from design doc. Hidden on `/`.

**Commit:** `feat(breadcrumbs): add route config map`

---

### Task 3: Create Breadcrumbs component

**Files:**

- Create: `src/components/ui/Breadcrumbs.tsx`
- Modify: `src/components/ui/index.ts` — add barrel export

Client component. Uses `usePathname()` to match against `BREADCRUMB_ROUTES`. Reads dynamic title from `useBreadcrumbTitle()`. Renders segments with `Link` for parents, plain text for current page. `ChevronRightIcon` separators. Styling per design doc (`text-sm`, muted gray, hover underline on links). Truncate long titles with `truncate` class. Returns null on `/` (home page).

**Commit:** `feat(breadcrumbs): add Breadcrumbs UI component`

---

### Task 4: Mount in ClientShell + wrap with BreadcrumbProvider

**Files:**

- Modify: `src/components/layout/ClientShell.tsx:212-236` — add `BreadcrumbProvider` wrapper and `<Breadcrumbs />` below Navbar

Wrap the main content area with `BreadcrumbProvider`. Render `<Breadcrumbs />` inside the content div, above `{children}`. Add horizontal padding to match page content alignment (`px-4 md:px-8`). Hide on auth pages (login/signup/guest-setup) if the centered auth layout looks better without them — check visually.

**Commit:** `feat(breadcrumbs): mount in ClientShell`

---

### Task 5: Add BreadcrumbTitle to participant dynamic pages

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx` — add `<BreadcrumbTitle title={event.title} />`
- Modify: `src/app/(frontend)/(participant)/events/[id]/book/page.tsx` — add `<BreadcrumbTitle title={event.title} />`
- Modify: `src/app/(frontend)/(participant)/guides/[id]/page.tsx` — add `<BreadcrumbTitle title={guide.full_name} />`
- Modify: `src/app/(frontend)/(participant)/badges/[id]/page.tsx` — add `<BreadcrumbTitle title={badge.title} />`
- Modify: `src/app/(frontend)/(participant)/profile/[username]/page.tsx` — add `<BreadcrumbTitle title={user.full_name} />`
- Modify: `src/app/(frontend)/(participant)/organizers/[id]/page.tsx` — add `<BreadcrumbTitle title={profile.org_name} />`

These are server components — `BreadcrumbTitle` is a client component imported into them. Each page already has the title variable from its Supabase query.

**Commit:** `feat(breadcrumbs): add dynamic titles to participant pages`

---

### Task 6: Add BreadcrumbTitle to dashboard dynamic pages

**Files:**

- Modify: `src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx` — add `<BreadcrumbTitle title={event.title} />`
- Modify: `src/app/(frontend)/(organizer)/dashboard/events/[id]/edit/page.tsx` — add `<BreadcrumbTitle title={event.title} />`
- Modify: `src/app/(frontend)/(organizer)/dashboard/events/[id]/checkin/page.tsx` — add `<BreadcrumbTitle title={event.title} />`

**Commit:** `feat(breadcrumbs): add dynamic titles to dashboard pages`

---

### Task 7: Verify and adjust layout

**Steps:**

1. Run `pnpm typecheck` — fix any type errors
2. Run `pnpm lint` — fix any lint issues
3. Run `pnpm build` — ensure production build passes
4. Manual verification:
   - Check breadcrumbs on static pages (`/events`, `/my-events`, `/dashboard`, `/dashboard/events`)
   - Check dynamic pages (event detail, guide detail, profile)
   - Check nested flows (event > book, dashboard > events > event > edit)
   - Check dark mode rendering
   - Check mobile viewport (truncation)
   - Check dashboard layout (breadcrumb right of sidebar)
   - Verify no breadcrumb on home page

**Commit:** `fix(breadcrumbs): layout adjustments from visual review`

---

### Task 8: Remove back links replaced by breadcrumbs

**Files:**

- Modify: `src/app/(frontend)/(organizer)/dashboard/events/new/page.tsx` — remove "Back to Events" link (breadcrumb covers this)

Check other pages for similar back-link patterns that breadcrumbs now replace. Only remove if the breadcrumb fully replaces the navigation need.

**Commit:** `refactor(breadcrumbs): remove redundant back links`
