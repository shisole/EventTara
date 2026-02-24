# Guides Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let organizers manage hiking guides and tag them on events, so participants can discover, review, and follow guides they trust.

**Architecture:** New `guides`, `event_guides`, and `guide_reviews` tables in Supabase. Organizers CRUD guides from dashboard. Guides appear on event detail pages and have their own public profile at `/guides/[id]`. Participants review guides after completed events.

**Tech Stack:** Next.js 15 App Router, Supabase (server + client), Tailwind CSS, existing UI components (Avatar, Card, Button, Input).

---

### Task 1: Database Types — Add guides, event_guides, guide_reviews

**Files:**
- Modify: `src/lib/supabase/types.ts`

**Step 1:** Add `guides` table types after the `events` table definition. Follow the exact Row/Insert/Update pattern.

Fields: `id`, `full_name`, `bio` (nullable), `avatar_url` (nullable), `contact_number` (nullable), `user_id` (nullable — future claim), `created_by` (references auth user id), `created_at`.

**Step 2:** Add `event_guides` table types. Fields: `id`, `event_id`, `guide_id`, `created_at`.

**Step 3:** Add `guide_reviews` table types. Fields: `id`, `guide_id`, `user_id`, `event_id`, `rating` (number), `text` (nullable), `created_at`.

**Step 4:** Run `npm run build` to verify types compile.

**Step 5:** Commit: `feat(guides): add database types for guides, event_guides, guide_reviews`

---

### Task 2: Supabase Migration — Create tables

**Manual step in Supabase Dashboard SQL Editor.** Run this SQL:

```sql
-- Guides table
CREATE TABLE public.guides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  bio text,
  avatar_url text,
  contact_number text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Event-Guide join table
CREATE TABLE public.event_guides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guide_id uuid NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, guide_id)
);

-- Guide reviews
CREATE TABLE public.guide_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id uuid NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(guide_id, user_id, event_id)
);

-- RLS policies
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guide_reviews ENABLE ROW LEVEL SECURITY;

-- Guides: public read, organizers write
CREATE POLICY "Anyone can read guides" ON public.guides FOR SELECT USING (true);
CREATE POLICY "Organizers can insert guides" ON public.guides FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update guides" ON public.guides FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete guides" ON public.guides FOR DELETE USING (auth.uid() = created_by);

-- Event guides: public read, organizers write (event owner)
CREATE POLICY "Anyone can read event_guides" ON public.event_guides FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert event_guides" ON public.event_guides FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete event_guides" ON public.event_guides FOR DELETE USING (auth.uid() IS NOT NULL);

-- Guide reviews: public read, authenticated write own
CREATE POLICY "Anyone can read guide_reviews" ON public.guide_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.guide_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.guide_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.guide_reviews FOR DELETE USING (auth.uid() = user_id);
```

---

### Task 3: API Routes — Guide CRUD

**Files:**
- Create: `src/app/(frontend)/api/guides/route.ts` (GET list, POST create)
- Create: `src/app/(frontend)/api/guides/[id]/route.ts` (GET one, PATCH update, DELETE)

**Step 1:** Create `GET /api/guides` — list guides. Optional query params: `created_by` (filter by organizer user id). Returns guides with event count and avg rating.

**Step 2:** Create `POST /api/guides` — create guide. Auth required. Body: `{ full_name, bio?, avatar_url?, contact_number? }`. Sets `created_by` to authenticated user.

**Step 3:** Create `GET /api/guides/[id]` — get single guide with events and reviews.

**Step 4:** Create `PATCH /api/guides/[id]` — update guide. Only creator can update.

**Step 5:** Create `DELETE /api/guides/[id]` — delete guide. Only creator can delete.

**Step 6:** Run `npm run build` to verify.

**Step 7:** Commit: `feat(guides): API routes for guide CRUD`

---

### Task 4: API Routes — Event-Guide Linking

**Files:**
- Create: `src/app/(frontend)/api/events/[id]/guides/route.ts` (GET, POST, DELETE)

**Step 1:** Create `GET /api/events/[id]/guides` — list guides for an event.

**Step 2:** Create `POST /api/events/[id]/guides` — link a guide to an event. Body: `{ guide_id }`. Auth required.

**Step 3:** Create `DELETE /api/events/[id]/guides` — unlink a guide. Body: `{ guide_id }`. Auth required.

**Step 4:** Run `npm run build` to verify.

**Step 5:** Commit: `feat(guides): API routes for event-guide linking`

---

### Task 5: API Routes — Guide Reviews

**Files:**
- Create: `src/app/(frontend)/api/guides/[id]/reviews/route.ts` (GET, POST)

**Step 1:** Create `GET /api/guides/[id]/reviews` — list reviews for a guide. Joins user info (full_name, avatar_url).

**Step 2:** Create `POST /api/guides/[id]/reviews` — create review. Body: `{ event_id, rating, text? }`. Validates: user has confirmed booking on a completed event where this guide was tagged.

**Step 3:** Run `npm run build` to verify.

**Step 4:** Commit: `feat(guides): API routes for guide reviews`

---

### Task 6: GuideCard Component

**Files:**
- Create: `src/components/guides/GuideCard.tsx`

**Step 1:** Create `GuideCard` component. Props: `id`, `full_name`, `avatar_url`, `bio`, `avg_rating?`, `review_count?`, `event_count?`. Links to `/guides/[id]`. Follow `OrganizerCard` style — `Avatar` + name + rating stars + event count.

**Step 2:** Run `npm run build` to verify.

**Step 3:** Commit: `feat(guides): GuideCard component`

---

### Task 7: Public Guide Profile Page — `/guides/[id]`

**Files:**
- Create: `src/app/(frontend)/(participant)/guides/[id]/page.tsx`

**Step 1:** Server component. Fetch guide by id, along with:
- Events they're tagged on (via `event_guides` join, with event details)
- Reviews with user info
- Aggregate stats (avg rating, review count, events guided)

**Step 2:** Layout sections:
- **Header:** Avatar, full name, bio, contact number, avg rating
- **Stats row:** Events guided, avg rating, total reviews
- **Upcoming events** list (using `EventCard`)
- **Past events** list (using `EventCard`)
- **Reviews** section (rating + text + reviewer name)

**Step 3:** Add `generateMetadata` for SEO.

**Step 4:** Run `npm run build` to verify.

**Step 5:** Commit: `feat(guides): public guide profile page`

---

### Task 8: Event Detail Page — Show Guides

**Files:**
- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx`

**Step 1:** Fetch `event_guides` with guide info for this event. Also fetch guide review aggregates.

**Step 2:** Add "Guides" section below the organizer card in the sidebar (or below description on mobile). Show each guide as a small card with avatar, name, rating, linking to `/guides/[id]`. Only show for hiking events.

**Step 3:** Run `npm run build` to verify.

**Step 4:** Commit: `feat(guides): show guides on event detail page`

---

### Task 9: Dashboard — Guide Management Pages

**Files:**
- Create: `src/app/(frontend)/(organizer)/dashboard/guides/page.tsx` (list)
- Create: `src/app/(frontend)/(organizer)/dashboard/guides/new/page.tsx` (create)
- Create: `src/app/(frontend)/(organizer)/dashboard/guides/[id]/page.tsx` (view/edit)
- Create: `src/components/dashboard/GuideForm.tsx` (form component)

**Step 1:** Create `GuideForm` component. Fields: full_name (required), bio (textarea, optional), avatar_url (PhotoUploader), contact_number (optional). Props: `mode: "create" | "edit"`, `initialData?`. Submits to `POST /api/guides` or `PATCH /api/guides/[id]`.

**Step 2:** Create guide list page at `/dashboard/guides`. Fetch guides where `created_by` = current user. Show table/cards with name, events count, avg rating, edit link. Empty state with "Create Guide" CTA.

**Step 3:** Create new guide page at `/dashboard/guides/new`. Renders `<GuideForm mode="create" />`.

**Step 4:** Create guide detail/edit page at `/dashboard/guides/[id]`. Renders `<GuideForm mode="edit" />` with existing data.

**Step 5:** Add "Guides" link to dashboard sidebar/nav (if exists) or dashboard home page.

**Step 6:** Run `npm run build` to verify.

**Step 7:** Commit: `feat(guides): dashboard guide management pages`

---

### Task 10: EventForm — Guide Selection

**Files:**
- Modify: `src/components/dashboard/EventForm.tsx`

**Step 1:** When event type is `hiking`, show a "Guides" multi-select section. Fetch available guides created by the current user via `GET /api/guides?created_by={userId}`.

**Step 2:** On form submit, after event is created/updated, sync `event_guides` via `POST /api/events/[id]/guides` and `DELETE /api/events/[id]/guides`.

**Step 3:** When editing, pre-populate selected guides from existing `event_guides`.

**Step 4:** Run `npm run build` to verify.

**Step 5:** Commit: `feat(guides): guide selection in event create/edit form`

---

### Task 11: Seed Data — Test Guides

**Files:**
- Modify: `scripts/seed.ts`

**Step 1:** Add `TestGuide` interface and `TEST_GUIDES` array (8-10 guides across organizers, focused on hiking).

**Step 2:** Add `TEST_EVENT_GUIDES` array linking guides to hiking events.

**Step 3:** Add `TEST_GUIDE_REVIEWS` array — reviews from participants for completed events.

**Step 4:** Add `createGuides`, `linkEventGuides`, `seedGuideReviews` functions following existing patterns.

**Step 5:** Call them in `main()` after `createEvents`.

**Step 6:** Run `npm run build` to verify compilation.

**Step 7:** Commit: `feat(guides): seed data for guides, event links, and reviews`

---

### Task 12: Final Build & Verification

**Step 1:** Run `npm run build` — verify zero errors.

**Step 2:** Run `npm run seed` — verify guides are seeded correctly.

**Step 3:** Verify `/guides/[id]` renders with seed data.

**Step 4:** Verify `/events/[id]` shows guides for hiking events.

**Step 5:** Verify dashboard guide management works.

**Step 6:** Commit any fixes if needed.
