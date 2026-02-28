# Event Overlap Prevention Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prevent organizers from creating overlapping events and participants from booking overlapping events, with time-aware detection that allows same-day events with non-overlapping time ranges.

**Architecture:** Extract overlap detection into a shared utility (`src/lib/events/overlap.ts`). Add server-side checks in the event creation/update API and booking API. No schema changes — reuse existing `date` (start datetime) and `end_date` (optional end datetime). Frontend error display works automatically via existing `data.error` extraction in both forms.

**Tech Stack:** TypeScript, Next.js API routes, Supabase queries

---

### Task 1: Create the overlap detection utility

**Files:**

- Create: `src/lib/events/overlap.ts`

**Step 1: Create the utility file**

Create `src/lib/events/overlap.ts` with two functions:

```typescript
/**
 * Computes the effective end datetime for an event.
 * If end_date is set, use it. Otherwise, assume the event runs from start time to end of day.
 */
export function getEffectiveEnd(date: string, endDate: string | null): Date {
  if (endDate) {
    return new Date(endDate);
  }
  // No end date — block from start time to end of the same day
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Checks if two time ranges overlap.
 * Uses strict < comparison so touching boundaries (A ends at 12:00, B starts at 12:00) are allowed.
 */
export function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA < endB && startB < endA;
}

export interface OverlappingEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
}

/**
 * Finds any event from the given list that overlaps with the specified time range.
 * Returns the first overlapping event, or null if none overlap.
 */
export function findOverlappingEvent(
  targetDate: string,
  targetEndDate: string | null,
  existingEvents: OverlappingEvent[],
  excludeEventId?: string,
): OverlappingEvent | null {
  const targetStart = new Date(targetDate);
  const targetEnd = getEffectiveEnd(targetDate, targetEndDate);

  for (const event of existingEvents) {
    if (excludeEventId && event.id === excludeEventId) continue;

    const eventStart = new Date(event.date);
    const eventEnd = getEffectiveEnd(event.date, event.end_date);

    if (rangesOverlap(targetStart, targetEnd, eventStart, eventEnd)) {
      return event;
    }
  }

  return null;
}

/**
 * Formats a date for display in overlap error messages.
 */
export function formatOverlapDate(date: string, endDate: string | null): string {
  const start = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  const startStr = start.toLocaleDateString("en-US", options);

  if (endDate) {
    const end = new Date(endDate);
    const endStr = end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${startStr} – ${endStr}`;
  }
  return startStr;
}
```

**Step 2: Verify the file compiles**

Run: `pnpm typecheck`
Expected: PASS (no type errors)

**Step 3: Commit**

```bash
git add src/lib/events/overlap.ts
git commit -m "feat: add event overlap detection utility"
```

---

### Task 2: Add overlap check to event creation API

**Files:**

- Modify: `src/app/(frontend)/api/events/route.ts` (insert between line 294 and line 296)

**Step 1: Add the overlap import and check**

At the top of the file, add the import:

```typescript
import { findOverlappingEvent, formatOverlapDate } from "@/lib/events/overlap";
```

Then, between the coordinates logic (line 294) and the insert query (line 296), add:

```typescript
// Check for overlapping events by this organizer
const { data: organizerEvents } = await supabase
  .from("events")
  .select("id, title, date, end_date")
  .eq("organizer_id", profile.id)
  .in("status", ["draft", "published"]);

if (organizerEvents) {
  const overlap = findOverlappingEvent(body.date, body.end_date || null, organizerEvents);
  if (overlap) {
    return NextResponse.json(
      {
        error: `Cannot create this event — it overlaps with your event "${overlap.title}" on ${formatOverlapDate(overlap.date, overlap.end_date)}. Adjust the date/time or update the other event first.`,
      },
      { status: 409 },
    );
  }
}
```

**Step 2: Verify the file compiles**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS (no lint errors)

**Step 4: Commit**

```bash
git add src/app/(frontend)/api/events/route.ts
git commit -m "feat: prevent organizers from creating overlapping events"
```

---

### Task 3: Add overlap check to event update API

**Files:**

- Modify: `src/app/(frontend)/api/events/[id]/route.ts` (insert between line 46 and line 48)

**Step 1: Add the overlap import and check**

At the top of the file, add the import:

```typescript
import { findOverlappingEvent, formatOverlapDate } from "@/lib/events/overlap";
```

In the `PUT` handler, between the coordinates logic (line 46) and the update query (line 48), add:

```typescript
// Check for overlapping events by this organizer (when date is being changed)
if (body.date) {
  // Get the organizer_id for this event
  const { data: currentEvent } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", id)
    .single();

  if (currentEvent) {
    const { data: organizerEvents } = await supabase
      .from("events")
      .select("id, title, date, end_date")
      .eq("organizer_id", currentEvent.organizer_id)
      .in("status", ["draft", "published"]);

    if (organizerEvents) {
      const overlap = findOverlappingEvent(
        body.date,
        body.end_date !== undefined ? body.end_date : null,
        organizerEvents,
        id, // exclude the event being updated
      );
      if (overlap) {
        return NextResponse.json(
          {
            error: `Cannot update this event — it would overlap with your event "${overlap.title}" on ${formatOverlapDate(overlap.date, overlap.end_date)}. Adjust the date/time or update the other event first.`,
          },
          { status: 409 },
        );
      }
    }
  }
}
```

**Step 2: Verify the file compiles**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/(frontend)/api/events/[id]/route.ts
git commit -m "feat: prevent organizers from updating events to overlap"
```

---

### Task 4: Add overlap check to booking API

**Files:**

- Modify: `src/app/(frontend)/api/bookings/route.ts` (insert after line 77, before line 79)

**Step 1: Add the overlap import and check**

At the top of the file, add the import:

```typescript
import { findOverlappingEvent, formatOverlapDate } from "@/lib/events/overlap";
```

After the event exists check (line 77) and before the capacity check (line 79), add:

```typescript
// Check for overlapping bookings by this participant
const { data: userBookings } = await supabase
  .from("bookings")
  .select("event_id")
  .eq("user_id", user.id)
  .in("status", ["pending", "confirmed"]);

if (userBookings && userBookings.length > 0) {
  const bookedEventIds = userBookings.map((b) => b.event_id);
  const { data: bookedEvents } = await supabase
    .from("events")
    .select("id, title, date, end_date")
    .in("id", bookedEventIds)
    .in("status", ["published"]);

  if (bookedEvents) {
    const overlap = findOverlappingEvent(event.date, event.end_date, bookedEvents);
    if (overlap) {
      return NextResponse.json(
        {
          error: `You can't book this event — you already have "${overlap.title}" on ${formatOverlapDate(overlap.date, overlap.end_date)}. Cancel that booking first if you'd like to join this one instead.`,
        },
        { status: 409 },
      );
    }
  }
}
```

**Step 2: Verify the file compiles**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/(frontend)/api/bookings/route.ts
git commit -m "feat: prevent participants from booking overlapping events"
```

---

### Task 5: Build and final verification

**Step 1: Run full type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 2: Run full lint**

Run: `pnpm lint`
Expected: PASS

**Step 3: Run production build**

Run: `pnpm build`
Expected: PASS — no build errors

**Step 4: Commit any remaining changes**

If format/lint auto-fixed anything:

```bash
git add -A
git commit -m "chore: lint/format fixes"
```
