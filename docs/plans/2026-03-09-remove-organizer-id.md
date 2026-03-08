# Remove `organizer_id` from Events — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the `events.organizer_id` column and all 22 RLS policies that depend on it, replacing them with `club_id` + `club_members` role-based policies. Clean up all code references to `organizer_profiles`.

**Architecture:** Drop old RLS policies, drop `organizer_id` column, recreate policies using `events.club_id` joined with `club_members` for role checks. Update all app code to remove `organizer_profiles` references. The `organizer_profiles` table stays in the DB for now (historical data) but all code paths switch to clubs.

**Tech Stack:** Supabase (PostgreSQL RLS), Next.js App Router, TypeScript

---

### Task 1: Generate Migration SQL

**Files:**

- Create: `supabase/migrations/013_remove_organizer_id.sql`

**Step 1: Write the migration SQL**

```sql
-- ============================================================================
-- Migration: Remove events.organizer_id and migrate RLS to club_id + club_members
-- ============================================================================

-- ============================================================================
-- 1. Drop all RLS policies that reference events.organizer_id
-- ============================================================================

-- events table
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Organizers can manage own events" ON public.events;

-- event_photos table
DROP POLICY IF EXISTS "Organizers can manage event photos" ON public.event_photos;

-- bookings table
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can update event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can add participants to their events" ON public.bookings;

-- badges table
DROP POLICY IF EXISTS "Organizers can manage badges" ON public.badges;

-- user_badges table
DROP POLICY IF EXISTS "Organizers can award badges" ON public.user_badges;

-- event_checkins table
DROP POLICY IF EXISTS "Organizers can view event checkins" ON public.event_checkins;
DROP POLICY IF EXISTS "Organizers can check in participants" ON public.event_checkins;

-- booking_companions table
DROP POLICY IF EXISTS "Organizers can view companions" ON public.booking_companions;
DROP POLICY IF EXISTS "Organizers can update companions (check-in)" ON public.booking_companions;

-- event_distances table
DROP POLICY IF EXISTS "event_distances_insert_organizer" ON public.event_distances;
DROP POLICY IF EXISTS "event_distances_update_organizer" ON public.event_distances;
DROP POLICY IF EXISTS "event_distances_delete_organizer" ON public.event_distances;

-- event_mountains table
DROP POLICY IF EXISTS "event_mountains_insert_organizer" ON public.event_mountains;
DROP POLICY IF EXISTS "event_mountains_delete_organizer" ON public.event_mountains;

-- event_guides table
DROP POLICY IF EXISTS "event_guides_insert_organizer" ON public.event_guides;
DROP POLICY IF EXISTS "event_guides_delete_organizer" ON public.event_guides;

-- event_routes table
DROP POLICY IF EXISTS "event_routes_insert_organizer" ON public.event_routes;
DROP POLICY IF EXISTS "event_routes_update_organizer" ON public.event_routes;
DROP POLICY IF EXISTS "event_routes_delete_organizer" ON public.event_routes;

-- ============================================================================
-- 2. Drop organizer_id column from events
-- ============================================================================

ALTER TABLE public.events DROP COLUMN organizer_id;

-- ============================================================================
-- 3. Recreate RLS policies using club_id + club_members
-- ============================================================================

-- Helper comment: Role hierarchy
--   owner (4) > admin (3) > moderator (2) > member (1)
-- CLUB_PERMISSIONS mapping:
--   create/delete events, manage/award badges → admin+  → ('owner','admin')
--   edit events, manage bookings/checkins/companions/distances → moderator+ → ('owner','admin','moderator')
--   view own club events → member+ → ('owner','admin','moderator','member')

-- ---------- events ----------

CREATE POLICY "Published events are viewable by everyone" ON public.events
  FOR SELECT USING (
    status IN ('published', 'completed')
    OR club_id IN (
      SELECT club_id FROM public.club_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Club staff can manage own events" ON public.events
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM public.club_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ---------- event_photos ----------

CREATE POLICY "Club staff can manage event photos" ON public.event_photos
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- bookings ----------

CREATE POLICY "Club staff can view event bookings" ON public.bookings
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

CREATE POLICY "Club staff can update event bookings" ON public.bookings
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

CREATE POLICY "Club staff can add participants to their events" ON public.bookings
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
    AND added_by = auth.uid()
  );

-- ---------- badges ----------

CREATE POLICY "Club staff can manage badges" ON public.badges
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- ---------- user_badges ----------

CREATE POLICY "Club staff can award badges" ON public.user_badges
  FOR INSERT WITH CHECK (
    badge_id IN (
      SELECT b.id FROM public.badges b
      JOIN public.events e ON b.event_id = e.id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- ---------- event_checkins ----------

CREATE POLICY "Club staff can view event checkins" ON public.event_checkins
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

CREATE POLICY "Club staff can check in participants" ON public.event_checkins
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- booking_companions ----------

CREATE POLICY "Club staff can view companions" ON public.booking_companions
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.events e ON e.id = b.event_id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

CREATE POLICY "Club staff can update companions (check-in)" ON public.booking_companions
  FOR UPDATE USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.events e ON e.id = b.event_id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- event_distances ----------

CREATE POLICY "event_distances_insert_club_staff" ON public.event_distances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_distances_update_club_staff" ON public.event_distances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_distances_delete_club_staff" ON public.event_distances
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_mountains ----------

CREATE POLICY "event_mountains_insert_club_staff" ON public.event_mountains
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_mountains.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_mountains_delete_club_staff" ON public.event_mountains
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_mountains.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_guides ----------

CREATE POLICY "event_guides_insert_club_staff" ON public.event_guides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_guides.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_guides_delete_club_staff" ON public.event_guides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_guides.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_routes ----------

CREATE POLICY "event_routes_insert_club_staff" ON public.event_routes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_routes_update_club_staff" ON public.event_routes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

CREATE POLICY "event_routes_delete_club_staff" ON public.event_routes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );
```

**Step 2: Run the migration in Supabase dashboard**

User runs this SQL in the Supabase SQL editor.

**Step 3: Commit**

```bash
git add supabase/migrations/013_remove_organizer_id.sql
git commit -m "chore: add migration to remove organizer_id and recreate RLS with club_members"
```

---

### Task 2: Update TypeScript Types

**Files:**

- Modify: `src/lib/supabase/types.ts:42-86` (remove organizer_profiles type)
- Modify: `src/lib/supabase/types.ts:90,111,132` (remove organizer_id from events)

**Step 1: Remove `organizer_profiles` table type**

Delete the entire `organizer_profiles` block at lines 42-86.

**Step 2: Remove `organizer_id` from events type**

In the `events` type:

- Row: remove `organizer_id: string;` (line 90)
- Insert: remove `organizer_id: string;` (line 111)
- Update: remove `organizer_id?: string;` (line 132)

**Step 3: Make `club_id` required in Insert type**

Change `club_id?: string | null;` to `club_id: string;` in Insert.
Change `club_id: string | null;` to `club_id: string;` in Row.

**Step 4: Run typecheck to find all broken references**

Run: `pnpm typecheck`
Expected: TypeScript errors in the files we'll fix in subsequent tasks.

**Step 5: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "refactor: remove organizer_id and organizer_profiles from TypeScript types"
```

---

### Task 3: Fix API Events Route

**Files:**

- Modify: `src/app/(frontend)/api/events/route.ts:315`

**Step 1: Remove `organizer_id` from event insert**

At line 315, delete:

```typescript
      organizer_id: clubId, // backward compat during migration
```

**Step 2: Commit**

```bash
git add src/app/\(frontend\)/api/events/route.ts
git commit -m "refactor: remove organizer_id from event creation API"
```

---

### Task 4: Fix Seed Script

**Files:**

- Modify: `scripts/seed.ts:2036`

**Step 1: Remove `organizer_id` from event insert**

At line 2036 in `createEvents()`, delete:

```typescript
        organizer_id: clubId,
```

**Step 2: Commit**

```bash
git add scripts/seed.ts
git commit -m "refactor: remove organizer_id from seed script event creation"
```

---

### Task 5: Fix Event Detail Page

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx:79,115-126,328,578-586`

**Step 1: Update the select query (line 79)**

Change:

```typescript
    "*, clubs(id, name, slug, logo_url), organizer_profiles:organizer_id(*, users:user_id(*))",
```

To:

```typescript
    "*, clubs(id, name, slug, logo_url)",
```

**Step 2: Update event count query (lines 115-126)**

Remove the ternary fallback to organizer_id. Replace with:

```typescript
const { count: orgEventCount } = await supabase
  .from("events")
  .select("*", { count: "exact", head: true })
  .eq("club_id", event.club_id)
  .eq("status", "published");
```

**Step 3: Remove organizer fallback (line 328)**

Delete:

```typescript
const organizer = event.organizer_profiles as any;
```

**Step 4: Update OrganizerCard usage (lines 578-586)**

Change to use only club data:

```typescript
{club && (
  <OrganizerCard
    clubSlug={club.slug}
    orgName={club.name}
    logoUrl={club.logo_url ?? null}
    eventCount={orgEventCount || 0}
  />
)}
```

**Step 5: Commit**

```bash
git add "src/app/(frontend)/(participant)/events/[id]/page.tsx"
git commit -m "refactor: remove organizer_profiles references from event detail page"
```

---

### Task 6: Fix Book Event Page

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/book/page.tsx:23,141-151`

**Step 1: Remove organizer_id from select query (line 23)**

Change:

```typescript
  "id, title, date, end_date, price, max_participants, organizer_id, club_id, waiver_text",
```

To:

```typescript
  "id, title, date, end_date, price, max_participants, club_id, waiver_text",
```

**Step 2: Replace organizer_profiles payment fallback (lines 141-151)**

Delete the entire fallback block:

```typescript
// Fall back to organizer profile if club has no payment info
if (!paymentInfo) {
  const { data: organizer } = await supabase
    .from("organizer_profiles")
    .select("payment_info")
    .eq("id", event.organizer_id)
    .single();
  paymentInfo = organizer?.payment_info as {
    gcash_number?: string;
    maya_number?: string;
  } | null;
}
```

**Step 3: Commit**

```bash
git add "src/app/(frontend)/(participant)/events/[id]/book/page.tsx"
git commit -m "refactor: remove organizer_profiles fallback from booking page"
```

---

### Task 7: Fix EventForm Component

**Files:**

- Modify: `src/components/dashboard/EventForm.tsx:315-340`

**Step 1: Replace `fetchOrganizerEvents` function**

The function currently queries `organizer_profiles` then uses `organizer_id` to fetch events. Replace with club-based query. The EventForm should receive a `clubId` prop (check if it already does), or look up the user's club via `club_members`:

Replace lines 315-340 with:

```typescript
const fetchOrganizerEvents = async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: membership } = await supabase
    .from("club_members")
    .select("club_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "moderator"])
    .limit(1)
    .single();
  if (!membership) return;

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, end_date, coordinates, status")
    .eq("club_id", membership.club_id)
    .in("status", ["draft", "published", "completed"]);

  if (!events) return;

  const filtered =
    mode === "edit" && initialData?.id ? events.filter((e) => e.id !== initialData.id) : events;

  const typedFiltered: OrganizerEvent[] = filtered;
  setOrganizerEvents(typedFiltered);
};
```

**Step 2: Commit**

```bash
git add src/components/dashboard/EventForm.tsx
git commit -m "refactor: use club_members instead of organizer_profiles in EventForm"
```

---

### Task 8: Fix PaymentSettingsForm

**Files:**

- Modify: `src/components/dashboard/PaymentSettingsForm.tsx:31-38`

**Step 1: Change table from `organizer_profiles` to `clubs`**

Change line 31:

```typescript
      .from("organizer_profiles")
```

To:

```typescript
      .from("clubs")
```

The rest of the update logic (`.update({ payment_info: ... }).eq("id", profileId)`) works as-is since the settings page already passes `clubData.id` as `profileId`.

**Step 2: Rename prop for clarity (optional but clean)**

Rename `profileId` to `clubId` in the interface and usage. The parent (`dashboard/settings/page.tsx` line 47) already passes a club ID.

**Step 3: Commit**

```bash
git add src/components/dashboard/PaymentSettingsForm.tsx
git commit -m "refactor: update PaymentSettingsForm to use clubs table"
```

---

### Task 9: Fix Map Event Card

**Files:**

- Modify: `src/lib/events/map-event-card.ts:19,132-133`

**Step 1: Update EventCardData interface**

Remove line 19: `organizer_id?: string;`

**Step 2: Update mapping (lines 132-133)**

Change:

```typescript
    organizer_name: event.clubs?.name ?? event.organizer_profiles?.org_name,
    organizer_id: event.club_id ?? event.organizer_id,
```

To:

```typescript
    organizer_name: event.clubs?.name,
```

**Step 3: Fix BentoEventsClient reference**

In `src/components/landing/BentoEventsClient.tsx` line 59, remove:

```typescript
    organizer_id: e.organizer_id ?? undefined,
```

**Step 4: Commit**

```bash
git add src/lib/events/map-event-card.ts src/components/landing/BentoEventsClient.tsx
git commit -m "refactor: remove organizer_id fallback from event card mapping"
```

---

### Task 10: Fix OrganizerCard Component

**Files:**

- Modify: `src/components/events/OrganizerCard.tsx:7-8,21`

**Step 1: Remove `organizerId` prop**

Remove from interface:

```typescript
  /** Falls back to organizer link if no club slug */
  organizerId?: string;
```

Remove from destructuring:

```typescript
  organizerId,
```

**Step 2: Simplify href (line 21)**

Change:

```typescript
const href = clubSlug ? `/clubs/${clubSlug}` : `/organizers/${organizerId}`;
```

To:

```typescript
const href = clubSlug ? `/clubs/${clubSlug}` : "#";
```

**Step 3: Commit**

```bash
git add src/components/events/OrganizerCard.tsx
git commit -m "refactor: remove organizerId fallback from OrganizerCard"
```

---

### Task 11: Fix Pioneer Badges

**Files:**

- Modify: `src/lib/badges/check-pioneer-badges.ts:29-37`

**Step 1: Replace organizer_profiles query with clubs query**

Change:

```typescript
result.organizersAwarded = await awardBadgeForSet(supabase, "pioneer_organizer", async () => {
  const { data } = await supabase
    .from("organizer_profiles")
    .select("user_id")
    .order("created_at", { ascending: true })
    .limit(PIONEER_ORGANIZER_CAP);
  return (data ?? []).map((o) => o.user_id).filter((id): id is string => id !== null);
});
```

To:

```typescript
result.organizersAwarded = await awardBadgeForSet(supabase, "pioneer_organizer", async () => {
  const { data } = await supabase
    .from("club_members")
    .select("user_id")
    .eq("role", "owner")
    .order("joined_at", { ascending: true })
    .limit(PIONEER_ORGANIZER_CAP);
  return (data ?? []).map((o) => o.user_id).filter((id): id is string => id !== null);
});
```

**Step 2: Commit**

```bash
git add src/lib/badges/check-pioneer-badges.ts
git commit -m "refactor: use club_members for pioneer organizer badge check"
```

---

### Task 12: Fix Claim Page

**Files:**

- Modify: `src/app/(frontend)/claim/[token]/page.tsx:12-16`

**Step 1: Update query to use clubs table**

The claim feature uses `organizer_profiles.claim_token`. Since we're keeping the `organizer_profiles` table in the DB for now but the claim feature should migrate to clubs, check if `clubs` table has claim fields.

If clubs table does NOT have `claim_token`/`claim_expires_at`/`is_claimed` columns, this page should keep querying `organizer_profiles` for now (the table still exists, just no code creates new rows). This is acceptable as a legacy read-only path.

**Alternative:** If the claim feature is no longer used, consider removing the entire `/claim` route.

For now, leave as-is since it's a read-only path on a table that still exists. Add a TODO comment.

**Step 2: Commit (if changes made)**

---

### Task 13: Run Full Verification

**Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: No TypeScript errors

**Step 2: Run linter**

Run: `pnpm lint`
Expected: No lint errors

**Step 3: Run tests**

Run: `pnpm test`
Expected: All tests pass

**Step 4: Run build**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Final commit if any fixes needed**

```bash
git commit -m "fix: resolve remaining type/lint issues from organizer_id removal"
```
