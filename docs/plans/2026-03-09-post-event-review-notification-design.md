# Post-Event Review Notification

## Problem

When an event is marked as complete, participants receive a review request email but no in-app notification. There's no streamlined path to leave a quick review — users must manually navigate to the event page.

## Solution

Add a `review_request` notification type and a dedicated lightweight review page at `/events/[id]/review`. When an event completes, all checked-in participants get an in-app notification linking directly to the review page.

## Design

### Notification Creation

Triggered inside `onEventCompleted()` (in `src/lib/badges/award-event-badge.ts`), alongside existing badge and email logic:

1. Query checked-in participants from `event_checkins` (non-guest users)
2. Filter out users who already reviewed the event
3. Batch-create `review_request` notifications via `createNotifications()`:
   - **title:** "How was {event_name}?"
   - **body:** "Share your experience and help other adventurers!"
   - **href:** `/events/{event_id}/review`
   - **actor_id:** organizer's user ID
   - **metadata:** `{ event_id, club_slug }`

### Type Change

Add `"review_request"` to the notification type union in `src/lib/supabase/types.ts`.

### Review Page

New page: `src/app/(frontend)/(participant)/events/[id]/review/page.tsx`

**Content:**

- Event summary card (cover photo, name, date, activity type)
- Lightweight review form:
  - Star rating (1-5, required, large tappable stars)
  - Text input (optional, 500 char max)
  - Optional single photo upload
  - Submit button

**Guards:**

- Authenticated user required (redirect to login if not)
- Event must have status `"completed"`
- User must have `event_checkins` record
- If already reviewed: show existing review with "already reviewed" message

**Post-submit:**

- Success toast
- Redirect to `/feed`

### Notification UI

Add `review_request` case to `NotificationItem.tsx`:

- Star icon
- Click navigates to `/events/[id]/review` via `href`

### Data Flow

```
Event marked complete
  → onEventCompleted()
    → (existing) award badges + send emails
    → (new) create review_request notifications
      → User sees notification in bell dropdown
        → Click → /events/[id]/review
          → Submit lightweight review
            → Success → redirect /feed
```

## Non-Goals

- No modal or bottom sheet — always a dedicated page
- No changes to the existing full ReviewForm on the event detail page
- No push notification changes (existing email covers external reach)
