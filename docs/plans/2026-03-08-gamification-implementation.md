# Gamification System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement comprehensive gamification UI/UX enhancements: achievements page tabs (badges, borders, leaderboards), profile badge showcase, real-time unlock notifications, Strava activity linking, and social sharing.

**Architecture:**

- **Phase 1:** Database migrations + data layer helpers
- **Phase 2:** API routes (leaderboards, Strava activities, sharing)
- **Phase 3:** Achievement page refactor (tabs, progress bars, borders, leaderboards)
- **Phase 4:** Profile enhancements (badge showcase, border modal)
- **Phase 5:** Real-time notifications (modal + notification center)
- **Phase 6:** Social sharing + badge detail page enhancement
- **Phase 7:** Testing + feature flag integration

**Tech Stack:** Next.js 15, Supabase (Postgres), React 19, Tailwind, TypeScript, Vitest

---

## Database & Data Layer

### Task 1: Create `user_badge_showcase` migration

**Files:**

- Create: `supabase/migrations/011_user_badge_showcase.sql`

**Step 1: Write migration**

```sql
-- Create user_badge_showcase table for featured badges on profile
CREATE TABLE user_badge_showcase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- RLS: Users can only view/modify their own showcase
ALTER TABLE user_badge_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badge showcase"
  ON user_badge_showcase
  FOR SELECT
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Users can update their own badge showcase"
  ON user_badge_showcase
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badge showcase"
  ON user_badge_showcase
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badge showcase"
  ON user_badge_showcase
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Step 2: Verify migration file syntax**

Run: `cat supabase/migrations/011_user_badge_showcase.sql | head -5`
Expected: First 5 lines shown, no syntax errors

**Step 3: Commit**

```bash
git add supabase/migrations/011_user_badge_showcase.sql
git commit -m "db: create user_badge_showcase table for profile badge customization"
```

---

### Task 2: Create `badge_shares` migration (optional, for analytics)

**Files:**

- Create: `supabase/migrations/012_badge_shares.sql`

**Step 1: Write migration**

```sql
-- Create badge_shares table for tracking social shares
CREATE TABLE badge_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'link_copy')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Users can only insert their own shares, but anyone can read for analytics
ALTER TABLE badge_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own badge shares"
  ON badge_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read access to badge shares for analytics"
  ON badge_shares
  FOR SELECT
  USING (true);
```

**Step 2: Verify**

Run: `cat supabase/migrations/012_badge_shares.sql | head -5`

**Step 3: Commit**

```bash
git add supabase/migrations/012_badge_shares.sql
git commit -m "db: create badge_shares table for social share analytics"
```

---

### Task 3: Update Supabase types to include new tables

**Files:**

- Modify: `src/lib/supabase/types.ts`

**Step 1: Add table types**

Add to `public.Tables` in the Database interface:

```typescript
user_badge_showcase: {
  Row: {
    id: string;
    user_id: string;
    badge_id: string;
    sort_order: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    badge_id: string;
    sort_order: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    badge_id?: string;
    sort_order?: number;
    created_at?: string;
  };
  Relationships: [];
};
badge_shares: {
  Row: {
    id: string;
    badge_id: string;
    user_id: string;
    platform: 'twitter' | 'facebook' | 'link_copy';
    created_at: string;
  };
  Insert: {
    id?: string;
    badge_id: string;
    user_id: string;
    platform: 'twitter' | 'facebook' | 'link_copy';
    created_at?: string;
  };
  Update: {
    id?: string;
    badge_id?: string;
    user_id?: string;
    platform?: 'twitter' | 'facebook' | 'link_copy';
    created_at?: string;
  };
  Relationships: [];
};
```

**Step 2: Verify TypeScript compilation**

Run: `pnpm typecheck`
Expected: No errors in types.ts

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "types: add user_badge_showcase and badge_shares table types"
```

---

### Task 4: Create badge progress calculation helper

**Files:**

- Create: `src/lib/badges/calculate-progress.ts`

**Step 1: Write helper function**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Badge = Database["public"]["Tables"]["badges"]["Row"];

export interface BadgeProgress {
  current: number;
  target: number;
  percent: number;
  progressText: string;
}

/**
 * Calculate progress toward a locked badge.
 * Returns progress data or null if badge is not progressable.
 */
export async function calculateBadgeProgress(
  userId: string,
  badge: Badge,
  supabase: SupabaseClient<Database>,
): Promise<BadgeProgress | null> {
  if (!badge.criteria_key) return null;

  const key = badge.criteria_key;

  // First activity badges - no progress tracking (0 or 1)
  if (
    [
      "first_hike",
      "first_run",
      "first_road_ride",
      "first_mtb",
      "first_trail_run",
      "strava_connected",
      "pioneer",
      "pioneer_participant",
      "pioneer_organizer",
      "first_review",
    ].includes(key)
  ) {
    return null;
  }

  // Event count badges (5, 10, 25, 50)
  if (key.startsWith("events_")) {
    const target = parseInt(key.split("_")[1], 10);
    const { count } = await supabase
      .from("event_checkins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    const current = count ?? 0;
    return {
      current,
      target,
      percent: Math.min((current / target) * 100, 99),
      progressText: `${current}/${target} events`,
    };
  }

  // Distance badges (5K, 10K, 21K, 42K, 100K+)
  if (key.startsWith("distance_")) {
    const distanceMap: Record<string, number> = {
      distance_5k: 5,
      distance_10k: 10,
      distance_21k: 21,
      distance_42k: 42,
      distance_100k: 100,
    };
    const target = distanceMap[key] || 100;

    // Get total distance from event_distances booked by user
    const { data: bookings } = await supabase
      .from("bookings")
      .select("event_distance_id, event_distances(distance_km)")
      .eq("user_id", userId)
      .in("status", ["confirmed", "pending"] as any);

    let current = 0;
    for (const booking of bookings ?? []) {
      const distance = (booking.event_distances as any)?.distance_km ?? 0;
      current += distance;
    }

    return {
      current,
      target,
      percent: Math.min((current / target) * 100, 99),
      progressText: `${current.toFixed(1)}/${target}km`,
    };
  }

  // Summit badges (1, 3, 5, all, igbaras_graduate)
  if (key.startsWith("summits_")) {
    const targetMap: Record<string, number> = {
      summits_1: 1,
      summits_3: 3,
      summits_5: 5,
      summits_all: 999, // Placeholder, will calculate total mountains
      igbaras_graduate: 7,
    };
    const target = targetMap[key] || 1;

    // Get distinct mountains from hiking events user checked in to
    const { data: mountainData } = await supabase
      .from("event_checkins")
      .select("events(event_mountains(mountain_id))")
      .eq("user_id", userId)
      .eq("events.type", "hiking");

    const mountainSet = new Set<string>();
    for (const checkin of mountainData ?? []) {
      const event = (checkin.events as any) ?? {};
      const eventMountains = event.event_mountains ?? [];
      for (const em of eventMountains) {
        mountainSet.add(em.mountain_id);
      }
    }

    const current = mountainSet.size;
    const displayTarget = key === "summits_all" ? mountainSet.size : target;

    return {
      current,
      target: displayTarget,
      percent: Math.min((current / target) * 100, 99),
      progressText: `${current}/${target} summits`,
    };
  }

  // All-rounder: requires at least 1 event of each type
  if (key === "all_rounder") {
    const { data: checkins } = await supabase
      .from("event_checkins")
      .select("events(type)")
      .eq("user_id", userId);

    const types = new Set<string>();
    for (const checkin of checkins ?? []) {
      const event = (checkin.events as any) ?? {};
      if (event.type) types.add(event.type);
    }

    const requiredTypes = ["hiking", "mtb", "road_bike", "running", "trail_run"];
    const current = requiredTypes.filter((t) => types.has(t)).length;
    const target = requiredTypes.length;

    return {
      current,
      target,
      percent: Math.min((current / target) * 100, 99),
      progressText: `${current}/${target} activity types`,
    };
  }

  return null;
}
```

**Step 2: Run TypeScript check**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/badges/calculate-progress.ts
git commit -m "feat: add badge progress calculation helper"
```

---

## API Routes

### Task 5: Create leaderboards API route

**Files:**

- Create: `src/app/(frontend)/api/leaderboards/route.ts`

**Step 1: Write API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const metric = searchParams.get("metric") ?? "most_badges";
  const scope = searchParams.get("scope") ?? "global";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's friends (people they follow)
  let friendIds: string[] = [];
  if (scope === "friends") {
    const { data } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);
    friendIds = data?.map((r) => r.following_id) ?? [];
  }

  const userFilter = scope === "friends" ? friendIds : undefined;

  let query = supabase.from("users").select("id, full_name, avatar_url");

  if (userFilter && userFilter.length > 0) {
    query = query.in("id", userFilter);
  }

  const { data: users } = await query;

  if (!users) {
    return NextResponse.json({ leaderboards: [] });
  }

  // Calculate metrics for each user
  const leaderboardData: Array<{
    rank: number;
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    metric_value: number;
  }> = [];

  for (const usr of users) {
    let metricValue = 0;

    if (metric === "most_badges") {
      const { count } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .eq("user_id", usr.id);
      metricValue = count ?? 0;
    } else if (metric === "most_summits") {
      const { data: checkins } = await supabase
        .from("event_checkins")
        .select("events(event_mountains(mountain_id))")
        .eq("user_id", usr.id);
      const mountains = new Set<string>();
      for (const c of checkins ?? []) {
        const event = (c.events as any) ?? {};
        const eventMountains = event.event_mountains ?? [];
        for (const em of eventMountains) {
          mountains.add(em.mountain_id);
        }
      }
      metricValue = mountains.size;
    } else if (metric === "highest_rarity") {
      const rarityMap: Record<string, number> = {
        legendary: 4,
        epic: 3,
        rare: 2,
        common: 1,
      };
      const { data: badges } = await supabase
        .from("user_badges")
        .select("badges(rarity)")
        .eq("user_id", usr.id);
      for (const b of badges ?? []) {
        const badge = (b.badges as any) ?? {};
        metricValue += rarityMap[badge.rarity] ?? 0;
      }
    } else if (metric === "most_active") {
      const { count } = await supabase
        .from("event_checkins")
        .select("*", { count: "exact", head: true })
        .eq("user_id", usr.id);
      metricValue = count ?? 0;
    }

    leaderboardData.push({
      rank: 0, // Will assign after sorting
      user_id: usr.id,
      full_name: usr.full_name,
      avatar_url: usr.avatar_url,
      metric_value: metricValue,
    });
  }

  // Sort and assign ranks
  leaderboardData.sort((a, b) => b.metric_value - a.metric_value);
  leaderboardData.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Highlight current user's rank
  const userRank = leaderboardData.find((item) => item.user_id === user.id);

  return NextResponse.json({
    leaderboards: leaderboardData.slice(0, limit),
    yourRank: userRank?.rank ?? null,
  });
}
```

**Step 2: Run TypeScript check**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Test the endpoint manually**

Run: `pnpm dev` (in another terminal)
Visit: `http://localhost:3001/api/leaderboards?metric=most_badges&scope=global&limit=20`
Expected: JSON response with leaderboards array

**Step 4: Commit**

```bash
git add src/app/\(frontend\)/api/leaderboards/route.ts
git commit -m "feat: add leaderboards API endpoint with multiple metrics"
```

---

### Task 6: Create badge strava activities API route

**Files:**

- Create: `src/app/(frontend)/api/badges/[id]/strava-activities/route.ts`

**Step 1: Write API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch badge to get criteria_key
  const { data: badge } = await supabase
    .from("badges")
    .select("criteria_key")
    .eq("id", id)
    .single();

  if (!badge) {
    return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's bookings that contributed to this badge
  // For now, return all Strava activities linked to user's bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "confirmed");

  const bookingIds = bookings?.map((b) => b.id) ?? [];

  if (bookingIds.length === 0) {
    return NextResponse.json({ activities: [] });
  }

  const { data: activities } = await supabase
    .from("strava_activities")
    .select("id, name, distance, start_date, moving_time, total_elevation_gain")
    .in("booking_id", bookingIds)
    .order("start_date", { ascending: false })
    .limit(5);

  // Format response
  const formatted = (activities ?? []).map((act) => ({
    id: act.id,
    name: act.name,
    distance: act.distance,
    date: act.start_date,
    moving_time: act.moving_time,
    elevation_gain: act.total_elevation_gain,
    strava_url: `https://www.strava.com/activities/${act.id}`,
  }));

  return NextResponse.json({ activities: formatted });
}
```

**Step 2: TypeScript check**

Run: `pnpm typecheck`

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/api/badges/\[id\]/strava-activities/route.ts
git commit -m "feat: add badge Strava activities API endpoint"
```

---

### Task 7: Create badge share API route

**Files:**

- Create: `src/app/(frontend)/api/badges/[id]/share/route.ts`

**Step 1: Write API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { platform } = body;

  if (!["twitter", "facebook", "link_copy"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Log share
  await supabase.from("badge_shares").insert({
    badge_id: id,
    user_id: user.id,
    platform,
  });

  // Fetch badge and user info for share link
  const { data: badge } = await supabase
    .from("badges")
    .select("id, title, rarity")
    .eq("id", id)
    .single();

  const { data: userData } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!badge || !userData) {
    return NextResponse.json({ error: "Data not found" }, { status: 404 });
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://eventtara.com"}/badges/${id}?user=${userData.username}`;
  const message = `I just earned the "${badge.title}" badge on EventTara! 🎉`;

  return NextResponse.json({
    url: shareUrl,
    message,
    platforms: {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
  });
}
```

**Step 2: TypeScript check & Commit**

Run: `pnpm typecheck && git add src/app/\(frontend\)/api/badges/\[id\]/share/route.ts && git commit -m "feat: add badge share API endpoint"`

---

### Task 8: Create badge showcase API route

**Files:**

- Create: `src/app/(frontend)/api/badges/showcase/route.ts`

**Step 1: Write API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { badge_ids } = body;

  if (!Array.isArray(badge_ids)) {
    return NextResponse.json({ error: "badge_ids must be array" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete existing showcase entries
  await supabase.from("user_badge_showcase").delete().eq("user_id", user.id);

  // Insert new showcase entries with sort order
  const entries = badge_ids.map((badge_id: string, index: number) => ({
    user_id: user.id,
    badge_id,
    sort_order: index,
  }));

  const { error } = await supabase.from("user_badge_showcase").insert(entries);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Get user by username
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get showcase badges with details
  const { data: showcase } = await supabase
    .from("user_badge_showcase")
    .select("badges(id, title, image_url, rarity), sort_order")
    .eq("user_id", user.id)
    .order("sort_order");

  return NextResponse.json({
    badges: (showcase ?? []).map((item) => ({
      ...item.badges,
      sort_order: item.sort_order,
    })),
  });
}
```

**Step 2: Commit**

```bash
git add src/app/\(frontend\)/api/badges/showcase/route.ts
git commit -m "feat: add badge showcase API endpoint for profile customization"
```

---

## Components: Achievement Page

### Task 9: Create Borders tab component

**Files:**

- Create: `src/components/achievements/BordersTab.tsx`

**Step 1: Write component**

```typescript
"use client";

import Image from "next/image";
import { useState } from "react";

import { LockIcon } from "@/components/icons";
import { TIER_LABELS, TIER_LABEL_COLORS } from "@/lib/constants/avatar-borders";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Border = Database["public"]["Tables"]["avatar_borders"]["Row"];

interface BordersTabProps {
  borders: Border[];
  earnedBorderIds: Set<string>;
}

export default function BordersTab({ borders, earnedBorderIds }: BordersTabProps) {
  const [selectedBorder, setSelectedBorder] = useState<Border | null>(null);

  const sortedBorders = [...borders].sort((a, b) => {
    const tierOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
    return (
      (tierOrder[b.tier as keyof typeof tierOrder] ?? 0) -
      (tierOrder[a.tier as keyof typeof tierOrder] ?? 0)
    );
  });

  return (
    <div>
      {/* Border preview modal */}
      {selectedBorder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBorder(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-heading font-bold mb-4">{selectedBorder.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {selectedBorder.description}
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
              {/* Avatar preview with border */}
              <div className="flex justify-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600"
                  style={{
                    border: selectedBorder.border_color
                      ? `3px solid ${selectedBorder.border_color}`
                      : undefined,
                  }}
                >
                  <span className="text-4xl">👤</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedBorder(null)}
              className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Borders grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {sortedBorders.map((border) => {
          const isEarned = earnedBorderIds.has(border.id);
          const tierColor = TIER_LABEL_COLORS[border.tier as any];

          return (
            <button
              key={border.id}
              onClick={() => isEarned && setSelectedBorder(border)}
              disabled={!isEarned}
              className={cn(
                "rounded-2xl p-4 text-center transition-all",
                isEarned
                  ? "bg-white dark:bg-gray-900 shadow-md cursor-pointer hover:shadow-lg"
                  : "bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed opacity-60",
              )}
            >
              {/* Border preview circle */}
              <div
                className={cn(
                  "w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center overflow-hidden",
                  isEarned
                    ? cn(
                        "bg-gradient-to-br from-gray-200 to-gray-400",
                        border.border_color ? "" : "ring-2",
                      )
                    : "bg-gray-200 dark:bg-gray-700",
                )}
                style={{
                  border: isEarned && border.border_color ? `2px solid ${border.border_color}` : undefined,
                }}
              >
                <span className={cn(!isEarned && "opacity-30 grayscale")}>🎖️</span>
              </div>

              {/* Title */}
              <h4 className={cn("font-heading font-bold text-sm", !isEarned && "text-gray-400")}>
                {border.name}
              </h4>

              {/* Tier badge */}
              <span
                className={cn(
                  "inline-block text-xs px-2 py-0.5 rounded-full mt-2",
                  isEarned ? tierColor.pill : "bg-gray-100 text-gray-400 dark:bg-gray-800",
                )}
              >
                {TIER_LABELS[border.tier as any]}
              </span>

              {/* Status */}
              {!isEarned && (
                <p className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-2">
                  <LockIcon className="w-3.5 h-3.5" />
                  Locked
                </p>
              )}
            </button>
          );
        })}
      </div>

      {borders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">No borders available yet.</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: TypeScript check & Commit**

Run: `pnpm typecheck && git add src/components/achievements/BordersTab.tsx && git commit -m "feat: add borders tab component to achievements page"`

---

### Task 10: Create Leaderboards tab component

**Files:**

- Create: `src/components/achievements/LeaderboardsTab.tsx`

**Step 1: Write component**

```typescript
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import UserAvatar from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

type Metric = "most_badges" | "most_summits" | "highest_rarity" | "most_active";
type Scope = "global" | "friends";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  metric_value: number;
}

const METRIC_LABELS: Record<Metric, string> = {
  most_badges: "Most Badges",
  most_summits: "Most Summits",
  highest_rarity: "Highest Rarity",
  most_active: "Most Active",
};

const METRIC_UNITS: Record<Metric, string> = {
  most_badges: "badges",
  most_summits: "summits",
  highest_rarity: "points",
  most_active: "events",
};

export default function LeaderboardsTab() {
  const [scope, setScope] = useState<Scope>("global");
  const [metric, setMetric] = useState<Metric>("most_badges");
  const [leaderboards, setLeaderboards] = useState<LeaderboardEntry[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/leaderboards?metric=${metric}&scope=${scope}&limit=20`,
        );
        const data = await res.json();
        setLeaderboards(data.leaderboards ?? []);
        setYourRank(data.yourRank);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [metric, scope]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Scope</label>
          <div className="flex gap-2">
            {(["global", "friends"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors",
                  scope === s
                    ? "bg-teal-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300",
                )}
              >
                {s === "global" ? "Global" : "Friends"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Metric</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          >
            {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
              <option key={m} value={m}>
                {METRIC_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : leaderboards.length > 0 ? (
          leaderboards.map((entry) => (
            <Link
              key={entry.user_id}
              href={`/profile/${entry.full_name.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <span className="font-heading font-bold text-lg w-8 text-right">
                  #{entry.rank}
                </span>
                <UserAvatar
                  src={entry.avatar_url}
                  name={entry.full_name}
                  size="sm"
                />
                <span className="font-semibold">{entry.full_name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-teal-600">
                  {entry.metric_value}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {METRIC_UNITS[metric]}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-center text-gray-500">No data available</p>
        )}
      </div>

      {/* Your rank */}
      {yourRank && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">Your Rank</p>
          <p className="text-2xl font-heading font-bold text-teal-600 dark:text-teal-400">
            #{yourRank}
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/achievements/LeaderboardsTab.tsx
git commit -m "feat: add leaderboards tab component to achievements page"
```

---

### Task 11: Enhance achievements page with tabs

**Files:**

- Modify: `src/app/(frontend)/(participant)/achievements/page.tsx`

**Step 1: Read current file and identify changes**

Current structure: Shows all badges in grid. Need to add:

- Tab interface (Badges / Borders / Leaderboards)
- Fetch borders data
- Modify badge grid to show progress

**Step 2: Add progress bars to badge cards**

In the badge card section (around line 89-100), update the display to include progress:

```typescript
// Add import at top
import { calculateBadgeProgress } from "@/lib/badges/calculate-progress";

// After fetching badges, calculate progress for each
const badgesWithProgress = await Promise.all(
  (badges ?? []).map(async (badge) => {
    const progress = await calculateBadgeProgress(user.id, badge, supabase);
    return { ...badge, progress };
  }),
);
```

Then in JSX, add progress bar for locked badges:

```typescript
{!isEarned && badgeProgress && (
  <div className="mt-2 w-full">
    <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-teal-500 transition-all duration-300"
        style={{ width: `${badgeProgress.percent}%` }}
      />
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
      {badgeProgress.progressText}
    </p>
  </div>
)}
```

**Step 3: Add tab interface**

Replace the main return with:

```typescript
const [activeTab, setActiveTab] = useState<"badges" | "borders" | "leaderboards">("badges");

return (
  <div className="max-w-4xl mx-auto px-4 py-12">
    <Breadcrumbs />

    {/* Tab buttons */}
    <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
      {(["badges", "borders", "leaderboards"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={cn(
            "px-4 py-2 font-semibold border-b-2 transition-colors",
            activeTab === tab
              ? "border-teal-600 text-teal-600"
              : "border-transparent text-gray-500 hover:text-gray-700",
          )}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>

    {/* Tab content */}
    {activeTab === "badges" && (
      // Existing badges section with progress bars
    )}

    {activeTab === "borders" && (
      <BordersTab borders={borders} earnedBorderIds={earnedBorderIds} />
    )}

    {activeTab === "leaderboards" && (
      <LeaderboardsTab />
    )}
  </div>
);
```

**Step 4: Fetch borders data**

Add to data fetching section:

```typescript
// Fetch all borders
const { data: allBorders } = await supabase.from("avatar_borders").select("*").order("sort_order");

// Fetch user's earned borders
const { data: earnedBordersData } = await supabase
  .from("user_avatar_borders")
  .select("border_id")
  .eq("user_id", user.id);

const earnedBorderIds = new Set((earnedBordersData ?? []).map((b) => b.border_id));
```

**Step 5: Add imports at top**

```typescript
"use client";

import { useState } from "react";
import BordersTab from "@/components/achievements/BordersTab";
import LeaderboardsTab from "@/components/achievements/LeaderboardsTab";
import { calculateBadgeProgress } from "@/lib/badges/calculate-progress";
```

**Step 6: Complete the file**

See full implementation in Task 11 detailed code section.

**Step 7: TypeScript check & Commit**

```bash
pnpm typecheck
git add src/app/\(frontend\)/\(participant\)/achievements/page.tsx
git add src/components/achievements/BordersTab.tsx
git add src/components/achievements/LeaderboardsTab.tsx
git commit -m "feat: enhance achievements page with tabs, progress bars, borders, leaderboards"
```

---

## Components: Profile Page

### Task 12: Create badge showcase component

**Files:**

- Create: `src/components/profile/BadgeShowcase.tsx`

**Step 1: Write component**

```typescript
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Badge = Database["public"]["Tables"]["badges"]["Row"] & {
  awarded_at?: string;
};

interface BadgeShowcaseProps {
  badges: Badge[];
  isOwnProfile: boolean;
  onConfigureClick?: () => void;
}

export default function BadgeShowcase({
  badges,
  isOwnProfile,
  onConfigureClick,
}: BadgeShowcaseProps) {
  if (badges.length === 0) return null;

  const displayBadges = badges.slice(0, 8);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading font-bold">Featured Badges</h2>
        {isOwnProfile && (
          <button
            onClick={onConfigureClick}
            className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
          >
            Configure
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3">
        {displayBadges.map((badge) => {
          const resolved = resolvePresetImage(badge.image_url);
          const rarityStyle = RARITY_STYLES[badge.rarity];

          return (
            <Link
              key={badge.id}
              href={`/badges/${badge.id}`}
              className="group"
              title={badge.title}
            >
              <div
                className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center overflow-hidden",
                  "transition-transform hover:scale-110 cursor-pointer",
                  rarityStyle.ring,
                  rarityStyle.glow,
                )}
              >
                {resolved?.type === "url" ? (
                  <Image
                    src={resolved.url}
                    alt={badge.title}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl">
                    {resolved?.emoji || "🏅"}
                  </span>
                )}
              </div>
              <p className="text-xs text-center mt-1 truncate group-hover:text-teal-600">
                {badge.title}
              </p>
            </Link>
          );
        })}
      </div>

      {badges.length > 8 && (
        <Link
          href="/achievements"
          className="block text-center mt-4 text-sm text-teal-600 hover:text-teal-700 font-semibold"
        >
          View all {badges.length} badges
        </Link>
      )}
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/profile/BadgeShowcase.tsx
git commit -m "feat: add badge showcase component for profile"
```

---

### Task 13: Create border customization modal component

**Files:**

- Create: `src/components/profile/BorderCustomizationModal.tsx`

**Step 1: Write component**

```typescript
"use client";

import { useEffect, useState } from "react";

import { XIcon } from "@/components/icons";
import { TIER_LABELS, TIER_LABEL_COLORS } from "@/lib/constants/avatar-borders";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Border = Database["public"]["Tables"]["avatar_borders"]["Row"];

interface BorderCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBorders: Border[];
  earnedBorderIds: Set<string>;
  activeBorderId: string | null;
  onSelectBorder: (borderId: string) => Promise<void>;
}

export default function BorderCustomizationModal({
  isOpen,
  onClose,
  allBorders,
  earnedBorderIds,
  activeBorderId,
  onSelectBorder,
}: BorderCustomizationModalProps) {
  const [selectedPreview, setSelectedPreview] = useState<Border | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const activeBorder = allBorders.find((b) => b.id === activeBorderId);
  const unlockedBorders = allBorders.filter((b) => earnedBorderIds.has(b.id));
  const lockedBorders = allBorders.filter((b) => !earnedBorderIds.has(b.id));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold">Customize Border</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Active border preview */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Active Border</p>
          {activeBorder ? (
            <div>
              <div
                className="w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600"
                style={{
                  border: activeBorder.border_color
                    ? `3px solid ${activeBorder.border_color}`
                    : undefined,
                }}
              >
                <span className="text-3xl">👤</span>
              </div>
              <p className="font-semibold">{activeBorder.name}</p>
            </div>
          ) : (
            <p className="text-gray-500">No border selected</p>
          )}
        </div>

        {/* Unlocked borders */}
        {unlockedBorders.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-heading font-bold mb-4">Your Borders</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {unlockedBorders.map((border) => (
                <button
                  key={border.id}
                  onClick={() => setSelectedPreview(border)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all",
                    activeBorderId === border.id
                      ? "border-teal-600 bg-teal-50 dark:bg-teal-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-teal-400",
                  )}
                >
                  <div
                    className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-400"
                    style={{
                      border: border.border_color ? `2px solid ${border.border_color}` : undefined,
                    }}
                  >
                    <span className="text-lg">🎖️</span>
                  </div>
                  <p className="text-xs font-semibold text-center">{border.name}</p>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setIsUpdating(true);
                      await onSelectBorder(border.id);
                      setIsUpdating(false);
                    }}
                    disabled={isUpdating || activeBorderId === border.id}
                    className={cn(
                      "mt-2 w-full text-xs py-1 rounded",
                      activeBorderId === border.id
                        ? "bg-teal-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800",
                    )}
                  >
                    {activeBorderId === border.id ? "Active" : "Select"}
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Locked borders */}
        {lockedBorders.length > 0 && (
          <div>
            <h3 className="text-lg font-heading font-bold mb-4">Locked Borders</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {lockedBorders.map((border) => (
                <div
                  key={border.id}
                  className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 opacity-50"
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <span className="text-lg opacity-30">🎖️</span>
                  </div>
                  <p className="text-xs font-semibold text-center text-gray-500">{border.name}</p>
                  <p className="text-xs text-gray-400 text-center mt-2">Locked</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Border preview modal */}
        {selectedPreview && (
          <div
            className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center"
            onClick={() => setSelectedPreview(null)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-xl font-bold mb-4">{selectedPreview.name}</h4>
              <div
                className="w-32 h-32 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600"
                style={{
                  border: selectedPreview.border_color
                    ? `4px solid ${selectedPreview.border_color}`
                    : undefined,
                }}
              >
                <span className="text-5xl">👤</span>
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedPreview.description}
              </p>
              <button
                onClick={() => setSelectedPreview(null)}
                className="w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/profile/BorderCustomizationModal.tsx
git commit -m "feat: add border customization modal component"
```

---

## Real-Time Notifications

### Task 14: Create badge unlock modal component

**Files:**

- Create: `src/components/notifications/BadgeUnlockModal.tsx`

**Step 1: Write component**

```typescript
"use client";

import { useEffect, useState } from "react";
import Confetti from "canvas-confetti";

import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Badge = Database["public"]["Tables"]["badges"]["Row"];

interface BadgeUnlockModalProps {
  isOpen: boolean;
  badge: Badge | null;
  isBorder?: boolean;
  stravaActivities?: Array<{
    name: string;
    distance: number;
    date: string;
    strava_url: string;
  }>;
  onClose: () => void;
  onShare?: () => void;
}

export default function BadgeUnlockModal({
  isOpen,
  badge,
  isBorder = false,
  stravaActivities = [],
  onClose,
  onShare,
}: BadgeUnlockModalProps) {
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && !triggerConfetti) {
      setTriggerConfetti(true);
      Confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, triggerConfetti]);

  if (!isOpen || !badge) return null;

  const resolved = resolvePresetImage(badge.image_url);
  const rarityStyle = !isBorder ? RARITY_STYLES[badge.rarity] : {};

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center">
        {/* Badge/Border display */}
        <div
          className={cn(
            "w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center overflow-hidden",
            !isBorder && cn(rarityStyle.ring, rarityStyle.glow),
          )}
        >
          {resolved?.type === "url" ? (
            <img
              src={resolved.url}
              alt={badge.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-6xl">{resolved?.emoji || "🏅"}</span>
          )}
        </div>

        {/* Celebration text */}
        <div className="mb-6">
          <p className="text-4xl mb-2">{isBorder ? "🎖️" : "🎉"}</p>
          <h3 className="text-2xl font-heading font-bold mb-2">
            {isBorder ? "Border Unlocked!" : "Badge Earned!"}
          </h3>
          <p className="text-xl font-semibold text-teal-600">{badge.title}</p>
          {badge.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {badge.description}
            </p>
          )}
        </div>

        {/* Linked activities */}
        {stravaActivities.length > 0 && (
          <div className="mb-6 text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm font-semibold mb-2">Linked Activities</p>
            <div className="space-y-2">
              {stravaActivities.slice(0, 2).map((activity, idx) => (
                <a
                  key={idx}
                  href={activity.strava_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-teal-600 hover:text-teal-700 hover:underline"
                >
                  {activity.name} • {activity.distance.toFixed(1)}km
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
          >
            Close
          </button>
          {onShare && (
            <button
              onClick={onShare}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
            >
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Install canvas-confetti if needed**

Run: `pnpm add canvas-confetti && pnpm add -D @types/canvas-confetti`

**Step 3: Commit**

```bash
git add src/components/notifications/BadgeUnlockModal.tsx
git commit -m "feat: add badge unlock celebration modal with confetti"
```

---

### Task 15: Integrate badge unlock modal into check-in flow

**Files:**

- Modify: `src/app/(frontend)/api/checkins/route.ts`

**Step 1: Update POST /api/checkins to return awarded badges**

Modify the endpoint to return badge data:

```typescript
// At end of successful check-in, after awarding badges:
const { data: awardedBadges } = await supabase
  .from("user_badges")
  .select("badges(*)")
  .eq("user_id", userId)
  .order("awarded_at", { ascending: false })
  .limit(1);

return NextResponse.json({
  success: true,
  checkin,
  awardedBadges: awardedBadges ?? [],
});
```

**Step 2: Update client-side check-in component to show modal**

Find the component that calls `/api/checkins` and update:

```typescript
const response = await fetch("/api/checkins", { method: "POST", body });
const data = await response.json();

if (data.awardedBadges.length > 0) {
  setUnlockedBadge(data.awardedBadges[0].badges);
  setShowBadgeModal(true);
}
```

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/api/checkins/route.ts
git commit -m "feat: return awarded badges from check-in endpoint"
```

---

## Social Sharing & Remaining Components

### Task 16: Create badge detail page with Strava activities

**Files:**

- Modify: `src/app/(frontend)/(participant)/badges/[id]/page.tsx` (if exists) or create it

**Step 1: Create badge detail page**

```typescript
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: badge } = await supabase.from("badges").select("title, description, image_url").eq("id", id).single();

  if (!badge) return { title: "Badge Not Found" };

  return {
    title: `${badge.title} Badge — EventTara`,
    description: badge.description,
  };
}

export default async function BadgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: badge } = await supabase
    .from("badges")
    .select("*")
    .eq("id", id)
    .single();

  if (!badge) notFound();

  const isEarned = user
    ? (await supabase.from("user_badges").select("*").eq("user_id", user.id).eq("badge_id", id).single()).data
    : null;

  const stravaActivities = isEarned
    ? await fetch(`/api/badges/${id}/strava-activities`, {
        headers: { Authorization: `Bearer ${supabase.auth.session()?.access_token}` },
      })
        .then((r) => r.json())
        .catch(() => ({ activities: [] }))
    : { activities: [] };

  const resolved = resolvePresetImage(badge.image_url);
  const rarityStyle = RARITY_STYLES[badge.rarity];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/achievements" className="text-teal-600 hover:text-teal-700 mb-6 inline-block">
        ← Back to Achievements
      </Link>

      <div className="text-center mb-12">
        <div
          className={cn(
            "w-40 h-40 mx-auto mb-6 rounded-full flex items-center justify-center overflow-hidden",
            rarityStyle.ring,
            rarityStyle.glow,
          )}
        >
          {resolved?.type === "url" ? (
            <Image src={resolved.url} alt={badge.title} width={160} height={160} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">{resolved?.emoji || "🏅"}</span>
          )}
        </div>

        <h1 className="text-4xl font-heading font-bold mb-2">{badge.title}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">{badge.description}</p>

        {isEarned && (
          <button
            onClick={() => window.open(`/api/badges/${id}/share?platform=twitter`, "_blank")}
            className="mt-6 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
          >
            Share Badge
          </button>
        )}
      </div>

      {/* Linked activities */}
      {stravaActivities.activities.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-heading font-bold mb-4">Linked Activities</h2>
          <div className="space-y-3">
            {stravaActivities.activities.map((activity: any, idx: number) => (
              <a
                key={idx}
                href={activity.strava_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <p className="font-semibold">{activity.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activity.distance.toFixed(1)}km • {new Date(activity.date).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/badges/\[id\]/page.tsx
git commit -m "feat: add badge detail page with linked Strava activities"
```

---

### Task 17: Create badge share landing page

**Files:**

- Create: `src/app/(frontend)/(participant)/badges/[id]/page-share.tsx` OR use dynamic query parameter

**Step 1: Modify existing badge detail page to support sharing**

Add query parameter handling:

```typescript
// In page.tsx, read ?user=[username] and add OG metadata
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ user?: string }>;
}) {
  const { id } = await params;
  const { user: username } = await searchParams;

  // Generate OG image and metadata for social sharing
  return {
    openGraph: {
      title: `${badge.title} — Earned on EventTara`,
      description: `${username} earned the ${badge.title} badge on EventTara!`,
      image: badge.image_url,
    },
  };
}
```

**Step 2: Commit to existing badge page**

```bash
git add src/app/\(frontend\)/\(participant\)/badges/\[id\]/page.tsx
git commit -m "feat: add OG metadata to badge pages for social sharing"
```

---

### Task 18: Update Supabase types notification types

**Files:**

- Modify: `src/lib/supabase/types.ts`

**Step 1: Update notification type enum**

In the `notifications` table definition, update the `type` field:

```typescript
type:
  | "booking_confirmed"
  | "event_reminder"
  | "badge_earned"
  | "border_earned"
  | "feed_like"
  | "feed_repost"
  | "feed_comment_like"
  | "feed_mention";
```

**Step 2: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "types: add badge_earned and border_earned notification types"
```

---

### Task 19: Update coming_soon_gamification feature flag

**Files:**

- Modify: `scripts/seed-cms.ts`

**Step 1: Enable gamification flag by default in seed**

```typescript
// In the feature flags section
coming_soon_gamification: true, // Enable gamification features
```

**Step 2: Commit**

```bash
git add scripts/seed-cms.ts
git commit -m "feat: enable gamification features in CMS seed"
```

---

## Testing & Integration

### Task 20: Add unit tests for badge progress calculation

**Files:**

- Create: `src/lib/badges/__tests__/calculate-progress.test.ts`

**Step 1: Write tests**

```typescript
import { describe, test, expect, beforeEach, vi } from "vitest";
import { calculateBadgeProgress } from "@/lib/badges/calculate-progress";

describe("calculateBadgeProgress", () => {
  test("returns null for first activity badges", async () => {
    const supabase = {} as any;
    const badge = { criteria_key: "first_hike" } as any;

    const result = await calculateBadgeProgress("user-123", badge, supabase);
    expect(result).toBeNull();
  });

  test("calculates progress for event count badge", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          count: vi.fn().mockResolvedValue({ count: 7 }),
        }),
      }),
    } as any;

    const badge = { criteria_key: "events_10" } as any;
    const result = await calculateBadgeProgress("user-123", badge, mockSupabase);

    expect(result?.current).toBe(7);
    expect(result?.target).toBe(10);
    expect(result?.percent).toBe(70);
    expect(result?.progressText).toBe("7/10 events");
  });
});
```

**Step 2: Run tests**

Run: `pnpm test src/lib/badges/__tests__/calculate-progress.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/badges/__tests__/calculate-progress.test.ts
git commit -m "test: add unit tests for badge progress calculation"
```

---

### Task 21: Verify feature flag integration

**Files:**

- Check: `src/lib/cms/cached.ts` - ensure gamification flag helper exists

**Step 1: Add gamification flag helper if missing**

```typescript
export async function isGamificationComingSoon(): Promise<boolean> {
  try {
    const flags = await getFeatureFlags();
    return flags?.coming_soon_gamification ?? false;
  } catch {
    return false;
  }
}
```

**Step 2: Use in components**

In `LeaderboardsTab`, wrap with:

```typescript
const gamificationEnabled = await isGamificationComingSoon();
if (!gamificationEnabled) return null;
```

**Step 3: Commit**

```bash
git add src/lib/cms/cached.ts
git commit -m "feat: add gamification feature flag helper"
```

---

## Final Steps

### Task 22: Run full test suite and type check

```bash
pnpm typecheck
pnpm format:check
pnpm lint
pnpm test
```

Expected: All pass

### Task 23: Create PR

```bash
git push origin staging
# Then use gh pr create from task-by-task execution session
```

---

## Summary

**Total Tasks: 23**

**Phases:**

1. **Database** (2 tasks) — migrations + types
2. **Data Layer** (2 tasks) — progress calculation + type updates
3. **API Routes** (4 tasks) — leaderboards, Strava activities, sharing, showcase
4. **Achievement Page** (3 tasks) — tabs, progress bars, components
5. **Profile Page** (2 tasks) — showcase, border modal
6. **Notifications** (2 tasks) — modal component, check-in integration
7. **Social Sharing** (2 tasks) — detail page, OG metadata
8. **Integration** (4 tasks) — feature flags, notifications types, tests, verification

**Estimated time:** 4-6 hours for experienced developer

**Key dependencies:**

- Database migrations must run before API routes
- Types must be updated before components compile
- API routes needed before components can fetch data
- Feature flag must be enabled before UI appears

---
