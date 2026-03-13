import type { SupabaseClient } from "@supabase/supabase-js";

import { ACTIVITY_TYPES } from "@/lib/constants/activity-types";
import type { Database } from "@/lib/supabase/types";

type Badge = Database["public"]["Tables"]["badges"]["Row"];

export interface BadgeProgress {
  current: number;
  target: number;
  percent: number;
  progressText: string;
}

/** First-activity badges have no progress tracking (0 or 1). */
const BINARY_CRITERIA = new Set([
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
  "strava_activities_1",
]);

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

  if (BINARY_CRITERIA.has(key)) return null;

  // Event count badges (5, 10, 25, 50)
  if (key.startsWith("events_")) {
    const target = Number.parseInt(key.split("_")[1], 10);
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

  // Distance badges — based on max single-event distance (matches criteria evaluator)
  if (key.startsWith("distance_")) {
    const distanceMap: Record<string, number> = {
      distance_5k: 5,
      distance_10k: 10,
      distance_21k: 21,
      distance_42k: 42,
      distance_100k: 100,
    };
    const target = distanceMap[key] || 100;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("event_distance_id, event_distances(distance_km)")
      .eq("user_id", userId)
      .in("status", ["confirmed", "pending"] as const);

    let maxDistance = 0;
    for (const booking of bookings ?? []) {
      const ed = booking.event_distances as unknown as { distance_km: number } | null;
      const km = ed?.distance_km ?? 0;
      if (km > maxDistance) maxDistance = km;
    }

    return {
      current: maxDistance,
      target,
      percent: Math.min((maxDistance / target) * 100, 99),
      progressText: `${maxDistance.toFixed(1)}/${target}km`,
    };
  }

  // Summit badges (1, 3, 5, all, igbaras_graduate)
  if (key.startsWith("summits_") || key === "igbaras_graduate") {
    const targetMap: Record<string, number> = {
      summits_1: 1,
      summits_3: 3,
      summits_5: 5,
      summits_all: 999,
      igbaras_graduate: 7,
    };
    const target = targetMap[key] || 1;

    const { data: checkins } = await supabase
      .from("event_checkins")
      .select("event_id")
      .eq("user_id", userId);

    const eventIds = (checkins ?? []).map((c) => c.event_id);
    if (eventIds.length === 0) {
      return { current: 0, target, percent: 0, progressText: `0/${target} summits` };
    }

    const { data: eventMountains } = await supabase
      .from("event_mountains")
      .select("mountain_id")
      .in("event_id", eventIds);

    const mountainSet = new Set((eventMountains ?? []).map((em) => em.mountain_id));
    const current = mountainSet.size;

    return {
      current,
      target: key === "summits_all" ? target : target,
      percent: Math.min((current / target) * 100, 99),
      progressText: `${current}/${target} summits`,
    };
  }

  // All-rounder: requires at least 1 event of each type
  if (key === "all_rounder") {
    const { data: checkins } = await supabase
      .from("event_checkins")
      .select("event_id")
      .eq("user_id", userId);

    const eventIds = (checkins ?? []).map((c) => c.event_id);
    if (eventIds.length === 0) {
      return { current: 0, target: 5, percent: 0, progressText: "0/5 activity types" };
    }

    const { data: events } = await supabase.from("events").select("type").in("id", eventIds);

    const types = new Set<string>((events ?? []).map((e) => e.type));
    const current = ACTIVITY_TYPES.filter((t) => types.has(t)).length;

    return {
      current,
      target: ACTIVITY_TYPES.length,
      percent: Math.min((current / ACTIVITY_TYPES.length) * 100, 99),
      progressText: `${current}/${ACTIVITY_TYPES.length} activity types`,
    };
  }

  // Strava cumulative distance badges
  if (key.startsWith("strava_distance_")) {
    const targetMap: Record<string, number> = {
      strava_distance_50k: 50,
      strava_distance_100k: 100,
      strava_distance_500k: 500,
    };
    const target = targetMap[key] || 100;

    const { data: activities } = await supabase
      .from("strava_activities")
      .select("distance")
      .eq("user_id", userId);

    let totalKm = 0;
    for (const a of activities ?? []) {
      totalKm += (a.distance ?? 0) / 1000;
    }

    return {
      current: Math.round(totalKm * 10) / 10,
      target,
      percent: Math.min((totalKm / target) * 100, 99),
      progressText: `${totalKm.toFixed(1)}km / ${String(target)}km`,
    };
  }

  // Strava cumulative elevation badges
  if (key.startsWith("strava_elevation_")) {
    const targetMap: Record<string, number> = {
      strava_elevation_5000m: 5000,
      strava_elevation_10000m: 10_000,
      strava_elevation_29000m: 29_032,
    };
    const target = targetMap[key] || 5000;

    const { data: activities } = await supabase
      .from("strava_activities")
      .select("total_elevation_gain")
      .eq("user_id", userId);

    let totalM = 0;
    for (const a of activities ?? []) {
      totalM += a.total_elevation_gain ?? 0;
    }

    return {
      current: Math.round(totalM),
      target,
      percent: Math.min((totalM / target) * 100, 99),
      progressText: `${Math.round(totalM).toLocaleString()}m / ${target.toLocaleString()}m`,
    };
  }

  return null;
}
