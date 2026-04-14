import type { SupabaseClient } from "@supabase/supabase-js";

import type { ActivityType } from "@/lib/feed/types";
import type { Database } from "@/lib/supabase/types";

const TABLE_MAP: Record<ActivityType, string | null> = {
  booking: "bookings",
  checkin: "event_checkins",
  badge: "user_badges",
  border: "user_avatar_borders",
  review: "event_reviews",
  photo: "event_photos",
  new_club: null,
  new_event: null,
  new_user: null,
};

/**
 * Resolves the user_id who owns a feed activity (booking, checkin, badge, border).
 * Used by like/repost triggers to determine the notification recipient.
 */
export async function resolveActivityOwner(
  supabase: SupabaseClient<Database>,
  activityType: ActivityType,
  activityId: string,
): Promise<string | null> {
  // For new_user, the activity ID is the user ID itself
  if (activityType === "new_user") {
    return activityId;
  }

  // For clubs, resolve owner via club_members
  if (activityType === "new_club") {
    const { data } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", activityId)
      .eq("role", "owner")
      .maybeSingle();
    return data?.user_id ?? null;
  }

  // For events, resolve owner via club → club_members
  if (activityType === "new_event") {
    const { data: event } = await supabase
      .from("events")
      .select("club_id")
      .eq("id", activityId)
      .single();
    if (!event) return null;
    const { data } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", event.club_id)
      .eq("role", "owner")
      .maybeSingle();
    return data?.user_id ?? null;
  }

  const table = TABLE_MAP[activityType];
  if (!table) return null;

  const { data } = await supabase
    .from(table as "bookings")
    .select("user_id")
    .eq("id", activityId)
    .single();

  return data?.user_id ?? null;
}
