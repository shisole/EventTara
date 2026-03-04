import type { BorderTier } from "@/lib/constants/avatar-borders";
import type { BadgeRarity } from "@/lib/constants/badge-rarity";
import { createClient } from "@/lib/supabase/server";

export interface FeedPreviewItem {
  id: string;
  activityType: "booking" | "checkin" | "badge";
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  borderTier: BorderTier | null;
  borderColor: string | null;
  text: string;
  contextImageUrl: string | null;
  badgeImageUrl: string | null;
  badgeTitle: string | null;
  badgeRarity: BadgeRarity | null;
  timestamp: string;
}

interface RawItem {
  id: string;
  activityType: "booking" | "checkin" | "badge";
  userId: string;
  text: string;
  contextImageUrl: string | null;
  badgeImageUrl: string | null;
  badgeTitle: string | null;
  badgeRarity: BadgeRarity | null;
  timestamp: string;
}

export async function fetchFeedPreviewItems(): Promise<FeedPreviewItem[]> {
  const supabase = await createClient();

  // Phase 1: Fetch recent activities from each source (2 each, merge + sort, take top 3)
  const [{ data: bookings }, { data: checkins }, { data: userBadges }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, user_id, booked_at, status, events(title, cover_image_url), users!inner(is_guest)",
      )
      .in("status", ["pending", "confirmed"])
      .eq("users.is_guest", false)
      .order("booked_at", { ascending: false })
      .limit(2),
    supabase
      .from("event_checkins")
      .select("id, user_id, checked_in_at, events(title, cover_image_url), users!inner(is_guest)")
      .eq("users.is_guest", false)
      .order("checked_in_at", { ascending: false })
      .limit(2),
    supabase
      .from("user_badges")
      .select("id, user_id, awarded_at, badges(title, image_url, rarity), users!inner(is_guest)")
      .eq("users.is_guest", false)
      .order("awarded_at", { ascending: false })
      .limit(2),
  ]);

  const raw: RawItem[] = [];

  for (const b of bookings || []) {
    const event = b.events as any;
    raw.push({
      id: b.id,
      activityType: "booking",
      userId: b.user_id,
      text: `is joining ${event?.title || "an event"}`,
      contextImageUrl: event?.cover_image_url || null,
      badgeImageUrl: null,
      badgeTitle: null,
      badgeRarity: null,
      timestamp: b.booked_at,
    });
  }

  for (const c of checkins || []) {
    const event = c.events as any;
    raw.push({
      id: c.id,
      activityType: "checkin",
      userId: c.user_id,
      text: `completed ${event?.title || "an event"}`,
      contextImageUrl: event?.cover_image_url || null,
      badgeImageUrl: null,
      badgeTitle: null,
      badgeRarity: null,
      timestamp: c.checked_in_at,
    });
  }

  for (const ub of userBadges || []) {
    const badge = ub.badges as any;
    raw.push({
      id: ub.id,
      activityType: "badge",
      userId: ub.user_id,
      text: `earned ${badge?.title || "a badge"}`,
      contextImageUrl: null,
      badgeImageUrl: badge?.image_url || null,
      badgeTitle: badge?.title || null,
      badgeRarity: (badge?.rarity as BadgeRarity) || null,
      timestamp: ub.awarded_at,
    });
  }

  // Sort by most recent, take top 3
  raw.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const top3 = raw.slice(0, 3);

  if (top3.length === 0) return [];

  // Phase 2: Fetch user profiles + borders
  const userIds = [...new Set(top3.map((item) => item.userId))];

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, active_border_id")
    .in("id", userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  // Fetch active borders
  const borderIds = (users || []).filter((u) => u.active_border_id).map((u) => u.active_border_id!);

  const { data: borders } =
    borderIds.length > 0
      ? await supabase.from("avatar_borders").select("id, tier, border_color").in("id", borderIds)
      : { data: [] as { id: string; tier: string; border_color: string | null }[] };

  const borderMap = new Map(
    (borders || []).map((b) => [b.id, { tier: b.tier as BorderTier, color: b.border_color }]),
  );

  return top3.map((item) => {
    const user = userMap.get(item.userId);
    const border = user?.active_border_id ? borderMap.get(user.active_border_id) : null;

    return {
      ...item,
      userName: user?.full_name || "Adventurer",
      userAvatarUrl: user?.avatar_url || null,
      borderTier: border?.tier || null,
      borderColor: border?.color || null,
    };
  });
}
