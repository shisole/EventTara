# Bento Events Carousel — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the homepage UpcomingEventsSection with a tabbed bento carousel that shows events by category (Featured, Upcoming, Hiking, MTB, Road Biking, Running, Trail Running) in a bento grid layout with swipe/arrow navigation.

**Architecture:** Server component fetches initial "Featured" tab data. Client component handles tab switching, lazy-fetches per tab on first click, and renders a swipeable bento grid (1 large + 4 small cards per page). Uses existing `/api/events` endpoint with `type` and `when` params, plus a new `featured=true` param.

**Tech Stack:** Next.js Server + Client Components, Supabase, existing EventCardData type, CSS grid, touch events for swipe.

---

### Task 1: Add `is_featured` to events table types

**Files:**

- Modify: `src/lib/supabase/types.ts:72-125`

**Step 1: Add `is_featured` to Row, Insert, and Update types**

In the `events` table type at `src/lib/supabase/types.ts`:

- Row: add `is_featured: boolean;` after `difficulty_level`
- Insert: add `is_featured?: boolean;` after `difficulty_level`
- Update: add `is_featured?: boolean;` after `difficulty_level`

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS (no existing code references `is_featured` yet)

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add is_featured field to events table type"
```

---

### Task 2: Add `featured` filter to events API

**Files:**

- Modify: `src/app/(frontend)/api/events/route.ts`

**Step 1: Add `featured` search param handling**

In the GET handler, after existing param parsing, add:

```ts
const featured = searchParams.get("featured");
```

Before the final query execution, add a filter:

```ts
if (featured === "true") {
  query = query.eq("is_featured", true);
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/events/route.ts
git commit -m "feat: add featured filter to events API"
```

---

### Task 3: Add `is_featured` to EventCardData and mapEventToCard

**Files:**

- Modify: `src/components/events/EventCard.tsx` (EventCardData interface)
- Modify: `src/lib/events/map-event-card.ts` (mapEventToCard function)

**Step 1: Add `is_featured` to EventCardData**

In EventCard.tsx, add to the interface:

```ts
is_featured?: boolean;
```

**Step 2: Map the field in mapEventToCard**

In `map-event-card.ts`, add to the return object:

```ts
is_featured: event.is_featured ?? false,
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/events/EventCard.tsx src/lib/events/map-event-card.ts
git commit -m "feat: add is_featured to EventCardData and mapper"
```

---

### Task 4: Create BentoEventCard component

**Files:**

- Create: `src/components/landing/BentoEventCard.tsx`

**Description:**

A card component that renders in two variants: `large` (spans 2 rows, taller image) and `small` (standard size). Reuses EventCardData props. Both variants show: cover image, type badge, title, date, location, price. The large variant gets a bigger image and more prominent layout.

Key details:

- Large card: `aspect-[3/4]` image, larger title text, shows organizer + rating
- Small card: `aspect-[16/10]` image, compact info
- Both link to `/events/[id]`
- Use `next/image` with the event's `cover_image_url`
- Gradient overlay on image for text readability
- Use existing `DifficultyBadge` and type badge patterns from EventCard

**Step 1: Create the component**

Build `BentoEventCard` with props:

```ts
interface BentoEventCardProps extends EventCardData {
  variant: "large" | "small";
}
```

**Step 2: Run typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/landing/BentoEventCard.tsx
git commit -m "feat: add BentoEventCard component with large/small variants"
```

---

### Task 5: Create BentoEventsSection server component

**Files:**

- Create: `src/components/landing/BentoEventsSection.tsx`

**Description:**

Server component that replaces UpcomingEventsSection. Fetches initial data for the "Featured" tab (falls back to "Upcoming" if no featured events exist). Passes data to a client component for tab switching and carousel.

Query pattern — same as UpcomingEventsSection but:

- Fetch featured events: `.eq("is_featured", true).eq("status", "published").gte("date", now).order("date").limit(10)`
- Fetch upcoming count for fallback
- Use `fetchEventEnrichments` + `mapEventToCard` same as existing

Renders `BentoEventsClient` (client component) with:

- `initialEvents: EventCardData[]`
- `initialTab: "featured" | "upcoming"`

**Step 1: Create the server component**

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/landing/BentoEventsSection.tsx
git commit -m "feat: add BentoEventsSection server component"
```

---

### Task 6: Create BentoEventsClient component (tabs + carousel + bento grid)

**Files:**

- Create: `src/components/landing/BentoEventsClient.tsx`

**Description:**

This is the main client component. It handles:

1. **Tab bar**: Horizontal scrollable tabs — Featured, Upcoming, Hiking, Mountain Biking, Road Biking, Running, Trail Running. Active tab highlighted with lime underline.

2. **Data fetching per tab**: On tab click, fetch from `/api/events?type=hiking&limit=10` (or `when=upcoming` or `featured=true`). Cache results in a `Record<string, EventCardData[]>` ref so re-clicking a tab doesn't re-fetch.

3. **Bento grid**: Desktop — CSS grid with `grid-cols-3 grid-rows-2`. First card spans `col-span-1 row-span-2` (large). Cards 2-5 fill the 2x2 right side (small). Mobile — single column stack or horizontal swipe of individual cards.

4. **Carousel pagination**: If >5 events, show left/right arrows + swipe support. Each "page" is a group of 5 events rendered in the bento layout. Track `currentPage` state. Animate transitions with CSS transform or opacity.

5. **Arrow buttons**: Top-right, circular, like the GoFundMe reference. Only show when there are more pages.

6. **Loading state**: Skeleton bento grid while fetching a new tab.

Tab config:

```ts
const TABS = [
  { key: "featured", label: "Featured", param: "featured=true" },
  { key: "upcoming", label: "Upcoming", param: "when=upcoming" },
  { key: "hiking", label: "Hiking", param: "type=hiking" },
  { key: "mtb", label: "Mountain Biking", param: "type=mtb" },
  { key: "road_bike", label: "Road Biking", param: "type=road_bike" },
  { key: "running", label: "Running", param: "type=running" },
  { key: "trail_run", label: "Trail Running", param: "type=trail_run" },
] as const;
```

Props:

```ts
interface BentoEventsClientProps {
  initialEvents: EventCardData[];
  initialTab: string;
}
```

**Step 1: Create the client component with tabs + bento grid + carousel**

**Step 2: Run typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/landing/BentoEventsClient.tsx
git commit -m "feat: add BentoEventsClient with tabs, bento grid, and swipe carousel"
```

---

### Task 7: Wire into homepage

**Files:**

- Modify: `src/app/(frontend)/page.tsx`

**Step 1: Replace UpcomingEventsSection with BentoEventsSection**

In the imports, replace:

```ts
import UpcomingEventsSection from "@/components/landing/UpcomingEventsSection";
```

with:

```ts
import BentoEventsSection from "@/components/landing/BentoEventsSection";
```

In `renderSection`, update the `"upcoming_events"` case to render `<BentoEventsSection />` instead of `<UpcomingEventsSection />`.

Update the skeleton fallback if needed.

**Step 2: Run typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 3: Test locally**

Run: `pnpm dev`

- Verify bento grid renders on homepage
- Verify tabs switch content
- Verify carousel arrows/swipe work
- Verify mobile layout

**Step 4: Commit**

```bash
git add src/app/(frontend)/page.tsx
git commit -m "feat: replace UpcomingEventsSection with BentoEventsSection on homepage"
```

---

### Task 8: Add Supabase migration for is_featured column

**Files:**

- Create SQL to run in Supabase dashboard

**Step 1: Run migration in Supabase**

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
```

**Step 2: Optionally set a few events as featured for testing**

```sql
UPDATE events SET is_featured = true WHERE id IN ('...', '...');
```

---

### Task 9: Polish and responsive testing

**Step 1: Test all tabs load correctly**
**Step 2: Test swipe on mobile viewport**
**Step 3: Test empty state (tab with no events shows "No events" message)**
**Step 4: Test dark mode**
**Step 5: Run full CI checks**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
Expected: All PASS

**Step 6: Commit any fixes**

```bash
git commit -m "fix: bento carousel polish and responsive fixes"
```
