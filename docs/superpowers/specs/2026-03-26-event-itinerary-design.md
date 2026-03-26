# Event Itinerary Feature — Design Spec

**Date:** 2026-03-26
**Status:** Approved

## Overview

Club organizers can optionally attach a time-based itinerary to an event. Participants see it displayed as a timeline below the event description. If no itinerary entries exist, the section is hidden entirely.

---

## Data Model

New Supabase table: `event_itinerary`

| Column       | Type          | Notes                                                    |
| ------------ | ------------- | -------------------------------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()`                          |
| `event_id`   | `uuid`        | FK → `events.id`, ON DELETE CASCADE                      |
| `time`       | `text`        | Free text — e.g. "4:00 AM", "Sunrise", "Day 2 — 6:00 AM" |
| `title`      | `text`        | e.g. "Assembly at trailhead"                             |
| `sort_order` | `int`         | Manual ordering                                          |
| `created_at` | `timestamptz` | Default `now()`                                          |

`time` is free text (not a `time` type) so organizers aren't constrained to a time picker and can write multi-day or relative labels.

**RLS policies:**

- Public `SELECT` (anyone can read itinerary of a published/completed event)
- `INSERT/UPDATE/DELETE` restricted to club members with `owner`, `admin`, or `moderator` role for the event's club

**Types:** Add `event_itinerary` Row/Insert/Update types to `src/lib/supabase/types.ts`.

---

## Organizer UI

**Routes:**

- `/dashboard/events/[id]/itinerary`
- `/dashboard/clubs/[slug]/events/[id]/itinerary` (club-scoped equivalent)

**Page:** Server component fetches existing entries, passes to `ItineraryManager` client component.

**`ItineraryManager` component** (`src/components/dashboard/ItineraryManager.tsx`):

- Lists existing entries in `sort_order` order
- Each entry row: drag handle (⠿) | time | title | Edit button | Delete button
- Drag-to-reorder updates `sort_order` via `PATCH` on drop
- Edit: clicking Edit makes the row inline-editable (time + title inputs, Save/Cancel)
- Delete: calls `DELETE` endpoint, removes from list optimistically
- Inline add form at the bottom: Time input + Title input + Add button → calls `POST` endpoint
- On mobile: drag handle is hidden; add/edit/delete still function normally
- Hint text: "Optional — leave empty to hide from participants"

**Navigation:** Link to the itinerary sub-page added on the event dashboard page.

---

## Public UI

**Component:** `EventItinerary` (`src/components/events/EventItinerary.tsx`)

**Placement:** Rendered directly below the "About this event" description section on `/events/[id]`.

**Visibility:** Hidden entirely (not rendered) if the event has zero itinerary entries.

**Design:**

- Section heading: "Itinerary"
- Vertical timeline: left-side teal dots connected by a grey line
- Each entry: teal time label (bold) + title below
- Fully responsive — the vertical layout works on all screen sizes with no modification

---

## API Routes

All routes authenticate the caller via `createClient()` server-side. Write endpoints verify the caller is an `owner`, `admin`, or `moderator` of the event's club.

| Method   | Route                                  | Description                                     |
| -------- | -------------------------------------- | ----------------------------------------------- |
| `GET`    | `/api/events/[id]/itinerary`           | Fetch all entries ordered by `sort_order`       |
| `POST`   | `/api/events/[id]/itinerary`           | Add a new entry (`time`, `title`, `sort_order`) |
| `PATCH`  | `/api/events/[id]/itinerary/[entryId]` | Update `time`, `title`, and/or `sort_order`     |
| `DELETE` | `/api/events/[id]/itinerary/[entryId]` | Delete an entry                                 |

---

## Files to Create/Modify

**New files:**

- `src/components/dashboard/ItineraryManager.tsx` — organizer CRUD component
- `src/components/events/EventItinerary.tsx` — public timeline display
- `src/app/(frontend)/(organizer)/dashboard/events/[id]/itinerary/page.tsx`
- `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/itinerary/page.tsx`
- `src/app/api/events/[id]/itinerary/route.ts` — GET + POST
- `src/app/api/events/[id]/itinerary/[entryId]/route.ts` — PATCH + DELETE

**Modified files:**

- `src/lib/supabase/types.ts` — add `event_itinerary` table types
- `src/app/(frontend)/(participant)/events/[id]/page.tsx` — fetch itinerary + render `EventItinerary`
- `src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx` — add itinerary link
- `src/app/(frontend)/(organizer)/dashboard/clubs/[slug]/events/[id]/page.tsx` — add itinerary link

---

## Out of Scope

- No description field per entry (Time + Title only)
- No per-entry location field
- No AI-generated itinerary suggestions
- No itinerary on the print page (can be added later)
