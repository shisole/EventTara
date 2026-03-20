import type { SupabaseClient } from "@supabase/supabase-js";

import type { ActivityType } from "@/lib/feed/types";
import type { Database } from "@/lib/supabase/types";

const TABLE_MAP: Record<ActivityType, string> = {
  booking: "bookings",
  checkin: "event_checkins",
  badge: "user_badges",
  border: "user_avatar_borders",
  review: "event_reviews",
  photo: "event_photos",
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
  const table = TABLE_MAP[activityType];
  if (!table) return null;

  const { data } = await supabase
    .from(table as "bookings")
    .select("user_id")
    .eq("id", activityId)
    .single();

  return data?.user_id ?? null;
}
