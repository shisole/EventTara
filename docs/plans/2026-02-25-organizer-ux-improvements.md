# Organizer UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redirect organizers to dashboard on login, support multi-day events with a visual calendar, and fix the publish button to show loading feedback.

**Architecture:** Three independent changes — login redirect (client-side role check), multi-day events (new DB column + react-day-picker + display updates), publish button (extract to client component with loading state).

**Tech Stack:** Next.js 15, React 19, Supabase, react-day-picker, Tailwind CSS

---

### Task 1: Organizer Login Redirect

**Files:**

- Modify: `src/app/(frontend)/(auth)/login/page.tsx:29-37`

**Step 1: Update handleEmailLogin to check role after sign-in**

After `signInWithPassword` succeeds (line 34), query the user's role and redirect accordingly:

```tsx
} else {
  // Check if user is an organizer
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "organizer") {
      router.push("/dashboard");
    } else {
      router.push("/events");
    }
  } else {
    router.push("/events");
  }
  router.refresh();
}
```

**Step 2: Manually test**

- Log in as organizer → should go to `/dashboard`
- Log in as participant → should go to `/events`

**Step 3: Commit**

```bash
git add src/app/(frontend)/(auth)/login/page.tsx
git commit -m "feat: redirect organizers to dashboard after login"
```

---

### Task 2: Database — Add end_date Column

**Files:**

- Modify: `src/lib/supabase/types.ts:69-115` (events type)

**Step 1: Add end_date column in Supabase Dashboard**

Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE events ADD COLUMN end_date timestamptz;
```

**Step 2: Update TypeScript types**

In `src/lib/supabase/types.ts`, add `end_date` to the events Row, Insert, and Update types:

- Row (after `date: string;`): `end_date: string | null;`
- Insert (after `date: string;`): `end_date?: string | null;`
- Update (after `date?: string;`): `end_date?: string | null;`

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add end_date column to events type"
```

---

### Task 3: Install react-day-picker

**Step 1: Install the package**

```bash
npm install react-day-picker
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install react-day-picker"
```

---

### Task 4: Build DateRangePicker Component

**Files:**

- Create: `src/components/ui/DateRangePicker.tsx`

**Step 1: Create the component**

Build a reusable `DateRangePicker` that wraps `react-day-picker` with:

- Props: `startDate`, `endDate`, `startTime`, `onStartDateChange`, `onEndDateChange`, `onStartTimeChange`
- Calendar in range mode — clicking one date sets start, clicking another sets end
- Clicking the same date for both start and end = single-day event
- A time input below the calendar for start/meet-up time (type="time")
- Styled to match the app's Tailwind theme (lime accent, rounded-xl, dark mode)
- `disabled` prop to prevent selecting past dates
- Clear button to reset the range

Use `react-day-picker`'s built-in `mode="range"` with `DateRange` type. Style overrides via Tailwind CSS classes on the `DayPicker` component (react-day-picker v9 supports `classNames` prop).

**Step 2: Commit**

```bash
git add src/components/ui/DateRangePicker.tsx
git commit -m "feat: add DateRangePicker component"
```

---

### Task 5: Update EventForm to Use DateRangePicker

**Files:**

- Modify: `src/components/dashboard/EventForm.tsx`

**Step 1: Replace the datetime-local input**

Replace the native `<Input type="datetime-local">` (lines 392-401) with the new `DateRangePicker`.

Update state:

- Replace `const [date, setDate]` with `const [startDate, setStartDate]`, `const [endDate, setEndDate]`, `const [startTime, setStartTime]`
- Initialize from `initialData.date` and `initialData.end_date`

Update `initialData` interface to include `end_date?: string | null`.

**Step 2: Update handleSubmit**

Combine `startDate` + `startTime` into an ISO string for `date`. Send `end_date` if it differs from `startDate` (otherwise null).

```tsx
const body = {
  ...otherFields,
  date: combineDateAndTime(startDate, startTime),
  end_date: endDate && endDate !== startDate ? new Date(endDate).toISOString() : null,
};
```

**Step 3: Update guide availability fetch**

The `useEffect` that fetches guides (lines 248-269) uses `date` to check availability. Update it to use `startDate`.

**Step 4: Commit**

```bash
git add src/components/dashboard/EventForm.tsx
git commit -m "feat: replace datetime-local with DateRangePicker in event form"
```

---

### Task 6: Update Event API Routes

**Files:**

- Modify: `src/app/(frontend)/api/events/route.ts:246-262` (POST)
- Modify: `src/app/(frontend)/api/events/[id]/route.ts:41-57` (PUT)

**Step 1: Update POST handler**

Add `end_date: body.end_date || null` to the insert object (after `date: body.date`).

**Step 2: Update PUT handler**

Add `end_date: body.end_date ?? undefined` to the update object. Use `?? undefined` so null explicitly clears it, but absence leaves it unchanged.

Actually simpler: just add `end_date: body.end_date !== undefined ? body.end_date : undefined` to only update when provided.

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/events/route.ts src/app/(frontend)/api/events/[id]/route.ts
git commit -m "feat: handle end_date in event create/update APIs"
```

---

### Task 7: Update Edit Page to Pass end_date

**Files:**

- Modify: `src/app/(frontend)/(organizer)/dashboard/events/[id]/edit/page.tsx`

**Step 1: Add end_date to initialData**

The edit page passes `initialData` to `EventForm`. Add `end_date: event.end_date` to the object.

**Step 2: Commit**

```bash
git add src/app/(frontend)/(organizer)/dashboard/events/[id]/edit/page.tsx
git commit -m "feat: pass end_date to EventForm on edit"
```

---

### Task 8: Create formatEventDate Utility

**Files:**

- Create: `src/lib/utils/format-date.ts`

**Step 1: Create a shared date formatting function**

```tsx
export function formatEventDate(
  date: string,
  endDate?: string | null,
  options?: { includeTime?: boolean; includeYear?: boolean },
): string;
```

Logic:

- Single-day (no `endDate` or same day): format as before (e.g., "Sat, Feb 25, 2026")
- Multi-day same month: "Feb 25 - 27, 2026"
- Multi-day different months: "Feb 25 - Mar 2, 2026"
- If `includeTime`, append time from `date`

This centralizes date formatting so all display components use one function.

**Step 2: Commit**

```bash
git add src/lib/utils/format-date.ts
git commit -m "feat: add formatEventDate utility for date range display"
```

---

### Task 9: Update Display Components

**Files:**

- Modify: `src/components/events/EventCard.tsx:55-60`
- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx:215-224`
- Modify: `src/components/participant/UpcomingBookings.tsx:118-122`
- Modify: `src/components/participant/PastEvents.tsx:51-55`
- Modify: `src/components/booking/BookingForm.tsx:150-154`
- Modify: `src/components/booking/BookingConfirmation.tsx:175-180`
- Modify: `src/components/dashboard/EventsTable.tsx:123-127`
- Modify: `src/app/(frontend)/(participant)/events/[id]/opengraph-image.tsx:57-62`

**Step 1: Update each component**

For each component, replace the inline `toLocaleDateString` call with `formatEventDate(date, endDate)`. Each component will need to receive/access `end_date` from its data source.

Key data flow updates:

- **EventCard**: receives `end_date` prop from parent (events list pages already fetch `*` from events)
- **Event detail page**: already fetches `select("*")`, so `end_date` is available
- **UpcomingBookings / PastEvents**: update the profile page query to select `events.end_date`
- **BookingForm / BookingConfirmation**: pass `endDate` prop from booking page
- **EventsTable**: already fetches `select("*")`
- **OG Image**: already fetches `select("*")`

**Step 2: Update the booking page server component**

Modify `src/app/(frontend)/(participant)/events/[id]/book/page.tsx` to select and pass `end_date` to `BookingPageClient`, which passes it to `BookingForm`.

**Step 3: Update the profile page query**

Modify `src/app/(frontend)/(participant)/profile/[username]/page.tsx` to include `end_date` in the events select and pass it through to `UpcomingBookings` and `PastEvents`.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: show date ranges for multi-day events across all display components"
```

---

### Task 10: Fix Publish Button

**Files:**

- Create: `src/components/dashboard/PublishButton.tsx`
- Modify: `src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx:66-92`

**Step 1: Create PublishButton client component**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";

export default function PublishButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePublish = async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to publish");
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handlePublish} disabled={loading}>
        {loading ? "Publishing..." : "Publish"}
      </Button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
```

**Step 2: Replace server action in event detail page**

Remove the `handlePublish` server action (lines 66-70). Replace the `<form action={handlePublish}>` block (lines 88-92) with:

```tsx
{
  event.status === "draft" && <PublishButton eventId={id} />;
}
```

**Step 3: Manually test**

- Create a draft event → click Publish → should show "Publishing..." → page refreshes with "published" badge
- If API fails → should show error message

**Step 4: Commit**

```bash
git add src/components/dashboard/PublishButton.tsx src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx
git commit -m "fix: publish button shows loading state and error feedback"
```

---

### Task 11: Update Seed Script (if needed)

**Files:**

- Modify: `scripts/seed.ts`

**Step 1: Add end_date to seeded multi-day events (optional)**

If any seed events should be multi-day, add `end_date` to their insert data. Otherwise, existing seed events stay single-day (end_date defaults to null).

**Step 2: Commit if changed**

```bash
git add scripts/seed.ts
git commit -m "chore: add multi-day event examples to seed data"
```

---

### Task 12: Final Testing & Cleanup

**Step 1: Run type check**

```bash
npx tsc --noEmit
```

**Step 2: Run build**

```bash
npm run build
```

**Step 3: Manual E2E test checklist**

- [ ] Login as organizer → lands on `/dashboard`
- [ ] Login as participant → lands on `/events`
- [ ] Create single-day event → calendar shows one selected date
- [ ] Create multi-day event → calendar shows date range
- [ ] Edit existing event → calendar pre-selects correct dates
- [ ] Event cards show date ranges correctly
- [ ] Event detail page shows date range
- [ ] Booking page shows date range
- [ ] Publish draft event → "Publishing..." shown → status updates
- [ ] Publish failure → error message shown

**Step 4: Final commit if any fixes needed**
