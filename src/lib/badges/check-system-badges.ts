import type { SupabaseClient } from "@supabase/supabase-js";

import { SYSTEM_BADGES } from "@/lib/constants/system-badges";
import type { Database } from "@/lib/supabase/types";

export interface AwardedBadge {
  title: string;
  description: string;
  imageUrl: string;
  criteriaKey: string;
}

const ALL_EVENT_TYPES = ["hiking", "running", "road_bike", "mtb", "trail_run"];

/** The 7 Igbaras peaks required for the "Igbaras Graduate" badge. */
const IGBARAS_PEAKS = [
  "Mt. Igatmon",
  "Mt. Napulak",
  "Mt. Opao",
  "Mt. Taripis",
  "Bato Igmatindog",
  "Mt. Loboc",
  "Mt. Pulang Lupa",
];

/** Returns count for a given event type, defaulting to 0. */
function typeCount(stats: CheckinStats, eventType: string): number {
  return stats.eventCountByType[eventType] ?? 0;
}

/**
 * Converts a mountain name to the criteria_key format used by mountain location badges.
 * e.g., "Mt. Madja-as" → "mountain_mt__madja-as"
 */
function mountainNameToCriteriaKey(name: string): string {
  return `mountain_${name.toLowerCase().replaceAll(/[.\s]+/g, "_")}`;
}

const CRITERIA_EVALUATORS: Record<
  string,
  (stats: CheckinStats, pioneerRank: number | null) => boolean
> = {
  first_hike: (stats) => typeCount(stats, "hiking") >= 1,
  first_run: (stats) => typeCount(stats, "running") >= 1,
  first_road_ride: (stats) => typeCount(stats, "road_bike") >= 1,
  first_mtb: (stats) => typeCount(stats, "mtb") >= 1,
  first_trail_run: (stats) => typeCount(stats, "trail_run") >= 1,
  all_rounder: (stats) => ALL_EVENT_TYPES.every((type) => typeCount(stats, type) >= 1),
  events_5: (stats) => stats.totalCheckins >= 5,
  events_10: (stats) => stats.totalCheckins >= 10,
  events_25: (stats) => stats.totalCheckins >= 25,
  events_50: (stats) => stats.totalCheckins >= 50,
  distance_5k: (stats) => stats.maxDistanceKm >= 5,
  distance_10k: (stats) => stats.maxDistanceKm >= 10,
  distance_21k: (stats) => stats.maxDistanceKm >= 21,
  distance_42k: (stats) => stats.maxDistanceKm >= 42,
  distance_100k: (stats) => stats.maxDistanceKm >= 100,
  strava_connected: (stats) => stats.hasStravaConnection,
  pioneer: (_stats, pioneerRank) => pioneerRank !== null && pioneerRank <= 100,
  // Summit milestones
  summits_1: (stats) => stats.summitedMountainNames.size > 0,
  summits_3: (stats) => stats.summitedMountainNames.size >= 3,
  summits_5: (stats) => stats.summitedMountainNames.size >= 5,
  summits_all: (stats) =>
    stats.totalMountainCount > 0 && stats.summitedMountainNames.size >= stats.totalMountainCount,
  igbaras_graduate: (stats) => IGBARAS_PEAKS.every((peak) => stats.summitedMountainNames.has(peak)),
};

interface CheckinStats {
  totalCheckins: number;
  eventCountByType: Record<string, number>;
  maxDistanceKm: number;
  hasStravaConnection: boolean;
  /** Distinct mountain names the user has summited (from completed events) */
  summitedMountainNames: Set<string>;
  /** Total number of mountains in the mountains table */
  totalMountainCount: number;
}

/**
 * Evaluates all system badges for a user and awards any newly-earned ones.
 * Called fire-and-forget from the check-in API route -- never throws.
 *
 * @returns Array of newly awarded badge details (for email notification)
 */
export async function checkAndAwardSystemBadges(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<AwardedBadge[]> {
  try {
    // 1. Parallel fetch: check-in stats, existing system badge criteria_keys, system badge rows, distance data, Strava connection, and mountain data
    const [
      checkinsResult,
      existingResult,
      systemBadgesResult,
      distanceResult,
      stravaResult,
      mountainCheckinsResult,
      mountainCountResult,
    ] = await Promise.all([
      // User's check-ins joined to events for type and status
      supabase
        .from("event_checkins")
        .select("event_id, events:event_id(type, status)")
        .eq("user_id", userId),

      // User's existing system badges only (via inner join to badges table)
      supabase
        .from("user_badges")
        .select("badge_id, badges:badge_id!inner(criteria_key)")
        .eq("user_id", userId)
        .eq("badges.type" as any, "system"),

      // All system badge rows from DB (need their IDs for insert)
      supabase
        .from("badges")
        .select("id, criteria_key")
        .eq("type", "system")
        .not("criteria_key", "is", null),

      // User's bookings with distance info (for distance milestone badges)
      supabase
        .from("bookings")
        .select("event_id, event_distance_id, event_distances:event_distance_id(distance_km)")
        .eq("user_id", userId)
        .not("event_distance_id", "is", null),

      // Strava connection check
      supabase.from("strava_connections").select("user_id").eq("user_id", userId).limit(1),

      // User's check-ins joined to event_mountains → mountains (for mountain badges)
      supabase
        .from("event_checkins")
        .select(
          "event_id, events:event_id(status, event_mountains(mountain_id, mountains:mountain_id(name)))",
        )
        .eq("user_id", userId),

      // Total mountain count in the system
      supabase.from("mountains").select("id", { count: "exact", head: true }),
    ]);

    // Build check-in stats
    const checkins = checkinsResult.data ?? [];
    const checkedInEventIds = new Set<string>();
    const completedCheckedInEventIds = new Set<string>();
    const eventCountByType: Record<string, number> = {};
    let totalCheckins = 0;
    for (const checkin of checkins) {
      totalCheckins++;
      checkedInEventIds.add(checkin.event_id);
      const event = checkin.events as any;
      const eventType = event?.type as string | undefined;
      if (eventType) {
        eventCountByType[eventType] = (eventCountByType[eventType] ?? 0) + 1;
      }
      if (event?.status === "completed") {
        completedCheckedInEventIds.add(checkin.event_id);
      }
    }

    // Find max distance from completed checked-in events only
    let maxDistanceKm = 0;
    for (const booking of distanceResult.data ?? []) {
      if (!completedCheckedInEventIds.has(booking.event_id)) continue;
      const dist = (booking.event_distances as any)?.distance_km as number | undefined;
      if (dist && dist > maxDistanceKm) {
        maxDistanceKm = dist;
      }
    }

    // Build summited mountain names from completed events only
    const summitedMountainNames = new Set<string>();
    for (const checkin of mountainCheckinsResult.data ?? []) {
      const event = checkin.events as any;
      if (event?.status !== "completed") continue;
      const eventMountains = event?.event_mountains ?? [];
      for (const em of eventMountains) {
        const mountain = em.mountains;
        if (mountain?.name) {
          summitedMountainNames.add(mountain.name as string);
        }
      }
    }

    const hasStravaConnection = (stravaResult.data?.length ?? 0) > 0;
    const stats: CheckinStats = {
      totalCheckins,
      eventCountByType,
      maxDistanceKm,
      hasStravaConnection,
      summitedMountainNames,
      totalMountainCount: mountainCountResult.count ?? 0,
    };

    // Build set of already-earned criteria keys
    const existingKeys = new Set<string>();
    for (const row of existingResult.data ?? []) {
      const badge = row.badges as any;
      if (badge?.criteria_key) {
        existingKeys.add(badge.criteria_key);
      }
    }

    // Build lookup: criteria_key -> badge DB id
    const criteriaKeyToDbId = new Map<string, string>();
    for (const row of systemBadgesResult.data ?? []) {
      if (row.criteria_key) {
        criteriaKeyToDbId.set(row.criteria_key, row.id);
      }
    }

    // 2. Pioneer rank check: only query if user doesn't already have the pioneer badge
    let pioneerRank: number | null = null;
    if (!existingKeys.has("pioneer") && totalCheckins > 0) {
      pioneerRank = await getPioneerRank(userId, supabase);
    }

    // 3. Evaluate all criteria, find newly earned badges
    const newAwards: { user_id: string; badge_id: string }[] = [];
    const awardedBadges: AwardedBadge[] = [];

    // Build criteria_key -> SYSTEM_BADGES metadata lookup
    const badgeMetaByKey = new Map(SYSTEM_BADGES.map((b) => [b.criteriaKey, b]));

    // Helper to try awarding a badge by criteria key
    const tryAward = (criteriaKey: string) => {
      if (existingKeys.has(criteriaKey)) return;
      const dbId = criteriaKeyToDbId.get(criteriaKey);
      if (!dbId) return;

      newAwards.push({ user_id: userId, badge_id: dbId });

      // Try SYSTEM_BADGES metadata first, fall back to DB badge title for mountain badges
      const meta = badgeMetaByKey.get(criteriaKey);
      if (meta) {
        awardedBadges.push({
          title: meta.title,
          description: meta.description,
          imageUrl: meta.imageUrl,
          criteriaKey: meta.criteriaKey,
        });
      }
    };

    // Evaluate static criteria evaluators
    for (const [criteriaKey, evaluate] of Object.entries(CRITERIA_EVALUATORS)) {
      if (existingKeys.has(criteriaKey)) continue;
      if (!criteriaKeyToDbId.has(criteriaKey)) continue;
      if (evaluate(stats, pioneerRank)) {
        tryAward(criteriaKey);
      }
    }

    // Evaluate dynamic mountain location badges (mountain_* criteria keys)
    // These are seeded into the DB but not in CRITERIA_EVALUATORS
    for (const mountainName of summitedMountainNames) {
      const criteriaKey = mountainNameToCriteriaKey(mountainName);
      if (existingKeys.has(criteriaKey)) continue;
      if (!criteriaKeyToDbId.has(criteriaKey)) continue;
      tryAward(criteriaKey);
    }

    // 4. Bulk upsert new user_badges rows
    if (newAwards.length > 0) {
      await supabase.from("user_badges").upsert(newAwards, {
        onConflict: "user_id,badge_id",
        ignoreDuplicates: true,
      });
    }

    return awardedBadges;
  } catch (error) {
    console.error("[checkAndAwardSystemBadges] Error evaluating badges:", error);
    return [];
  }
}

/**
 * Determines the user's "pioneer rank" — how many distinct users had their
 * first check-in before this user. Returns null if the user has no check-ins.
 */
async function getPioneerRank(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<number | null> {
  // Get this user's earliest check-in timestamp
  const { data: firstCheckin } = await supabase
    .from("event_checkins")
    .select("checked_in_at")
    .eq("user_id", userId)
    .order("checked_in_at", { ascending: true })
    .limit(1)
    .single();

  if (!firstCheckin) return null;

  // Count distinct users whose first check-in is before this user's.
  // Supabase doesn't support COUNT(DISTINCT ...) directly, so we fetch
  // user_ids of all check-ins before this user's first and deduplicate in JS.
  const { data: earlierUsers } = await supabase
    .from("event_checkins")
    .select("user_id")
    .lt("checked_in_at", firstCheckin.checked_in_at);

  const distinctEarlierUsers = new Set((earlierUsers ?? []).map((r) => r.user_id));
  return distinctEarlierUsers.size + 1; // 1-based rank
}
