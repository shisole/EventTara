# Post-Event Review Notification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When an event is marked as complete, send in-app notifications to checked-in participants linking to a dedicated lightweight review page.

**Architecture:** Add `"review_request"` notification type, create review notifications inside `onEventCompleted()`, build a new `/events/[id]/review` server page with a lightweight client-side review form (stars + text + optional photo). Notification links directly to that page.

**Tech Stack:** Next.js 15 App Router, Supabase, existing notification/review infrastructure

---

### Task 1: Add `review_request` notification type

**Files:**

- Modify: `src/lib/supabase/types.ts` (notification type union, lines ~884, ~903, ~922)

**Step 1: Update the notification Row type**

In `src/lib/supabase/types.ts`, find the `notifications` table `Row` type's `type` field and add `"review_request"` to the union:

```typescript
type:
  | "booking_confirmed"
  | "event_reminder"
  | "badge_earned"
  | "border_earned"
  | "feed_like"
  | "feed_repost"
  | "feed_comment_like"
  | "feed_mention"
  | "review_request";
```

Do the same for the `Insert` and `Update` types (same union appears three times).

**Step 2: Update NotificationItem icon map**

In `src/components/notifications/NotificationItem.tsx`, add the new type to the `TYPE_ICONS` record (line ~26):

```typescript
const TYPE_ICONS: Record<NotificationRow["type"], string> = {
  booking_confirmed: "🎫",
  event_reminder: "📅",
  badge_earned: "🏅",
  border_earned: "🖼️",
  feed_like: "❤️",
  feed_repost: "🔁",
  feed_comment_like: "💬",
  feed_mention: "📣",
  review_request: "⭐",
};
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS — all existing code should still compile since we only widened the union.

**Step 4: Commit**

```bash
git add src/lib/supabase/types.ts src/components/notifications/NotificationItem.tsx
git commit -m "feat: add review_request notification type"
```

---

### Task 2: Create review notifications on event completion

**Files:**

- Modify: `src/lib/badges/award-event-badge.ts`

**Step 1: Add review notification creation to `onEventCompleted()`**

In `src/lib/badges/award-event-badge.ts`, add a new function `sendReviewRequestNotifications` and call it from `onEventCompleted()`.

After the existing `sendReviewRequestEmails` call (line 39), add:

```typescript
// Fire-and-forget: in-app review request notifications
sendReviewRequestNotifications(eventId, checkedInUserIds, supabase).catch(() => null);
```

Add the new function at the end of the file:

```typescript
/**
 * Fire-and-forget: create in-app review request notifications for checked-in participants.
 * Filters out guests and users who already reviewed the event.
 */
async function sendReviewRequestNotifications(
  eventId: string,
  userIds: string[],
  supabase: SupabaseClient<Database>,
) {
  if (userIds.length === 0) return;

  // Fetch event title and organizer
  const { data: event } = await supabase
    .from("events")
    .select("title, created_by")
    .eq("id", eventId)
    .single();

  if (!event) return;

  // Filter out guests
  const { data: nonGuestUsers } = await supabase
    .from("users")
    .select("id")
    .in("id", userIds)
    .eq("is_guest", false);

  if (!nonGuestUsers || nonGuestUsers.length === 0) return;

  const nonGuestIds = nonGuestUsers.map((u) => u.id);

  // Filter out users who already reviewed
  const { data: existingReviews } = await supabase
    .from("event_reviews")
    .select("user_id")
    .eq("event_id", eventId)
    .in("user_id", nonGuestIds);

  const reviewedSet = new Set((existingReviews ?? []).map((r) => r.user_id));
  const eligibleIds = nonGuestIds.filter((id) => !reviewedSet.has(id));

  if (eligibleIds.length === 0) return;

  createNotifications(
    supabase,
    eligibleIds.map((uid) => ({
      userId: uid,
      type: "review_request" as const,
      title: `How was ${event.title}?`,
      body: "Share your experience and help other adventurers!",
      href: `/events/${eventId}/review`,
      actorId: event.created_by,
      metadata: { event_id: eventId },
    })),
  ).catch(() => null);
}
```

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/badges/award-event-badge.ts
git commit -m "feat: send review_request notifications on event completion"
```

---

### Task 3: Build the lightweight review form component

**Files:**

- Create: `src/components/reviews/QuickReviewForm.tsx`

**Step 1: Create the QuickReviewForm component**

This is a lightweight "use client" form with star rating, optional text (500 chars), and optional photo upload. On success, redirects to `/feed`.

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ReviewPhotoUpload from "@/components/reviews/ReviewPhotoUpload";
import StarRating from "@/components/reviews/StarRating";
import { cn } from "@/lib/utils";

interface QuickReviewFormProps {
  eventId: string;
}

export default function QuickReviewForm({ eventId }: QuickReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          text: text.trim() || null,
          photos: photos.length > 0 ? photos : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Something went wrong" }));
        setError(data.error || "Failed to submit review");
        return;
      }

      router.push("/feed");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How would you rate this event?
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      {/* Optional Text */}
      <div>
        <label
          htmlFor="review-text"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Tell others about your experience{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="What made this event great? Any tips for future participants?"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{text.length}/500</p>
      </div>

      {/* Optional Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add photos <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <ReviewPhotoUpload photos={photos} onChange={setPhotos} disabled={loading} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || rating === 0}
        className={cn(
          "w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors",
          rating > 0
            ? "bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed",
          loading && "opacity-50 cursor-not-allowed",
        )}
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
```

**Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/reviews/QuickReviewForm.tsx
git commit -m "feat: add QuickReviewForm component for post-event reviews"
```

---

### Task 4: Build the review page

**Files:**

- Create: `src/app/(frontend)/(participant)/events/[id]/review/page.tsx`

**Step 1: Create the review page**

This is a server component page that:

1. Validates auth, event status, and check-in
2. Checks if already reviewed
3. Renders event summary card + QuickReviewForm

```tsx
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import QuickReviewForm from "@/components/reviews/QuickReviewForm";
import { createClient } from "@/lib/supabase/server";
import { cdnUrl } from "@/lib/storage";
import { formatEventDate } from "@/lib/utils/format-date";

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("title").eq("id", id).single();

  return { title: event ? `Review ${event.title}` : "Review Event" };
}

export default async function EventReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/events/${id}/review`);
  }

  // Fetch event
  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, type, cover_image_url, status, location")
    .eq("id", id)
    .single();

  if (!event || event.status !== "completed") {
    notFound();
  }

  // Check if user checked in
  const { data: checkin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .single();

  if (!checkin) {
    notFound();
  }

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from("event_reviews")
    .select("id, rating, text, created_at")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .single();

  const coverUrl = event.cover_image_url ? cdnUrl(event.cover_image_url) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Event Summary Card */}
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-950/20 mb-6">
          {coverUrl && (
            <div className="relative h-40 w-full">
              <Image
                src={coverUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
              />
            </div>
          )}
          <div className="p-4">
            <span className="inline-block rounded-full bg-teal-50 dark:bg-teal-950/30 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300 mb-2">
              {typeLabels[event.type] || event.type}
            </span>
            <h1 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
              {event.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatEventDate(event.date)}
              {event.location && ` · ${event.location}`}
            </p>
          </div>
        </div>

        {/* Review Section */}
        {existingReview ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-950/20 p-6 text-center">
            <div className="text-3xl mb-2">&#9989;</div>
            <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-1">
              You&apos;ve already reviewed this event
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Thanks for sharing your experience!
            </p>
            <Link
              href={`/events/${id}`}
              className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              View event &rarr;
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-950/20 p-6">
            <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-4">
              How was your experience?
            </h2>
            <QuickReviewForm eventId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Run typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/events/\[id\]/review/page.tsx
git commit -m "feat: add dedicated review page at /events/[id]/review"
```

---

### Task 5: Verify end-to-end flow

**Step 1: Run full lint and typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS

**Step 2: Run existing tests**

Run: `pnpm test`
Expected: All existing tests pass (no regressions)

**Step 3: Build**

Run: `pnpm build`
Expected: PASS — no build errors

**Step 4: Final commit (if any formatting/lint fixes needed)**

```bash
git add -A
git commit -m "chore: lint and format fixes for review notification feature"
```

---

## Summary of Changes

| File                                                           | Change                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/lib/supabase/types.ts`                                    | Add `"review_request"` to notification type union (3 places)                    |
| `src/components/notifications/NotificationItem.tsx`            | Add star emoji for `review_request` type                                        |
| `src/lib/badges/award-event-badge.ts`                          | Add `sendReviewRequestNotifications()` function, call from `onEventCompleted()` |
| `src/components/reviews/QuickReviewForm.tsx`                   | New lightweight review form (stars + text + photos)                             |
| `src/app/(frontend)/(participant)/events/[id]/review/page.tsx` | New review page with event summary card                                         |

## Database Changes

Add `"review_request"` to the `notifications.type` column's allowed values in Supabase. This may require a migration or updating the check constraint if one exists. If the column is just a `text` type without a check constraint, no database change is needed — only the TypeScript types need updating.
