# Activity Feed & Follow System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Strava-style activity feed with follow system and emoji reactions, showing badge earned, event completed, event booked, and border unlocked activities.

**Architecture:** Two new DB tables (`user_follows`, `feed_reactions`), a union query feed API that reads from 4 existing tables (bookings, event_checkins, user_badges, user_avatar_borders), a follow/unfollow API, a reaction toggle API, and a new `/feed` page with infinite scroll. Follow button added to user profiles. Feed icon added to navigation.

**Tech Stack:** TypeScript, Next.js App Router, Supabase (Postgres + RLS), React 19, Tailwind CSS, date-fns

---

### Task 1: Database migration — `user_follows` and `feed_reactions` tables

**Files:**

- Create: `supabase/migrations/20260228_activity_feed.sql`

**Step 1: Write the migration**

```sql
-- ===========================================
-- user_follows: who follows whom
-- ===========================================
CREATE TABLE user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_follows_no_self CHECK (follower_id != following_id),
  CONSTRAINT user_follows_unique UNIQUE (follower_id, following_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Anyone can see follows
CREATE POLICY "user_follows_select_public"
  ON user_follows FOR SELECT
  USING (true);

-- Authenticated users can follow (only as themselves)
CREATE POLICY "user_follows_insert_own"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (only their own follows)
CREATE POLICY "user_follows_delete_own"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ===========================================
-- feed_reactions: emoji reactions on feed items
-- ===========================================
CREATE TABLE feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border')),
  activity_id uuid NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('fire', 'clap', 'green_heart', 'mountain')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT feed_reactions_unique UNIQUE (user_id, activity_type, activity_id, emoji)
);

CREATE INDEX idx_feed_reactions_activity ON feed_reactions(activity_type, activity_id);

ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can see reactions
CREATE POLICY "feed_reactions_select_public"
  ON feed_reactions FOR SELECT
  USING (true);

-- Authenticated users can react (only as themselves)
CREATE POLICY "feed_reactions_insert_own"
  ON feed_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "feed_reactions_delete_own"
  ON feed_reactions FOR DELETE
  USING (auth.uid() = user_id);
```

**Step 2: Verify the migration SQL is valid**

Run: `pnpm typecheck`
Expected: PASS (migration is SQL only, just make sure no TS files broke)

**Step 3: Commit**

```bash
git add supabase/migrations/20260228_activity_feed.sql
git commit -m "feat: add user_follows and feed_reactions tables with RLS"
```

---

### Task 2: Add TypeScript types for new tables

**Files:**

- Modify: `src/lib/supabase/types.ts`

**Step 1: Add the type definitions**

Add the following table types to the `Tables` interface in `types.ts`, following the existing pattern (Row/Insert/Update for each table). Add them after the existing table definitions:

```typescript
user_follows: {
  Row: {
    id: string;
    follower_id: string;
    following_id: string;
    created_at: string;
  };
  Insert: {
    id?: string;
    follower_id: string;
    following_id: string;
    created_at?: string;
  };
  Update: {
    id?: string;
    follower_id?: string;
    following_id?: string;
    created_at?: string;
  };
};
feed_reactions: {
  Row: {
    id: string;
    user_id: string;
    activity_type: "booking" | "checkin" | "badge" | "border";
    activity_id: string;
    emoji: "fire" | "clap" | "green_heart" | "mountain";
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    activity_type: "booking" | "checkin" | "badge" | "border";
    activity_id: string;
    emoji: "fire" | "clap" | "green_heart" | "mountain";
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    activity_type?: "booking" | "checkin" | "badge" | "border";
    activity_id?: string;
    emoji?: "fire" | "clap" | "green_heart" | "mountain";
    created_at?: string;
  };
};
```

**Step 2: Verify**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add TypeScript types for user_follows and feed_reactions"
```

---

### Task 3: Add relative time utility and feed types

**Files:**

- Create: `src/lib/utils/relative-time.ts`
- Create: `src/lib/feed/types.ts`

**Step 1: Create the relative time utility**

Uses `date-fns` (already installed) to format timestamps as "2h ago", "3d ago", etc.

```typescript
import { formatDistanceToNowStrict } from "date-fns";

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNowStrict(d, { addSuffix: true });
}
```

**Step 2: Create the feed types**

```typescript
export type ActivityType = "booking" | "checkin" | "badge" | "border";
export type EmojiType = "fire" | "clap" | "green_heart" | "mountain";

export const EMOJI_MAP: Record<EmojiType, string> = {
  fire: "🔥",
  clap: "👏",
  green_heart: "💚",
  mountain: "⛰️",
};

export interface FeedItem {
  id: string;
  activityType: ActivityType;
  userId: string;
  userName: string;
  userUsername: string | null;
  userAvatarUrl: string | null;
  activeBorderId: string | null;
  topBadgeImageUrl: string | null;
  text: string;
  contextImageUrl: string | null;
  timestamp: string;
  isFollowing: boolean;
  reactions: ReactionSummary[];
  userReactions: EmojiType[];
}

export interface ReactionSummary {
  emoji: EmojiType;
  count: number;
}
```

**Step 3: Verify**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/utils/relative-time.ts src/lib/feed/types.ts
git commit -m "feat: add relative time utility and feed type definitions"
```

---

### Task 4: Feed API route (`GET /api/feed`)

**Files:**

- Create: `src/app/(frontend)/api/feed/route.ts`

**Step 1: Implement the feed API**

This is the core route. It queries 4 tables via separate queries, merges and sorts them, then enriches with user data, reactions, and follow status. Accepts `offset` and `limit` query params.

```typescript
import { NextResponse } from "next/server";

import type { ActivityType, EmojiType, FeedItem, ReactionSummary } from "@/lib/feed/types";
import { createClient } from "@/lib/supabase/server";

const BATCH_SIZE = 15;

interface RawActivity {
  id: string;
  activityType: ActivityType;
  userId: string;
  text: string;
  contextImageUrl: string | null;
  timestamp: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || String(BATCH_SIZE), 10);

  const supabase = await createClient();

  // Get current user (optional — feed is public)
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // We fetch more than needed from each source, then merge + sort + slice
  const fetchLimit = offset + limit + 10;

  // 1. Bookings (non-guest, non-cancelled)
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id, booked_at, status, events(title, cover_image_url), users!inner(is_guest)")
    .in("status", ["pending", "confirmed"])
    .eq("users.is_guest", false)
    .order("booked_at", { ascending: false })
    .limit(fetchLimit);

  // 2. Check-ins
  const { data: checkins } = await supabase
    .from("event_checkins")
    .select("id, user_id, checked_in_at, events(title, cover_image_url), users!inner(is_guest)")
    .eq("users.is_guest", false)
    .order("checked_in_at", { ascending: false })
    .limit(fetchLimit);

  // 3. Badges earned
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("id, user_id, awarded_at, badges(title, image_url), users!inner(is_guest)")
    .eq("users.is_guest", false)
    .order("awarded_at", { ascending: false })
    .limit(fetchLimit);

  // 4. Borders unlocked
  const { data: userBorders } = await supabase
    .from("user_avatar_borders")
    .select("id, user_id, awarded_at, avatar_borders(name, tier), users!inner(is_guest)")
    .eq("users.is_guest", false)
    .order("awarded_at", { ascending: false })
    .limit(fetchLimit);

  // Build unified activity list
  const activities: RawActivity[] = [];

  for (const b of bookings || []) {
    const event = b.events as any;
    activities.push({
      id: b.id,
      activityType: "booking",
      userId: b.user_id,
      text: `is joining ${event?.title || "an event"}`,
      contextImageUrl: event?.cover_image_url || null,
      timestamp: b.booked_at,
    });
  }

  for (const c of checkins || []) {
    const event = c.events as any;
    activities.push({
      id: c.id,
      activityType: "checkin",
      userId: c.user_id,
      text: `completed ${event?.title || "an event"}`,
      contextImageUrl: event?.cover_image_url || null,
      timestamp: c.checked_in_at,
    });
  }

  for (const ub of userBadges || []) {
    const badge = ub.badges as any;
    activities.push({
      id: ub.id,
      activityType: "badge",
      userId: ub.user_id,
      text: `earned ${badge?.title || "a badge"}`,
      contextImageUrl: badge?.image_url || null,
      timestamp: ub.awarded_at,
    });
  }

  for (const ab of userBorders || []) {
    const border = ab.avatar_borders as any;
    activities.push({
      id: ab.id,
      activityType: "border",
      userId: ab.user_id,
      text: `unlocked ${border?.tier || ""} ${border?.name || "border"}`,
      contextImageUrl: null,
      timestamp: ab.awarded_at,
    });
  }

  // Sort by timestamp descending, then paginate
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const paged = activities.slice(offset, offset + limit);

  if (paged.length === 0) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  // Collect unique user IDs to fetch profiles
  const userIds = [...new Set(paged.map((a) => a.userId))];

  // Fetch user profiles
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, username, avatar_url, active_border_id")
    .in("id", userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  // Fetch top badge for each user (most recent)
  const { data: topBadges } = await supabase
    .from("user_badges")
    .select("user_id, badges(image_url)")
    .in("user_id", userIds)
    .order("awarded_at", { ascending: false });

  const topBadgeMap = new Map<string, string | null>();
  for (const tb of topBadges || []) {
    if (!topBadgeMap.has(tb.user_id)) {
      topBadgeMap.set(tb.user_id, (tb.badges as any)?.image_url || null);
    }
  }

  // Fetch reactions for all paged activities
  const activityKeys = paged.map((a) => `${a.activityType}:${a.id}`);
  const activityIds = paged.map((a) => a.id);

  const { data: reactions } = await supabase
    .from("feed_reactions")
    .select("activity_type, activity_id, emoji, user_id")
    .in("activity_id", activityIds);

  // Build reaction summaries per activity
  const reactionMap = new Map<
    string,
    { counts: Map<EmojiType, number>; userEmojis: Set<EmojiType> }
  >();
  for (const r of reactions || []) {
    const key = `${r.activity_type}:${r.activity_id}`;
    if (!reactionMap.has(key)) {
      reactionMap.set(key, { counts: new Map(), userEmojis: new Set() });
    }
    const entry = reactionMap.get(key)!;
    entry.counts.set(r.emoji as EmojiType, (entry.counts.get(r.emoji as EmojiType) || 0) + 1);
    if (authUser && r.user_id === authUser.id) {
      entry.userEmojis.add(r.emoji as EmojiType);
    }
  }

  // Fetch follow status if authenticated
  const followingSet = new Set<string>();
  if (authUser) {
    const { data: follows } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", authUser.id)
      .in("following_id", userIds);
    for (const f of follows || []) {
      followingSet.add(f.following_id);
    }
  }

  // Build final feed items
  const items: FeedItem[] = paged.map((a) => {
    const user = userMap.get(a.userId);
    const key = `${a.activityType}:${a.id}`;
    const rxn = reactionMap.get(key);
    const reactionSummaries: ReactionSummary[] = [];
    if (rxn) {
      for (const [emoji, count] of rxn.counts) {
        reactionSummaries.push({ emoji, count });
      }
    }

    return {
      id: a.id,
      activityType: a.activityType,
      userId: a.userId,
      userName: user?.full_name || "Unknown",
      userUsername: user?.username || null,
      userAvatarUrl: user?.avatar_url || null,
      activeBorderId: user?.active_border_id || null,
      topBadgeImageUrl: topBadgeMap.get(a.userId) || null,
      text: a.text,
      contextImageUrl: a.contextImageUrl,
      timestamp: a.timestamp,
      isFollowing: followingSet.has(a.userId),
      reactions: reactionSummaries,
      userReactions: rxn ? [...rxn.userEmojis] : [],
    };
  });

  return NextResponse.json({
    items,
    hasMore: activities.length > offset + limit,
  });
}
```

**Step 2: Verify**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS (0 errors)

**Step 4: Commit**

```bash
git add src/app/(frontend)/api/feed/route.ts
git commit -m "feat: add feed API route with union query across 4 activity sources"
```

---

### Task 5: Follow API route (`POST/DELETE /api/follows`)

**Files:**

- Create: `src/app/(frontend)/api/follows/route.ts`

**Step 1: Implement follow/unfollow API**

```typescript
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followingId } = (await request.json()) as { followingId: string };
  if (!followingId) {
    return NextResponse.json({ error: "Missing followingId" }, { status: 400 });
  }

  if (followingId === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const { error } = await supabase.from("user_follows").insert({
    follower_id: user.id,
    following_id: followingId,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already following" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Followed" }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followingId } = (await request.json()) as { followingId: string };
  if (!followingId) {
    return NextResponse.json({ error: "Missing followingId" }, { status: 400 });
  }

  await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  return NextResponse.json({ message: "Unfollowed" }, { status: 200 });
}
```

**Step 2: Verify**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/follows/route.ts
git commit -m "feat: add follow/unfollow API route"
```

---

### Task 6: Reactions API route (`POST/DELETE /api/reactions`)

**Files:**

- Create: `src/app/(frontend)/api/reactions/route.ts`

**Step 1: Implement reaction toggle API**

```typescript
import { NextResponse } from "next/server";

import type { ActivityType, EmojiType } from "@/lib/feed/types";
import { createClient } from "@/lib/supabase/server";

interface ReactionBody {
  activityType: ActivityType;
  activityId: string;
  emoji: EmojiType;
}

const VALID_TYPES = new Set(["booking", "checkin", "badge", "border"]);
const VALID_EMOJIS = new Set(["fire", "clap", "green_heart", "mountain"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as ReactionBody;
  if (!VALID_TYPES.has(body.activityType) || !VALID_EMOJIS.has(body.emoji) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { error } = await supabase.from("feed_reactions").insert({
    user_id: user.id,
    activity_type: body.activityType,
    activity_id: body.activityId,
    emoji: body.emoji,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already reacted" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Reacted" }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as ReactionBody;
  if (!VALID_TYPES.has(body.activityType) || !VALID_EMOJIS.has(body.emoji) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  await supabase
    .from("feed_reactions")
    .delete()
    .eq("user_id", user.id)
    .eq("activity_type", body.activityType)
    .eq("activity_id", body.activityId)
    .eq("emoji", body.emoji);

  return NextResponse.json({ message: "Removed" }, { status: 200 });
}
```

**Step 2: Verify**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/reactions/route.ts
git commit -m "feat: add reaction toggle API route"
```

---

### Task 7: FeedIcon component + add to navigation

**Files:**

- Create: `src/components/icons/FeedIcon.tsx`
- Modify: `src/components/icons/index.ts` — add export
- Modify: `src/components/layout/MobileNav.tsx` — add Feed nav item
- Modify: `src/components/layout/Navbar.tsx` — add Feed link

**Step 1: Create FeedIcon**

Create an activity/feed icon (a lightning bolt or activity pulse style). Follow the existing icon pattern with `variant` support:

```tsx
interface FeedIconProps {
  className?: string;
  variant?: "outline" | "filled";
}

export default function FeedIcon({ className, variant = "outline" }: FeedIconProps) {
  if (variant === "filled") {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
```

**Step 2: Add export to barrel file**

In `src/components/icons/index.ts`, add:

```typescript
export { default as FeedIcon } from "./FeedIcon";
```

**Step 3: Add to MobileNav**

In `src/components/layout/MobileNav.tsx`, add a "Feed" nav item between Home and Explore. Import `FeedIcon` and add the nav entry with path `/feed`.

**Step 4: Add to Navbar**

In `src/components/layout/Navbar.tsx`, add a "Feed" link in the desktop navigation, next to "Explore Events".

**Step 5: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/icons/FeedIcon.tsx src/components/icons/index.ts src/components/layout/MobileNav.tsx src/components/layout/Navbar.tsx
git commit -m "feat: add FeedIcon and feed link to navigation"
```

---

### Task 8: ReactionBar component

**Files:**

- Create: `src/components/feed/ReactionBar.tsx`

**Step 1: Implement the reaction bar**

Shows 4 emoji buttons (🔥 👏 💚 ⛰️) with counts. Tap to toggle. Requires login — if not logged in, clicking redirects to login.

```tsx
"use client";

import { useState } from "react";

import { EMOJI_MAP } from "@/lib/feed/types";
import type { ActivityType, EmojiType, ReactionSummary } from "@/lib/feed/types";

interface ReactionBarProps {
  activityType: ActivityType;
  activityId: string;
  reactions: ReactionSummary[];
  userReactions: EmojiType[];
  isAuthenticated: boolean;
}

const EMOJIS: EmojiType[] = ["fire", "clap", "green_heart", "mountain"];

export default function ReactionBar({
  activityType,
  activityId,
  reactions: initialReactions,
  userReactions: initialUserReactions,
  isAuthenticated,
}: ReactionBarProps) {
  const [reactions, setReactions] = useState<ReactionSummary[]>(initialReactions);
  const [userReactions, setUserReactions] = useState<Set<EmojiType>>(new Set(initialUserReactions));
  const [loading, setLoading] = useState<EmojiType | null>(null);

  const handleToggle = async (emoji: EmojiType) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (loading) return;

    const isActive = userReactions.has(emoji);
    setLoading(emoji);

    try {
      const res = await fetch("/api/reactions", {
        method: isActive ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType, activityId, emoji }),
      });

      if (res.ok) {
        setUserReactions((prev) => {
          const next = new Set(prev);
          if (isActive) next.delete(emoji);
          else next.add(emoji);
          return next;
        });
        setReactions((prev) => {
          const existing = prev.find((r) => r.emoji === emoji);
          if (isActive) {
            if (existing && existing.count > 1) {
              return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1 } : r));
            }
            return prev.filter((r) => r.emoji !== emoji);
          }
          if (existing) {
            return prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r));
          }
          return [...prev, { emoji, count: 1 }];
        });
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {EMOJIS.map((emoji) => {
        const rxn = reactions.find((r) => r.emoji === emoji);
        const isActive = userReactions.has(emoji);
        const count = rxn?.count || 0;

        return (
          <button
            key={emoji}
            type="button"
            onClick={() => handleToggle(emoji)}
            disabled={loading === emoji}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors ${
              isActive
                ? "bg-lime-100 dark:bg-lime-900/30 border border-lime-300 dark:border-lime-700"
                : "bg-gray-100 dark:bg-gray-800 border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <span className="text-base">{EMOJI_MAP[emoji]}</span>
            {count > 0 && (
              <span
                className={`text-xs font-medium ${isActive ? "text-lime-700 dark:text-lime-400" : "text-gray-500 dark:text-gray-400"}`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

**Step 2: Verify**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/feed/ReactionBar.tsx
git commit -m "feat: add ReactionBar component with emoji toggle"
```

---

### Task 9: FeedCard component

**Files:**

- Create: `src/components/feed/FeedCard.tsx`

**Step 1: Implement the feed card**

Displays one activity: user avatar (with border), name, top badge, "Following" indicator, activity text, context image, timestamp, and reaction bar.

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";

import ReactionBar from "@/components/feed/ReactionBar";
import type { FeedItem } from "@/lib/feed/types";
import { formatRelativeTime } from "@/lib/utils/relative-time";

interface FeedCardProps {
  item: FeedItem;
  isAuthenticated: boolean;
}

export default function FeedCard({ item, isAuthenticated }: FeedCardProps) {
  const profileHref = item.userUsername ? `/profile/${item.userUsername}` : "#";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 space-y-3">
      {/* Header: avatar + name + badge + following */}
      <div className="flex items-center gap-3">
        <Link href={profileHref} className="shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {item.userAvatarUrl ? (
              <Image
                src={item.userAvatarUrl}
                alt={item.userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                {item.userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={profileHref}
              className="font-semibold text-gray-900 dark:text-white text-sm truncate hover:underline"
            >
              {item.userName}
            </Link>
            {item.topBadgeImageUrl && (
              <Image
                src={item.topBadgeImageUrl}
                alt="Badge"
                width={18}
                height={18}
                className="rounded-full"
              />
            )}
            {item.isFollowing && (
              <span className="text-xs bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 px-1.5 py-0.5 rounded-full font-medium">
                Following
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{item.text}</p>
        </div>

        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {formatRelativeTime(item.timestamp)}
        </span>
      </div>

      {/* Context image */}
      {item.contextImageUrl && (
        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={item.contextImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 600px"
          />
        </div>
      )}

      {/* Reactions */}
      <ReactionBar
        activityType={item.activityType}
        activityId={item.id}
        reactions={item.reactions}
        userReactions={item.userReactions}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
```

**Step 2: Verify**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/feed/FeedCard.tsx
git commit -m "feat: add FeedCard component with avatar, activity text, and reactions"
```

---

### Task 10: Feed page with infinite scroll

**Files:**

- Create: `src/app/(frontend)/(participant)/feed/page.tsx`
- Create: `src/components/feed/FeedList.tsx`

**Step 1: Create the FeedList client component**

Follows the `EventsListClient` infinite scroll pattern with `IntersectionObserver`:

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import FeedCard from "@/components/feed/FeedCard";
import { SpinnerIcon } from "@/components/icons";
import type { FeedItem } from "@/lib/feed/types";

const BATCH_SIZE = 15;

interface FeedListProps {
  initialItems: FeedItem[];
  initialHasMore: boolean;
  isAuthenticated: boolean;
}

export default function FeedList({ initialItems, initialHasMore, isAuthenticated }: FeedListProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/feed?offset=${items.length}&limit=${BATCH_SIZE}`);
      const data = (await res.json()) as { items: FeedItem[]; hasMore: boolean };
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, items.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-3xl mb-3">⚡</p>
        <p className="text-gray-500 dark:text-gray-400">
          No activity yet. Book an event to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedCard
          key={`${item.activityType}-${item.id}`}
          item={item}
          isAuthenticated={isAuthenticated}
        />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoading && <SpinnerIcon className="w-6 h-6 text-lime-500 animate-spin" />}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create the feed page (server component)**

```tsx
import type { Metadata } from "next";

import FeedList from "@/components/feed/FeedList";
import type { FeedItem } from "@/lib/feed/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Activity Feed",
  description:
    "See what adventurers are up to — events booked, completed, badges earned, and more.",
};

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch initial feed server-side
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  const res = await fetch(`${baseUrl}/api/feed?offset=0&limit=15`, {
    cache: "no-store",
    headers: {
      cookie: "", // Server component can't forward cookies easily; fetch client-side instead
    },
  });

  let initialItems: FeedItem[] = [];
  let initialHasMore = false;

  // If server fetch fails, client will load on mount
  if (res.ok) {
    const data = (await res.json()) as { items: FeedItem[]; hasMore: boolean };
    initialItems = data.items;
    initialHasMore = data.hasMore;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-heading font-bold dark:text-white mb-6">Activity Feed</h1>
      <FeedList
        initialItems={initialItems}
        initialHasMore={initialHasMore}
        isAuthenticated={!!user}
      />
    </div>
  );
}
```

**Note:** The server-side fetch may not pass auth cookies properly. The implementer should test this — if the initial load doesn't show follow status / user reactions, switch to client-side only loading (pass empty `initialItems` and let `FeedList` load on mount via `useEffect`). The feed is public so the basic data will load either way.

**Step 3: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/(frontend)/(participant)/feed/page.tsx src/components/feed/FeedList.tsx
git commit -m "feat: add /feed page with infinite scroll"
```

---

### Task 11: Follow button on profile page

**Files:**

- Modify: `src/app/(frontend)/(participant)/profile/[username]/page.tsx` — add follow state + pass to header
- Create: `src/components/profile/FollowButton.tsx`

**Step 1: Create FollowButton component**

```tsx
"use client";

import { useState } from "react";

import { Button } from "@/components/ui";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/follows", {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
```

**Step 2: Add follow status to profile page**

In the profile page's server component, after fetching the user profile and checking `isOwnProfile`, add a query to check if the current auth user follows this profile. Then render `<FollowButton>` in the profile header area when it's NOT the user's own profile and the viewer is authenticated.

Query to add:

```typescript
let isFollowing = false;
if (authUser && !isOwnProfile) {
  const { data: followRow } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", authUser.id)
    .eq("following_id", profileUser.id)
    .maybeSingle();
  isFollowing = !!followRow;
}
```

Then pass `isFollowing`, `targetUserId`, and `isAuthenticated` down and render the `FollowButton` next to the share button.

**Step 3: Verify**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/profile/FollowButton.tsx src/app/(frontend)/(participant)/profile/[username]/page.tsx
git commit -m "feat: add follow/unfollow button to user profiles"
```

---

### Task 12: Build and final verification

**Step 1: Run full type check**

Run: `pnpm typecheck`
Expected: PASS

**Step 2: Run full lint**

Run: `pnpm lint`
Expected: PASS

**Step 3: Run production build**

Run: `pnpm build`
Expected: PASS

**Step 4: Commit any remaining changes**

If format/lint auto-fixed anything:

```bash
git add -A
git commit -m "chore: lint/format fixes"
```
