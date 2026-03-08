# Remove `organizer_id` from Events — Complete Club Migration

## Problem

The `events.organizer_id` column still has a FK constraint to `organizer_profiles`. New clubs created after the migration don't have matching `organizer_profiles` rows, causing FK violations on event creation.

22 RLS policies depend on `events.organizer_id`, preventing a simple column drop.

## Design

### Migration SQL

1. **Drop all 22 RLS policies** that reference `events.organizer_id`
2. **Drop `organizer_id` column** from `events`
3. **Recreate all 22 policies** using `events.club_id` + `club_members` with role-based filters matching `CLUB_PERMISSIONS`

#### New RLS Pattern

Old:

```sql
events.organizer_id IN (SELECT id FROM organizer_profiles WHERE user_id = auth.uid())
```

New:

```sql
events.club_id IN (
  SELECT club_id FROM club_members
  WHERE user_id = auth.uid() AND role IN (...)
)
```

#### Role Filters by Operation

| Operation                                                     | Min Role  | SQL `role IN (...)`                      |
| ------------------------------------------------------------- | --------- | ---------------------------------------- |
| Create/delete events, manage/award badges                     | admin     | `('owner','admin')`                      |
| Edit events, manage bookings, checkins, companions, distances | moderator | `('owner','admin','moderator')`          |
| View own club events (SELECT on events)                       | member    | `('owner','admin','moderator','member')` |

#### Policies to Recreate (22 total)

**events (2):**

- `Published events are viewable by everyone` — SELECT: public if published/completed, OR user is club member
- `Club staff can manage own events` — ALL: admin+ via club_members

**event_photos (1):**

- `Club staff can manage event photos` — ALL: moderator+ via club_members

**bookings (3):**

- `Club staff can view event bookings` — SELECT: moderator+ via club_members
- `Club staff can update event bookings` — UPDATE: moderator+ via club_members
- `Club staff can add participants to their events` — INSERT: moderator+ via club_members (+ `added_by = auth.uid()`)

**badges (1):**

- `Club staff can manage badges` — ALL: admin+ via club_members

**user_badges (1):**

- `Club staff can award badges` — INSERT: admin+ via club_members

**event_checkins (2):**

- `Club staff can view event checkins` — SELECT: moderator+ via club_members
- `Club staff can check in participants` — INSERT: moderator+ via club_members

**booking_companions (2):**

- `Club staff can view companions` — SELECT: moderator+ via club_members
- `Club staff can update companions (check-in)` — UPDATE: moderator+ via club_members

**event_distances (3):**

- `event_distances_insert_club_staff` — INSERT: moderator+ via club_members
- `event_distances_update_club_staff` — UPDATE: moderator+ via club_members
- `event_distances_delete_club_staff` — DELETE: moderator+ via club_members

**event_mountains (2):**

- `event_mountains_insert_club_staff` — INSERT: moderator+ via club_members
- `event_mountains_delete_club_staff` — DELETE: moderator+ via club_members

**event_guides (2):**

- `event_guides_insert_club_staff` — INSERT: moderator+ via club_members
- `event_guides_delete_club_staff` — DELETE: moderator+ via club_members

**event_routes (3):**

- `event_routes_insert_club_staff` — INSERT: moderator+ via club_members
- `event_routes_update_club_staff` — UPDATE: moderator+ via club_members
- `event_routes_delete_club_staff` — DELETE: moderator+ via club_members

### Code Changes

1. **`src/app/(frontend)/api/events/route.ts`** — Remove `organizer_id: clubId` from insert
2. **`src/lib/supabase/types.ts`** — Remove `organizer_id` from events type, remove `organizer_profiles` type
3. **`scripts/seed.ts`** — Remove `organizer_id: clubId` from event inserts
4. **`src/lib/badges/check-pioneer-badges.ts`** — Query `clubs` instead of `organizer_profiles`
5. **`src/lib/events/map-event-card.ts`** — Remove `organizer_profiles` fallback
6. **`src/app/(frontend)/(participant)/events/[id]/page.tsx`** — Join `clubs` instead of `organizer_profiles`
7. **`src/app/(frontend)/(participant)/events/[id]/book/page.tsx`** — Remove `organizer_profiles` payment fallback
8. **`src/components/dashboard/EventForm.tsx`** — Remove `organizer_profiles` query
9. **`src/components/dashboard/PaymentSettingsForm.tsx`** — Use `clubs.payment_info`
10. **`src/app/(frontend)/claim/[token]/page.tsx`** — Update claim flow to use clubs

### What NOT to Do

- Don't drop `organizer_profiles` table — may have historical data. Just remove code references.
- Don't change `club_members` or `clubs` schema — already solid.
