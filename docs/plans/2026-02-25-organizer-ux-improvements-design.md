# Organizer UX Improvements Design

**Date:** 2026-02-25

## Goals

1. Redirect organizers to `/dashboard` after login
2. Support multi-day events with a visual calendar date picker
3. Fix publish button to show loading state and feedback

## 1. Organizer Login Redirect

After `signInWithPassword` succeeds in `login/page.tsx`, query `users.role`. If `"organizer"`, redirect to `/dashboard`. Otherwise, redirect to `/events`.

**Files:** `src/app/(frontend)/(auth)/login/page.tsx`

## 2. Multi-Day Events

### Database

- Add nullable `end_date` (timestamptz) column to `events` table
- Single-day events: `end_date` is null
- Multi-day events: `date` = start, `end_date` = end

### Date Picker

- Replace native `datetime-local` with `react-day-picker` (range selection mode)
- Separate time input for start/meet-up time
- Clicking one date = single-day; clicking start then end = multi-day range

### API Changes

- `POST /api/events` and `PATCH /api/events/[id]` accept optional `end_date`
- Guide availability check considers full date range

### Display Updates

- Event cards, detail page, booking page, my-events: show "Feb 25 - Feb 27" for multi-day events
- Supabase types: add `end_date` to events type

**Files:**

- `src/lib/supabase/types.ts` — add `end_date`
- `src/components/dashboard/EventForm.tsx` — calendar + time input
- `src/app/(frontend)/api/events/route.ts` — handle `end_date` on create
- `src/app/(frontend)/api/events/[id]/route.ts` — handle `end_date` on update
- Display components (event cards, detail, booking, my-events) — date range rendering

## 3. Publish Button

Convert server action to client-side button with:

- Loading spinner + "Publishing..." text
- Button disabled during request
- `router.refresh()` on success
- Inline error message on failure

**Files:** `src/app/(frontend)/(organizer)/dashboard/events/[id]/page.tsx` — extract publish into a client component
