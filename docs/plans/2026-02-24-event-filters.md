# Event Filters Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace multi-row filter layout with Airbnb-style chip bar. Add organizer, guide, date range filters. Add skeleton loading.

**Architecture:** Each filter is a chip button with a popover. New filters flow through URL params. Server Component fetches dropdown option lists. Existing `SkeletonEventCard` shown during transitions.

**Tech Stack:** React 19, Next.js 15 App Router, Supabase, Tailwind CSS

---

### Task 1: Add org/guide/from/to support to API route

**Files:** Modify `src/app/(frontend)/api/events/route.ts`

- Parse new query params: `org`, `guide`, `from`, `to`
- `org` → `.eq("organizer_id", org)` on both count + data queries
- `from` → `.gte("date", from)`, `to` → `.lte("date", to + "T23:59:59")`
- `guide` → fetch event IDs from `event_guides` where `guide_id` matches, then `.in("id", eventIds)`. Return empty if no linked events.
- Guide filter block must come before the `Promise.all` that executes queries
- Commit: `feat: support org, guide, from, to filter params in events API`

---

### Task 2: Add org/guide/date support to Server Component

**Files:** Modify `src/app/(frontend)/(participant)/events/page.tsx`

- Expand `searchParams` type to include `org`, `guide`, `from`, `to`
- Apply same filter logic as Task 1 to the page's count + data queries
- Fetch organizer options: `organizer_profiles` with `events!inner` join, filter by `events.status = published`, dedupe
- Fetch guide options: `event_guides` with `guides!inner` + `events!inner` join, filter by `events.status = published` + `events.type = hiking`, dedupe
- Pass `organizers` and `guides` arrays as props to EventFilters
- Commit: `feat: add org/guide/date filters and dropdown data to events page`

---

### Task 3: Rewrite EventFilters as chip bar with popovers

**Files:** Rewrite `src/components/events/EventFilters.tsx`

This is the largest task. Full rewrite of the component.

**FilterChip sub-component:**

- Button with chevron icon, opens a popover positioned below
- Active state: dark fill with selected value as label. Inactive: gray outline
- Click-outside closes popover via `mousedown` listener
- Only one popover open at a time (`openId` state)

**Main component:**

- Props: `organizers`, `guides`, `onPendingChange` callback
- Same URL param management pattern (`useTransition` + `router.push`)
- Search bar with 400ms debounce (preserve existing behavior)
- Chip bar: Type | When | Date | Organizer | Guide — horizontal scroll on mobile
- Each popover: radio list + Clear/Apply buttons (Date uses two `<input type="date">`)
- Mutual exclusion: selecting When clears from/to, selecting date clears when
- Guide chip only visible when `type=hiking`; switching type clears guide param
- Call `onPendingChange(isPending)` via useEffect

- Commit: `feat: rewrite EventFilters as Airbnb-style chip bar with popovers`

---

### Task 4: Add skeleton loading to EventsListClient

**Files:** Modify `src/components/events/EventsListClient.tsx`

- Accept `isFiltering` prop
- When `isFiltering` is true, render 6x `SkeletonEventCard` grid instead of events
- Update `buildApiUrl` to include `org`, `guide`, `from`, `to` from searchParams
- Commit: `feat: add skeleton loading and new filter params to EventsListClient`

---

### Task 5: Wire up pending state between filters and list

**Files:** Create `src/components/events/EventsPageClient.tsx`, modify `src/app/(frontend)/(participant)/events/page.tsx`

- Create thin client wrapper `EventsPageClient` that holds `isFiltering` state
- Passes `onPendingChange={setIsFiltering}` to EventFilters
- Passes `isFiltering` to EventsListClient
- Update page.tsx to render `EventsPageClient` instead of separate components
- Commit: `feat: wire pending state between filters and event list with skeletons`

---

### Task 6: Final polish and build verification

- `npm run build` — exit 0, no type errors
- `npm run lint` — no new errors
- Manual test: all 5 popovers, click-outside close, active chip labels, guide visibility toggle, when/date mutual exclusion, skeleton cards, pagination with new params, search debounce, mobile scroll, clear buttons, URL param correctness
- Commit any fixes: `fix: polish event filters chip bar`
