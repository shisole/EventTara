# Event Distance Categories Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-distance pricing and capacity for running, trail running, and road biking events, with chatbot integration for distance-based queries.

**Architecture:** New `event_distances` table (id, event_id, distance_km, label, price, max_participants). Bookings get nullable `event_distance_id` FK. Events without distances work as before (fallback to event-level price/max_participants). Chatbot learns to parse distance queries.

**Tech Stack:** Supabase (Postgres), Next.js API routes, React forms, Claude Haiku (chatbot)

---

### Task 1: Database Schema — Add `event_distances` table and update `bookings`

**Files:**

- Modify: `src/lib/supabase/types.ts` (add EventDistances types at ~line 117, add `event_distance_id` to Bookings types at ~line 232)

**Steps:**

1. Create `event_distances` table in Supabase SQL editor:
   - `id` uuid PK, `event_id` uuid FK→events ON DELETE CASCADE, `distance_km` numeric NOT NULL, `label` text, `price` numeric NOT NULL, `max_participants` integer NOT NULL, `created_at` timestamptz DEFAULT now()
   - UNIQUE constraint on `(event_id, distance_km)`
   - RLS: public read for published events, organizer write for own events
2. Add `event_distance_id` nullable uuid FK→event_distances to `bookings` table
3. Update `src/lib/supabase/types.ts` with new types
4. Commit

---

### Task 2: API — Include distances in event GET responses

**Files:**

- Modify: `src/app/(frontend)/api/events/[id]/route.ts` GET handler (~line 6)
- Modify: `src/app/(frontend)/api/events/route.ts` GET handler (~line 37)

**Steps:**

1. In single event GET, fetch `event_distances` for the event, include in response as `distances` array sorted by `distance_km`
2. In list events GET, add optional `distance` query param — when present, inner join `event_distances` to filter events offering that distance
3. In list events response, include `distances` array per event
4. Commit

---

### Task 3: API — Create/update distances in event POST/PUT

**Files:**

- Modify: `src/app/(frontend)/api/events/route.ts` POST handler (~line 219)
- Modify: `src/app/(frontend)/api/events/[id]/route.ts` PUT handler (~line 19)

**Steps:**

1. POST: Accept optional `distances` array in body `[{distance_km, label?, price, max_participants}]`. After inserting event, bulk insert into `event_distances`
2. PUT: Accept optional `distances` array. Sync strategy: delete existing distances for event, re-insert from payload (simpler than upsert, and these are organizer-managed)
3. Commit

---

### Task 4: API — Update bookings capacity check for per-distance capacity

**Files:**

- Modify: `src/app/(frontend)/api/bookings/route.ts` POST handler (~line 76)

**Steps:**

1. Accept optional `event_distance_id` in booking request body
2. If `event_distance_id` provided: fetch that distance row, check capacity against bookings with same `event_distance_id`
3. If not provided: use existing event-level capacity check (backward compatible)
4. Store `event_distance_id` on the booking row
5. Commit

---

### Task 5: EventForm — Add distance categories section

**Files:**

- Modify: `src/components/dashboard/EventForm.tsx` (~line 497 area, after type selector)

**Steps:**

1. When event type is `running`, `trail_run`, or `road_bike`, render a "Distance Categories" section
2. Preset quick-pick chips: 3, 5, 10, 21, 42, 50, 100km + custom input
3. Each added distance: row with distance_km (read-only), label (auto-filled, editable), price, max_participants
4. When distances exist, hide the event-level price/max_participants fields
5. Include distances array in form submission payload
6. Commit

---

### Task 6: Booking page — Distance selection

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/book/page.tsx` (~line 18)
- Modify: `src/components/booking/BookingForm.tsx` (or wherever the booking form lives)

**Steps:**

1. Fetch event distances along with event data
2. If event has distances, show distance selector (cards with distance, label, price, spots remaining)
3. Selected distance determines the price shown and `event_distance_id` sent with booking
4. Per-distance remaining spots = distance.max_participants - bookings count for that distance_id
5. Commit

---

### Task 7: Event detail page — Show distances

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx` (~line 71)

**Steps:**

1. Fetch event distances
2. If event has distances, show distance categories section (distance, label, price, spots) instead of single price/capacity
3. "Book Now" button still links to booking page where they pick the distance
4. Commit

---

### Task 8: Chatbot — Parse distance queries

**Files:**

- Modify: `src/lib/ai/search-prompt.ts` (~line 1 ParsedSearchParams, ~line 11 system prompt)
- Modify: `src/app/(frontend)/api/chat/route.ts` (~line 117 query building, ~line 215 filter URL)

**Steps:**

1. Add `distance?: number` to ParsedSearchParams
2. Update system prompt with distance parsing rules:
   - "marathon" → distance 42, "half marathon" → 21, "10k/10km" → 10, "5k/5km" → 5, "ultra" → 50+
3. In chat route, when distance is present, join `event_distances` table to filter
4. Include distance in filter URL as query param
5. Commit

---

### Task 9: Events listing page — Support distance filter

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/page.tsx`

**Steps:**

1. Read `distance` from search params (passed from chatbot filter URL)
2. Pass to API call
3. Optionally show distance badge/tag on event cards when distance filter is active
4. Commit

---

### Task 10: Seed script — Add distances to seed events

**Files:**

- Modify: `scripts/seed.ts` (~line 235 TestEvent interface, ~line 249 TEST_EVENTS)

**Steps:**

1. Add optional `distances` array to TestEvent interface
2. Add realistic distances to running/trail_run/road_bike seed events
3. After inserting events, bulk insert their distances into `event_distances`
4. Commit

---

### Task 11: Final integration test and cleanup

**Steps:**

1. Run `npm run build` to verify no type errors
2. Manual test: create event with distances, book with distance selection, chatbot distance query
3. Final commit with any fixes
