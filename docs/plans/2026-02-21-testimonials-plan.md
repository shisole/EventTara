# Testimonials & Event Reviews Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add curated app testimonials on the landing page and user-submitted event reviews with star ratings throughout the platform.

**Architecture:** Two new Supabase tables (`app_testimonials`, `event_reviews`). App testimonials are admin-managed rows displayed on the landing page. Event reviews are submitted by checked-in participants via the badge page (primary) or event detail page (fallback). Reviews display on event detail pages, organizer profiles, and as rating badges on EventCards.

**Tech Stack:** Next.js 15 App Router, Supabase, React, TypeScript, Tailwind CSS

---

### Task 1: Add database types for both tables

**Files:**

- Modify: `src/lib/supabase/types.ts`

**Step 1: Add `app_testimonials` type after `event_checkins` (after line 296)**

Add this inside `Tables: {` before the closing `}`:

```typescript
      app_testimonials: {
        Row: {
          id: string
          name: string
          role: string
          text: string
          avatar_url: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          text: string
          avatar_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          text?: string
          avatar_url?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      event_reviews: {
        Row: {
          id: string
          event_id: string
          user_id: string
          rating: number
          text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          rating: number
          text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          rating?: number
          text?: string | null
          created_at?: string
        }
        Relationships: []
      }
```

**Step 2: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add app_testimonials and event_reviews types"
```

---

### Task 2: Create Supabase tables via SQL

**Files:**

- Create: `supabase/migrations/20260221_testimonials_and_reviews.sql`

**Step 1: Write the migration SQL**

```sql
-- App testimonials (curated by admin)
CREATE TABLE IF NOT EXISTS public.app_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  avatar_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active testimonials"
  ON public.app_testimonials FOR SELECT
  USING (is_active = true);

-- Event reviews (user-submitted)
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.event_reviews FOR SELECT
  USING (true);

CREATE POLICY "Checked-in users can insert their own review"
  ON public.event_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.event_checkins
      WHERE event_checkins.event_id = event_reviews.event_id
      AND event_checkins.user_id = auth.uid()
    )
  );

CREATE INDEX idx_event_reviews_event_id ON public.event_reviews(event_id);
CREATE INDEX idx_event_reviews_user_id ON public.event_reviews(user_id);
```

**Step 2: Run the migration against local Supabase**

The migration file is for documentation/CI. For local dev, run the SQL directly against the Supabase dashboard SQL editor or via `supabase db push` if using the CLI.

**Step 3: Commit**

```bash
git add supabase/migrations/20260221_testimonials_and_reviews.sql
git commit -m "feat: add app_testimonials and event_reviews tables"
```

---

### Task 3: App Testimonials section on landing page

**Files:**

- Modify: `src/app/(frontend)/page.tsx`

**Step 1: Fetch app testimonials in the data query**

In the `Home` component, add to the `Promise.all` array (around line 63-85):

```typescript
supabase
  .from("app_testimonials")
  .select("id, name, role, text, avatar_url")
  .eq("is_active", true)
  .order("display_order", { ascending: true })
  .limit(6),
```

Destructure as `{ data: testimonials }` alongside the existing results.

**Step 2: Add testimonials section**

Insert a new section between "Trusted by Organizers" and "Organizer CTA" (after line 291, before line 293). The section:

```tsx
{
  /* Participant Testimonials */
}
{
  testimonials && testimonials.length > 0 && (
    <section className="py-20 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4">
          What Adventurers Say
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Hear from the community that makes EventTara special.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t: any) => (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-gray-950/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-900/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {t.avatar_url ? (
                    <Image
                      src={t.avatar_url}
                      alt={t.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-lime-600 dark:text-lime-400 font-bold text-sm">
                      {t.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/(frontend)/page.tsx
git commit -m "feat: add app testimonials section to landing page"
```

---

### Task 4: Event review API endpoint

**Files:**

- Create: `src/app/(frontend)/api/events/[id]/reviews/route.ts`

**Step 1: Create the API route**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rating, text } = await request.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  // Verify the event exists and is completed
  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.status !== "completed") {
    return NextResponse.json(
      { error: "Reviews can only be left for completed events" },
      { status: 400 },
    );
  }

  // Verify user has a check-in for this event
  const { data: checkin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (!checkin) {
    return NextResponse.json(
      { error: "Only checked-in participants can leave reviews" },
      { status: 403 },
    );
  }

  // Check for existing review
  const { data: existing } = await supabase
    .from("event_reviews")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this event" }, { status: 400 });
  }

  const { data: review, error } = await supabase
    .from("event_reviews")
    .insert({
      event_id: eventId,
      user_id: user.id,
      rating: Math.round(rating) as number,
      text: text?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("event_reviews")
    .select("id, rating, text, created_at, users(full_name, avatar_url, username)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ reviews: reviews || [] });
}
```

**Step 2: Commit**

```bash
git add src/app/(frontend)/api/events/[id]/reviews/route.ts
git commit -m "feat: add event reviews API endpoint"
```

---

### Task 5: StarRating component

**Files:**

- Create: `src/components/reviews/StarRating.tsx`

**Step 1: Create a reusable star rating display + input component**

```tsx
"use client";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

const sizes = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };

export default function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  return (
    <div className={cn("flex gap-0.5", sizes[size])}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            star <= value ? "text-yellow-400" : "text-gray-300 dark:text-gray-600",
          )}
        >
          &#9733;
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/reviews/StarRating.tsx
git commit -m "feat: add StarRating component"
```

---

### Task 6: ReviewForm component

**Files:**

- Create: `src/components/reviews/ReviewForm.tsx`

**Step 1: Create the review form**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import StarRating from "./StarRating";

interface ReviewFormProps {
  eventId: string;
  onSubmitted?: () => void;
}

export default function ReviewForm({ eventId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ rating, text: text.trim() || null }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setSubmitted(true);
        onSubmitted?.();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-lg font-medium text-gray-900 dark:text-white">Thanks for your review!</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your feedback helps the community.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          How was your experience?
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your experience (optional)"
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400"
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={loading || rating === 0} size="sm">
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/reviews/ReviewForm.tsx
git commit -m "feat: add ReviewForm component"
```

---

### Task 7: ReviewList component

**Files:**

- Create: `src/components/reviews/ReviewList.tsx`

**Step 1: Create the review list display**

```tsx
import Image from "next/image";
import Link from "next/link";
import StarRating from "./StarRating";

interface Review {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  users: {
    full_name: string;
    avatar_url: string | null;
    username: string | null;
  };
}

interface ReviewListProps {
  reviews: Review[];
  averageRating?: number;
}

export default function ReviewList({ reviews, averageRating }: ReviewListProps) {
  if (reviews.length === 0) return null;

  const avg = averageRating ?? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <StarRating value={Math.round(avg)} readonly size="md" />
        <span className="font-bold text-gray-900 dark:text-white">{avg.toFixed(1)}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
        </span>
      </div>
      <div className="space-y-4">
        {reviews.map((review) => {
          const user = review.users;
          return (
            <div
              key={review.id}
              className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.full_name}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {user.username ? (
                    <Link
                      href={`/profile/${user.username}`}
                      className="text-sm font-medium hover:text-lime-600 dark:hover:text-lime-400"
                    >
                      {user.full_name}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium">{user.full_name}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} readonly size="sm" />
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(review.created_at).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              {review.text && (
                <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">{review.text}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/reviews/ReviewList.tsx
git commit -m "feat: add ReviewList component"
```

---

### Task 8: Add reviews to event detail page

**Files:**

- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx`

**Step 1: Fetch reviews and check-in status in the server component**

Add these queries after the existing badge/user queries (after line 129):

```typescript
// Fetch event reviews
const { data: reviews } = await supabase
  .from("event_reviews")
  .select("id, rating, text, created_at, users(full_name, avatar_url, username)")
  .eq("event_id", id)
  .order("created_at", { ascending: false });

const eventReviews = (reviews || []) as any[];
const avgRating =
  eventReviews.length > 0
    ? eventReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / eventReviews.length
    : 0;

// Check if current user can review (checked in + hasn't reviewed)
let canReview = false;
let hasReviewed = false;
if (authUser && event.status === "completed") {
  const { data: userCheckin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", id)
    .eq("user_id", authUser.id)
    .single();

  if (userCheckin) {
    const existingReview = eventReviews.find((r: any) => r.user_id === authUser.id);
    hasReviewed = !!existingReview;
    canReview = !hasReviewed;
  }
}
```

Note: also need to add `user_id` to the reviews select: `"id, rating, text, created_at, user_id, users(full_name, avatar_url, username)"`.

**Step 2: Import ReviewForm and ReviewList**

Add imports at the top:

```typescript
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
```

**Step 3: Add review section in the main content area**

After `<EventGallery photos={photos || []} />` (after line 171), add:

```tsx
{
  /* Reviews Section */
}
{
  (eventReviews.length > 0 || canReview) && (
    <div>
      <h2 className="text-xl font-heading font-bold mb-4">Reviews</h2>
      {canReview && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-5 mb-6">
          <ReviewForm eventId={id} />
        </div>
      )}
      <ReviewList reviews={eventReviews} averageRating={avgRating} />
    </div>
  );
}
```

**Step 4: Add average rating in the sidebar price section**

After the spots left display (around line 189), add a rating display if reviews exist:

```tsx
{
  avgRating > 0 && (
    <div className="text-center text-sm">
      <span className="text-yellow-400">&#9733;</span>{" "}
      <span className="font-medium text-gray-700 dark:text-gray-300">{avgRating.toFixed(1)}</span>
      <span className="text-gray-400 dark:text-gray-500">
        {" "}
        ({eventReviews.length} review{eventReviews.length !== 1 ? "s" : ""})
      </span>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add src/app/(frontend)/(participant)/events/[id]/page.tsx
git commit -m "feat: add reviews section to event detail page"
```

---

### Task 9: Add review form to badge page

**Files:**

- Modify: `src/app/(frontend)/(participant)/badges/[id]/page.tsx`

**Step 1: Fetch check-in and existing review status**

After the `userBadges` query (after line 73), add:

```typescript
// Check if current user can review the event
const {
  data: { user: authUser },
} = await supabase.auth.getUser();

let canReview = false;
let hasReviewed = false;
if (authUser && event) {
  // Check event is completed
  const { data: fullEvent } = await supabase
    .from("events")
    .select("status")
    .eq("id", event.id)
    .single();

  if (fullEvent?.status === "completed") {
    const { data: checkin } = await supabase
      .from("event_checkins")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", authUser.id)
      .single();

    if (checkin) {
      const { data: existingReview } = await supabase
        .from("event_reviews")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", authUser.id)
        .single();

      hasReviewed = !!existingReview;
      canReview = !hasReviewed;
    }
  }
}
```

**Step 2: Import ReviewForm**

```typescript
import ReviewForm from "@/components/reviews/ReviewForm";
```

**Step 3: Add review form section**

After the "Earned By" section (after line 213), before the "Back link", add:

```tsx
{
  /* Leave a Review */
}
{
  canReview && event && (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
      <h2 className="text-lg font-heading font-bold mb-4 text-center">How was {event.title}?</h2>
      <ReviewForm eventId={event.id} />
    </div>
  );
}

{
  hasReviewed && (
    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
      You&apos;ve already reviewed this event. Thanks!
    </p>
  );
}
```

**Step 4: Commit**

```bash
git add src/app/(frontend)/(participant)/badges/[id]/page.tsx
git commit -m "feat: add review form to badge page"
```

---

### Task 10: Add review CTA to badge award email

**Files:**

- Modify: `src/lib/email/templates/badge-awarded.ts`
- Modify: `src/app/(frontend)/api/badges/award/route.ts`

**Step 1: Update the email template to accept `badgeId`**

Add `badgeId: string;` to the `BadgeAwardedProps` interface and destructure it.

**Step 2: Add a "Leave a Review" CTA button**

After the existing "View Your Badges" CTA button (after line 62), add:

```html
<div style="margin-top:16px;">
  <a
    href="https://eventtara.com/badges/${badgeId}"
    style="display:inline-block;background-color:transparent;color:#2D5A3D;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;border:2px solid #2D5A3D;"
  >
    Leave a Review
  </a>
</div>
```

**Step 3: Pass `badgeId` from the award API**

In `src/app/(frontend)/api/badges/award/route.ts`, update the `badgeAwardedHtml` call (around line 57) to include `badgeId: badge_id`.

**Step 4: Commit**

```bash
git add src/lib/email/templates/badge-awarded.ts src/app/(frontend)/api/badges/award/route.ts
git commit -m "feat: add review CTA to badge award email"
```

---

### Task 11: Add aggregate rating to organizer profile

**Files:**

- Modify: `src/app/(frontend)/(participant)/organizers/[id]/page.tsx`

**Step 1: Fetch aggregate reviews for organizer's events**

After the badges query (after line 100), add:

```typescript
// Fetch aggregate review stats for organizer's events
let avgRating = 0;
let totalReviews = 0;
let recentReviews: any[] = [];

if (eventIds.length > 0) {
  const { data: reviewData } = await supabase
    .from("event_reviews")
    .select(
      "id, rating, text, created_at, event_id, users(full_name, avatar_url, username), events(title)",
    )
    .in("event_id", eventIds)
    .order("created_at", { ascending: false })
    .limit(5);

  const allReviews = reviewData || [];
  totalReviews = allReviews.length;

  if (totalReviews > 0) {
    avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews;
  }

  // For display, get a total count (limit(5) above is just for recent display)
  const { count: reviewCount } = await supabase
    .from("event_reviews")
    .select("*", { count: "exact", head: true })
    .in("event_id", eventIds);
  totalReviews = reviewCount || 0;

  // Recalculate avg from all reviews if count differs
  if (totalReviews > 0 && totalReviews !== allReviews.length) {
    // Use the limited set avg as approximation, or fetch all ratings
    const { data: allRatings } = await supabase
      .from("event_reviews")
      .select("rating")
      .in("event_id", eventIds);
    if (allRatings && allRatings.length > 0) {
      avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
    }
  }

  recentReviews = allReviews;
}
```

**Step 2: Import review components**

```typescript
import StarRating from "@/components/reviews/StarRating";
```

**Step 3: Add reviews section in the page**

After the Badges section (after line 188), before the footer CTA, add:

```tsx
{
  /* Reviews */
}
{
  totalReviews > 0 && (
    <div>
      <h2 className="text-xl font-heading font-bold mb-4 text-center">Reviews</h2>
      <div className="flex items-center justify-center gap-3 mb-6">
        <StarRating value={Math.round(avgRating)} readonly size="md" />
        <span className="font-bold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({totalReviews} review{totalReviews !== 1 ? "s" : ""} across events)
        </span>
      </div>
      <div className="space-y-4">
        {recentReviews.map((review: any) => (
          <div
            key={review.id}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <StarRating value={review.rating} readonly size="sm" />
              <span className="text-xs text-gray-400 dark:text-gray-500">
                for {review.events?.title || "Event"}
              </span>
            </div>
            {review.text && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{review.text}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {review.users?.full_name || "Participant"} &middot;{" "}
              {new Date(review.created_at).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Update OrganizerStats to include rating**

Pass `avgRating` and `totalReviews` to OrganizerStats component. This requires modifying `src/components/organizers/OrganizerStats.tsx` to accept and display optional rating stats. Add a new stat card for average rating if reviews exist.

**Step 5: Commit**

```bash
git add src/app/(frontend)/(participant)/organizers/[id]/page.tsx src/components/organizers/OrganizerStats.tsx
git commit -m "feat: add aggregate reviews to organizer profile"
```

---

### Task 12: Add rating badge to EventCard

**Files:**

- Modify: `src/components/events/EventCard.tsx`

**Step 1: Add optional `avg_rating` and `review_count` props**

Add to the `EventCardProps` interface:

```typescript
avg_rating?: number;
review_count?: number;
```

**Step 2: Display rating in the card footer**

In the bottom section (around line 103-115), add a rating display when reviews exist. Between the price and spots left, or below the location:

```tsx
{
  avg_rating && avg_rating > 0 && review_count && review_count > 0 && (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-yellow-400">&#9733;</span>
      <span className="font-medium text-gray-700 dark:text-gray-300">{avg_rating.toFixed(1)}</span>
      <span className="text-gray-400 dark:text-gray-500">({review_count})</span>
    </div>
  );
}
```

**Step 3: Pass rating data from pages that use EventCard**

This requires updating the event queries on pages that render EventCards to join review data. For the landing page and organizer profile, fetch review stats alongside events.

On the landing page (`page.tsx`), update the events query to include review aggregation. Since Supabase doesn't support computed aggregates in select, this will be done client-side: fetch all reviews for the event IDs and compute averages.

Alternatively, keep it simple — only show ratings on the event detail page and organizer profile for now, skip EventCard ratings to avoid complex queries on listing pages.

**Decision: Skip EventCard rating badges for now.** The rating is visible on the event detail page and organizer profile. Adding it to EventCards would require fetching review data on every listing page, adding query complexity. This can be added later if needed.

Revert this task to just adding the props (forward-compatible) without passing data yet.

**Step 4: Commit**

```bash
git add src/components/events/EventCard.tsx
git commit -m "feat: add optional rating props to EventCard"
```

---

### Task 13: Seed data for testimonials and reviews

**Files:**

- Modify: `scripts/seed.ts`

**Step 1: Add app testimonials data**

After the `COMPANION_DEFS` array, add:

```typescript
const APP_TESTIMONIALS = [
  {
    name: "Miguel Pascual",
    role: "Trail Runner",
    text: "EventTara made it so easy to find trail running events near me. I've joined three events already and met amazing people along the way!",
    avatar_url: null,
    display_order: 1,
  },
  {
    name: "Rina Aquino",
    role: "Mountain Biker",
    text: "As someone new to MTB, I was nervous about joining group rides. EventTara's booking system was seamless, and the organizers were so welcoming.",
    avatar_url: null,
    display_order: 2,
  },
  {
    name: "Paolo Guerrero",
    role: "Hiking Enthusiast",
    text: "I love how I can track my adventure badges on EventTara. It's like a passport for outdoor adventures in the Philippines!",
    avatar_url: null,
    display_order: 3,
  },
  {
    name: "Camille Tan",
    role: "Road Cyclist",
    text: "Finally a platform that brings the PH cycling community together. The QR check-in system is super convenient for organizers and participants alike.",
    avatar_url: null,
    display_order: 4,
  },
];
```

**Step 2: Add event reviews data**

```typescript
interface ReviewDef {
  eventTitle: string;
  userEmail: string;
  rating: number;
  text: string;
}

const REVIEW_DEFS: ReviewDef[] = [
  {
    eventTitle: "Taal Volcano Day Hike",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Incredible views from the crater rim! The guide was knowledgeable and the pace was perfect for beginners.",
  },
  {
    eventTitle: "Taal Volcano Day Hike",
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Great hike overall. The boat ride was fun. Only wish we had more time at the summit.",
  },
  {
    eventTitle: "Mt. Pinatubo Crater Hike",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "The crater lake is even more beautiful in person. The 4x4 ride through the lahar fields was an adventure on its own!",
  },
  {
    eventTitle: "Mt. Pinatubo Crater Hike",
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Well organized event. The landscape is surreal. Bring sunscreen and lots of water!",
  },
  {
    eventTitle: "Bataan Death March Trail Run",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Deeply moving experience. The trail was challenging but the historical significance made every step meaningful.",
  },
  {
    eventTitle: "Clark-Subic Gran Fondo",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Solid event. The route through Bataan is beautiful. Aid stations were well-stocked.",
  },
  {
    eventTitle: "Clark-Subic Gran Fondo",
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Best gran fondo I've done in the PH. Perfect organization and the post-ride BBQ was amazing!",
  },
  {
    eventTitle: "Corregidor Island MTB Ride",
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Riding through WWII ruins on a mountain bike — what an experience! Highly recommend.",
  },
  {
    eventTitle: "Quezon City Fun Run 5K",
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Perfect for beginners! The route through Memorial Circle was scenic and well-marked.",
  },
];
```

**Step 3: Add `seedAppTestimonials` function**

```typescript
async function seedAppTestimonials() {
  log("💬", "Creating app testimonials...");

  for (const t of APP_TESTIMONIALS) {
    const { error } = await supabase.from("app_testimonials").insert(t);
    if (error) {
      console.error(`  Failed to create testimonial for "${t.name}": ${error.message}`);
    } else {
      log("  ✅", `${t.name} — ${t.role}`);
    }
  }
}
```

**Step 4: Add `seedEventReviews` function**

```typescript
async function seedEventReviews(userMap: Map<string, string>, eventMap: Map<string, string>) {
  log("⭐", "Creating event reviews...");

  for (const review of REVIEW_DEFS) {
    const userId = userMap.get(review.userEmail);
    const eventId = eventMap.get(review.eventTitle);
    if (!userId || !eventId) {
      console.error(
        `  Missing user or event for review: ${review.userEmail} -> ${review.eventTitle}`,
      );
      continue;
    }

    const { error } = await supabase.from("event_reviews").insert({
      event_id: eventId,
      user_id: userId,
      rating: review.rating,
      text: review.text,
    });

    if (error) {
      console.error(`  Failed to create review: ${error.message}`);
    } else {
      const name = TEST_USERS.find((u) => u.email === review.userEmail)?.full_name;
      log("  ✅", `${name} reviewed ${review.eventTitle} (${review.rating}★)`);
    }
  }
}
```

**Step 5: Add calls in `main()` function**

After `createCheckins` call (after line 1229), add:

```typescript
// Step 9: Create app testimonials
await seedAppTestimonials();
console.log();

// Step 10: Create event reviews
await seedEventReviews(userMap, eventMap);
console.log();
```

**Step 6: Also add `app_testimonials` cleanup in `cleanExistingTestData`**

Before the auth user deletion loop, add:

```typescript
// Clean app testimonials (not tied to users)
await supabase.from("app_testimonials").delete().neq("id", "00000000-0000-0000-0000-000000000000");
```

This deletes all app_testimonials rows (since they're not tied to user cascade).

**Step 7: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add testimonials and reviews to seed script"
```

---

### Task 14: Build verification

**Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

**Step 2: Run seed (if local Supabase is available)**

```bash
npm run seed
```

Verify app testimonials and event reviews are created.

**Step 3: Manual verification**

1. Landing page: testimonials section appears with 4 cards
2. Completed event detail page: reviews section shows with star ratings
3. Badge page for a completed event: review form appears
4. Organizer profile: aggregate rating and recent reviews shown

**Step 4: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: address issues from build verification"
```
