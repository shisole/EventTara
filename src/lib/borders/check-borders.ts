import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type AvatarBorderRow = Database["public"]["Tables"]["avatar_borders"]["Row"];

interface UserStats {
  signupDate: string;
  /** Count of checked-in events (completed) */
  eventCountByType: Record<string, number>;
  totalCheckins: number;
  /** Distinct mountains by province (from checked-in hiking events) */
  mountainsByProvince: Record<string, number>;
  /** Count of events organized (published/completed) */
  organizedEventCount: number;
}

/**
 * Checks all avatar border criteria against a user's stats
 * and awards any newly-earned borders. Called on profile page load
 * and after check-ins.
 */
export async function checkAndAwardBorders(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  // Fetch all borders and user's existing awards in parallel
  const [bordersResult, existingResult, stats] = await Promise.all([
    supabase.from("avatar_borders").select("*").order("sort_order"),
    supabase.from("user_avatar_borders").select("border_id").eq("user_id", userId),
    getUserStats(userId, supabase),
  ]);

  const allBorders = bordersResult.data ?? [];
  const existingBorderIds = new Set((existingResult.data ?? []).map((r) => r.border_id));

  // Find newly earned borders
  const newAwards: { user_id: string; border_id: string }[] = [];

  for (const border of allBorders) {
    if (existingBorderIds.has(border.id)) continue;
    if (checkCriteria(border, stats)) {
      newAwards.push({ user_id: userId, border_id: border.id });
    }
  }

  // Batch insert new awards
  if (newAwards.length > 0) {
    await supabase.from("user_avatar_borders").insert(newAwards);
  }
}

async function getUserStats(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<UserStats> {
  // Run all stat queries in parallel
  const [userResult, checkinsResult, organizedResult, mountainsResult] = await Promise.all([
    // 1. User signup date
    supabase.from("users").select("created_at").eq("id", userId).single(),

    // 2. Check-ins with event type
    supabase.from("event_checkins").select("event_id, events:event_id(type)").eq("user_id", userId),

    // 3. Organized events count
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", userId)
      .in("status", ["published", "completed"]),

    // 4. Mountains from checked-in hiking events
    supabase
      .from("event_checkins")
      .select(
        "event_id, events:event_id(type, event_mountains(mountain_id, mountains:mountain_id(province)))",
      )
      .eq("user_id", userId),
  ]);

  const signupDate = userResult.data?.created_at ?? "";

  // Count events by type from check-ins
  const eventCountByType: Record<string, number> = {};
  let totalCheckins = 0;
  const checkins = checkinsResult.data ?? [];
  for (const checkin of checkins) {
    totalCheckins++;
    const event = checkin.events as any;
    const eventType = event?.type;
    if (eventType) {
      eventCountByType[eventType] = (eventCountByType[eventType] ?? 0) + 1;
    }
  }

  // Count distinct mountains by province
  const mountainsByProvince: Record<string, number> = {};
  const seenMountains = new Set<string>();
  const mountainCheckins = mountainsResult.data ?? [];
  for (const checkin of mountainCheckins) {
    const event = checkin.events as any;
    const eventMountains = event?.event_mountains ?? [];
    for (const em of eventMountains) {
      const mountain = em.mountains;
      if (mountain && !seenMountains.has(em.mountain_id)) {
        seenMountains.add(em.mountain_id);
        const province = mountain.province;
        mountainsByProvince[province] = (mountainsByProvince[province] ?? 0) + 1;
      }
    }
  }

  return {
    signupDate,
    eventCountByType,
    totalCheckins,
    mountainsByProvince,
    organizedEventCount: organizedResult.count ?? 0,
  };
}

function checkCriteria(border: AvatarBorderRow, stats: UserStats): boolean {
  const criteria = border.criteria_value as Record<string, any>;

  switch (border.criteria_type) {
    case "signup_date": {
      const before = criteria.before as string;
      return stats.signupDate !== "" && stats.signupDate < before;
    }

    case "event_count": {
      const minEvents = criteria.min_events as number;
      return stats.totalCheckins >= minEvents;
    }

    case "event_type_count": {
      const eventType = criteria.event_type as string;
      const minEvents = criteria.min_events as number;
      return (stats.eventCountByType[eventType] ?? 0) >= minEvents;
    }

    case "all_activities": {
      const requiredTypes = criteria.required_types as string[];
      return requiredTypes.every((type) => (stats.eventCountByType[type] ?? 0) >= 1);
    }

    case "mountain_region": {
      const province = criteria.province as string;
      const mountainCount = criteria.mountain_count as number;
      return (stats.mountainsByProvince[province] ?? 0) >= mountainCount;
    }

    case "organizer_event_count": {
      const minEvents = criteria.min_events as number;
      return stats.organizedEventCount >= minEvents;
    }

    default: {
      return false;
    }
  }
}
