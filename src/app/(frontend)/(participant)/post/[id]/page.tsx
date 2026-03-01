import { type Metadata } from "next";
import { notFound } from "next/navigation";

import PostView from "@/components/feed/PostView";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import type { BadgeCategory, BadgeRarity } from "@/lib/constants/badge-rarity";
import type { ActivityType, FeedItem } from "@/lib/feed/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Post",
};

interface RawActivity {
  id: string;
  activityType: ActivityType;
  userId: string;
  text: string;
  contextImageUrl: string | null;
  badgeId: string | null;
  badgeTitle: string | null;
  badgeImageUrl: string | null;
  badgeRarity: BadgeRarity | null;
  badgeCategory: BadgeCategory | null;
  timestamp: string;
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Look up the activity across all 4 tables in parallel
  const [{ data: booking }, { data: checkin }, { data: userBadge }, { data: userBorder }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id, user_id, booked_at, status, events(title, cover_image_url)")
        .eq("id", id)
        .in("status", ["pending", "confirmed"])
        .maybeSingle(),
      supabase
        .from("event_checkins")
        .select("id, user_id, checked_in_at, events(title, cover_image_url)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("user_badges")
        .select("id, user_id, awarded_at, badges(id, title, image_url, rarity, category)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("user_avatar_borders")
        .select("id, user_id, awarded_at, avatar_borders(name, tier)")
        .eq("id", id)
        .maybeSingle(),
    ]);

  // Determine which table matched
  let activity: RawActivity | null = null;

  const nullBadge = {
    badgeId: null,
    badgeTitle: null,
    badgeImageUrl: null,
    badgeRarity: null,
    badgeCategory: null,
  } as const;

  if (booking) {
    const event = booking.events as any;
    activity = {
      id: booking.id,
      activityType: "booking",
      userId: booking.user_id,
      text: `is joining ${event?.title || "an event"}`,
      contextImageUrl: event?.cover_image_url || null,
      ...nullBadge,
      timestamp: booking.booked_at,
    };
  } else if (checkin) {
    const event = checkin.events as any;
    activity = {
      id: checkin.id,
      activityType: "checkin",
      userId: checkin.user_id,
      text: `completed ${event?.title || "an event"}`,
      contextImageUrl: event?.cover_image_url || null,
      ...nullBadge,
      timestamp: checkin.checked_in_at,
    };
  } else if (userBadge) {
    const badge = userBadge.badges as any;
    activity = {
      id: userBadge.id,
      activityType: "badge",
      userId: userBadge.user_id,
      text: `earned ${badge?.title || "a badge"}`,
      contextImageUrl: null,
      badgeId: badge?.id || null,
      badgeTitle: badge?.title || null,
      badgeImageUrl: badge?.image_url || null,
      badgeRarity: badge?.rarity || null,
      badgeCategory: badge?.category || null,
      timestamp: userBadge.awarded_at,
    };
  } else if (userBorder) {
    const border = userBorder.avatar_borders as any;
    activity = {
      id: userBorder.id,
      activityType: "border",
      userId: userBorder.user_id,
      text: `unlocked ${border?.tier || ""} ${border?.name || "border"}`,
      contextImageUrl: null,
      ...nullBadge,
      timestamp: userBorder.awarded_at,
    };
  }

  if (!activity) notFound();

  // Fetch user profile
  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, username, avatar_url, active_border_id, role")
    .eq("id", activity.userId)
    .single();

  if (!user) notFound();

  // Derive IDs for sub-queries
  const borderIds = user.active_border_id ? [user.active_border_id] : [];
  const isOrganizer = user.role === "organizer";

  // Fetch all enrichment data in parallel
  const [
    orgResult,
    borderResult,
    topBadgeResult,
    reactionsResult,
    commentsResult,
    repostsResult,
    followResult,
  ] = await Promise.all([
    isOrganizer
      ? supabase.from("organizer_profiles").select("id, user_id").eq("user_id", user.id).single()
      : Promise.resolve({ data: null }),
    borderIds.length > 0
      ? supabase
          .from("avatar_borders")
          .select("id, tier, border_color")
          .in("id", borderIds)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("user_badges")
      .select("user_id, badges(title)")
      .eq("user_id", user.id)
      .order("awarded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("feed_reactions")
      .select("activity_type, activity_id, user_id")
      .eq("activity_id", activity.id),
    supabase
      .from("feed_comments")
      .select("activity_type, activity_id")
      .eq("activity_id", activity.id),
    supabase
      .from("feed_reposts")
      .select("activity_type, activity_id, user_id")
      .eq("activity_id", activity.id),
    authUser
      ? supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", authUser.id)
          .eq("following_id", activity.userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Compute counts
  const reactions = reactionsResult.data || [];
  const likeCount = reactions.length;
  const isLiked = authUser ? reactions.some((r: any) => r.user_id === authUser.id) : false;

  const commentCount = (commentsResult.data || []).length;

  const reposts = repostsResult.data || [];
  const repostCount = reposts.length;
  const isReposted = authUser ? reposts.some((r: any) => r.user_id === authUser.id) : false;

  const border = borderResult.data as { tier: string; border_color: string | null } | null;
  const topBadge = topBadgeResult.data as { badges: any } | null;

  const item: FeedItem = {
    feedKey: `${activity.activityType}-${activity.id}`,
    id: activity.id,
    activityType: activity.activityType,
    userId: activity.userId,
    userName: user.full_name || "Unknown",
    userUsername: user.username || null,
    userAvatarUrl: user.avatar_url || null,
    userRole: user.role || null,
    organizerProfileId: (orgResult.data as any)?.id || null,
    borderTier: (border?.tier as BorderTier) || null,
    borderColor: border?.border_color || null,
    topBadgeTitle: topBadge?.badges?.title || null,
    text: activity.text,
    contextImageUrl: activity.contextImageUrl,
    badgeId: activity.badgeId,
    badgeTitle: activity.badgeTitle,
    badgeImageUrl: activity.badgeImageUrl,
    badgeRarity: activity.badgeRarity,
    badgeCategory: activity.badgeCategory,
    timestamp: activity.timestamp,
    isFollowing: !!followResult.data,
    likeCount,
    isLiked,
    commentCount,
    repostCount,
    isReposted,
  };

  return <PostView item={item} isAuthenticated={!!authUser} currentUserId={authUser?.id || null} />;
}
