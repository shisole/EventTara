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

/** Returns count for a given event type, defaulting to 0. */
function typeCount(stats: CheckinStats, eventType: string): number {
  return stats.eventCountByType[eventType] ?? 0;
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
  pioneer: (_stats, pioneerRank) => pioneerRank !== null && pioneerRank <= 100,
};

interface CheckinStats {
  totalCheckins: number;
  eventCountByType: Record<string, number>;
}

/**
 * Evaluates all 11 system badges for a user and awards any newly-earned ones.
 * Called fire-and-forget from the check-in API route -- never throws.
 *
 * @returns Array of newly awarded badge details (for email notification)
 */
export async function checkAndAwardSystemBadges(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<AwardedBadge[]> {
  try {
    // 1. Parallel fetch: check-in stats, existing system badge criteria_keys, and system badge rows from DB
    const [checkinsResult, existingResult, systemBadgesResult] = await Promise.all([
      // User's check-ins joined to events for type
      supabase
        .from("event_checkins")
        .select("event_id, events:event_id(type)")
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
    ]);

    // Build check-in stats
    const checkins = checkinsResult.data ?? [];
    const eventCountByType: Record<string, number> = {};
    let totalCheckins = 0;
    for (const checkin of checkins) {
      totalCheckins++;
      const event = checkin.events as any;
      const eventType = event?.type as string | undefined;
      if (eventType) {
        eventCountByType[eventType] = (eventCountByType[eventType] ?? 0) + 1;
      }
    }
    const stats: CheckinStats = { totalCheckins, eventCountByType };

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

    for (const [criteriaKey, evaluate] of Object.entries(CRITERIA_EVALUATORS)) {
      // Skip if already earned
      if (existingKeys.has(criteriaKey)) continue;

      // Skip if no corresponding DB row (badge not seeded yet)
      const dbId = criteriaKeyToDbId.get(criteriaKey);
      if (!dbId) continue;

      // Evaluate criteria
      if (evaluate(stats, pioneerRank)) {
        newAwards.push({ user_id: userId, badge_id: dbId });

        const meta = badgeMetaByKey.get(criteriaKey);
        if (meta) {
          awardedBadges.push({
            title: meta.title,
            description: meta.description,
            imageUrl: meta.imageUrl,
            criteriaKey: meta.criteriaKey,
          });
        }
      }
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
