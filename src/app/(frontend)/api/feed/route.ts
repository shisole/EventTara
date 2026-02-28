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
  const offset = Number.parseInt(searchParams.get("offset") || "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") || String(BATCH_SIZE), 10);

  const supabase = await createClient();

  // Current user (optional — feed is public)
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

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

  // Collect unique user IDs
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

  // Fetch reactions for paged activities
  const activityIds = paged.map((a) => a.id);

  const { data: reactions } = await supabase
    .from("feed_reactions")
    .select("activity_type, activity_id, emoji, user_id")
    .in("activity_id", activityIds);

  // Build reaction summaries
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
    entry.counts.set(r.emoji, (entry.counts.get(r.emoji) || 0) + 1);
    if (r.user_id === authUser?.id) {
      entry.userEmojis.add(r.emoji);
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
