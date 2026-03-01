import { NextResponse } from "next/server";

import type { BorderTier } from "@/lib/constants/avatar-borders";
import type { ActivityType, FeedItem } from "@/lib/feed/types";
import { createClient } from "@/lib/supabase/server";

const BATCH_SIZE = 15;

interface RawActivity {
  id: string;
  activityType: ActivityType;
  userId: string;
  text: string;
  contextImageUrl: string | null;
  timestamp: string;
  repostedBy?: { userId: string; createdAt: string };
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

  // Phase 1: Fetch all activity sources in parallel
  const [
    { data: bookings },
    { data: checkins },
    { data: userBadges },
    { data: userBorders },
    { data: reposts },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, user_id, booked_at, status, events(title, cover_image_url), users!inner(is_guest)",
      )
      .in("status", ["pending", "confirmed"])
      .eq("users.is_guest", false)
      .order("booked_at", { ascending: false })
      .limit(fetchLimit),
    supabase
      .from("event_checkins")
      .select("id, user_id, checked_in_at, events(title, cover_image_url), users!inner(is_guest)")
      .eq("users.is_guest", false)
      .order("checked_in_at", { ascending: false })
      .limit(fetchLimit),
    supabase
      .from("user_badges")
      .select("id, user_id, awarded_at, badges(title, image_url), users!inner(is_guest)")
      .eq("users.is_guest", false)
      .order("awarded_at", { ascending: false })
      .limit(fetchLimit),
    supabase
      .from("user_avatar_borders")
      .select("id, user_id, awarded_at, avatar_borders(name, tier), users!inner(is_guest)")
      .eq("users.is_guest", false)
      .order("awarded_at", { ascending: false })
      .limit(fetchLimit),
    supabase
      .from("feed_reposts")
      .select("id, user_id, activity_type, activity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(fetchLimit),
  ]);

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

  // Build a lookup from the original activities so we can create repost entries
  const activityLookup = new Map<string, RawActivity>();
  for (const a of activities) {
    activityLookup.set(`${a.activityType}:${a.id}`, a);
  }

  // Inject repost entries as duplicates with repostedBy attribution
  for (const rp of reposts || []) {
    const originalKey = `${rp.activity_type}:${rp.activity_id}`;
    const original = activityLookup.get(originalKey);
    if (original) {
      activities.push({
        ...original,
        timestamp: rp.created_at,
        repostedBy: { userId: rp.user_id, createdAt: rp.created_at },
      });
    }
  }

  // Deduplicate: if a repost exists for an activity, remove the original entry
  const repostedKeys = new Set(
    activities.filter((a) => a.repostedBy).map((a) => `${a.activityType}:${a.id}`),
  );
  const deduped = activities.filter(
    (a) => a.repostedBy || !repostedKeys.has(`${a.activityType}:${a.id}`),
  );

  // Sort by timestamp descending, then paginate
  deduped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const paged = deduped.slice(offset, offset + limit);

  if (paged.length === 0) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  // Collect unique user IDs (including reposters)
  const userIdSet = new Set(paged.map((a) => a.userId));
  for (const a of paged) {
    if (a.repostedBy) userIdSet.add(a.repostedBy.userId);
  }
  const userIds = [...userIdSet];
  const activityIds = paged.map((a) => a.id);

  // Phase 2: Fetch user profiles (needed for organizer/border lookups)
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, username, avatar_url, active_border_id, role")
    .in("id", userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  // Derive IDs needed for sub-queries
  const organizerUserIds = (users || []).filter((u) => u.role === "organizer").map((u) => u.id);
  const borderIds = (users || []).filter((u) => u.active_border_id).map((u) => u.active_border_id!);

  // Phase 3: Fetch all enrichment data in parallel
  interface OrgProfile {
    id: string;
    user_id: string;
  }
  interface BorderRow {
    id: string;
    tier: string;
    border_color: string | null;
  }
  interface TopBadgeRow {
    user_id: string;
    badges: any;
  }
  interface ReactionRow {
    activity_type: string;
    activity_id: string;
    user_id: string;
  }
  interface CommentRow {
    activity_type: string;
    activity_id: string;
  }
  interface FollowRow {
    following_id: string;
  }

  const [
    orgResult,
    borderResult,
    topBadgeResult,
    reactionsResult,
    commentsResult,
    repostsResult,
    followsResult,
  ] = await Promise.all([
    // Organizer profiles
    organizerUserIds.length > 0
      ? supabase.from("organizer_profiles").select("id, user_id").in("user_id", organizerUserIds)
      : Promise.resolve({ data: [] as OrgProfile[] }),
    // Avatar borders
    borderIds.length > 0
      ? supabase.from("avatar_borders").select("id, tier, border_color").in("id", borderIds)
      : Promise.resolve({ data: [] as BorderRow[] }),
    // Top badge per user
    supabase
      .from("user_badges")
      .select("user_id, badges(title)")
      .in("user_id", userIds)
      .order("awarded_at", { ascending: false }),
    // Reactions
    supabase
      .from("feed_reactions")
      .select("activity_type, activity_id, user_id")
      .in("activity_id", activityIds),
    // Comment counts
    supabase
      .from("feed_comments")
      .select("activity_type, activity_id")
      .in("activity_id", activityIds),
    // Repost counts
    supabase
      .from("feed_reposts")
      .select("activity_type, activity_id, user_id")
      .in("activity_id", activityIds),
    // Follow status
    authUser
      ? supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", authUser.id)
          .in("following_id", userIds)
      : Promise.resolve({ data: [] as FollowRow[] }),
  ]);

  // Build organizer map
  const organizerMap = new Map<string, string>();
  for (const op of (orgResult.data as OrgProfile[]) || []) {
    organizerMap.set(op.user_id, op.id);
  }

  // Build border map
  const borderMap = new Map<string, { tier: BorderTier; color: string | null }>();
  for (const b of (borderResult.data as BorderRow[]) || []) {
    borderMap.set(b.id, { tier: b.tier as BorderTier, color: b.border_color });
  }

  // Build top badge map
  const topBadgeMap = new Map<string, string | null>();
  for (const tb of (topBadgeResult.data as TopBadgeRow[]) || []) {
    if (!topBadgeMap.has(tb.user_id)) {
      topBadgeMap.set(tb.user_id, tb.badges?.title || null);
    }
  }

  // Build like counts and user like status
  const likeMap = new Map<string, { count: number; isLiked: boolean }>();
  for (const r of (reactionsResult.data as ReactionRow[]) || []) {
    const key = `${r.activity_type}:${r.activity_id}`;
    if (!likeMap.has(key)) {
      likeMap.set(key, { count: 0, isLiked: false });
    }
    const entry = likeMap.get(key)!;
    entry.count++;
    if (r.user_id === authUser?.id) {
      entry.isLiked = true;
    }
  }

  // Build comment count map
  const commentCountMap = new Map<string, number>();
  for (const c of (commentsResult.data as CommentRow[]) || []) {
    const key = `${c.activity_type}:${c.activity_id}`;
    commentCountMap.set(key, (commentCountMap.get(key) || 0) + 1);
  }

  // Build repost count map and user repost status
  const repostMap = new Map<string, { count: number; isReposted: boolean }>();
  for (const r of (repostsResult.data as ReactionRow[]) || []) {
    const key = `${r.activity_type}:${r.activity_id}`;
    if (!repostMap.has(key)) {
      repostMap.set(key, { count: 0, isReposted: false });
    }
    const entry = repostMap.get(key)!;
    entry.count++;
    if (r.user_id === authUser?.id) {
      entry.isReposted = true;
    }
  }

  // Build follow set
  const followingSet = new Set<string>();
  for (const f of (followsResult.data as FollowRow[]) || []) {
    followingSet.add(f.following_id);
  }

  // Build final feed items
  const items: FeedItem[] = paged.map((a) => {
    const user = userMap.get(a.userId);
    const key = `${a.activityType}:${a.id}`;
    const like = likeMap.get(key);
    const repost = repostMap.get(key);
    const border = user?.active_border_id ? borderMap.get(user.active_border_id) : null;

    const item: FeedItem = {
      feedKey: a.repostedBy
        ? `repost-${a.repostedBy.userId}-${a.activityType}-${a.id}`
        : `${a.activityType}-${a.id}`,
      id: a.id,
      activityType: a.activityType,
      userId: a.userId,
      userName: user?.full_name || "Unknown",
      userUsername: user?.username || null,
      userAvatarUrl: user?.avatar_url || null,
      userRole: user?.role || null,
      organizerProfileId: organizerMap.get(a.userId) || null,
      borderTier: border?.tier || null,
      borderColor: border?.color || null,
      topBadgeTitle: topBadgeMap.get(a.userId) || null,
      text: a.text,
      contextImageUrl: a.contextImageUrl,
      timestamp: a.timestamp,
      isFollowing: followingSet.has(a.userId),
      likeCount: like?.count || 0,
      isLiked: like?.isLiked || false,
      commentCount: commentCountMap.get(key) || 0,
      repostCount: repost?.count || 0,
      isReposted: repost?.isReposted || false,
    };

    if (a.repostedBy) {
      const reposter = userMap.get(a.repostedBy.userId);
      item.repostedBy = {
        userName: reposter?.full_name || "Someone",
        userUsername: reposter?.username || null,
      };
    }

    return item;
  });

  return NextResponse.json({
    items,
    hasMore: deduped.length > offset + limit,
  });
}
