import type { SupabaseClient } from "@supabase/supabase-js";

import { createNotifications } from "@/lib/notifications/create";
import type { Database } from "@/lib/supabase/types";

const PIONEER_PARTICIPANT_CAP = 250;
const PIONEER_ORGANIZER_CAP = 50;

/**
 * Batch-evaluate and award pioneer badges + first review badges.
 * Called by the cron endpoint every 6 hours.
 */
export async function checkAndAwardPioneerBadges(
  supabase: SupabaseClient<Database>,
): Promise<{ participantsAwarded: number; organizersAwarded: number; reviewsAwarded: number }> {
  const result = { participantsAwarded: 0, organizersAwarded: 0, reviewsAwarded: 0 };

  // --- Pioneer Participant: first 250 non-guest users by created_at ---
  result.participantsAwarded = await awardBadgeForSet(supabase, "pioneer_participant", async () => {
    const { data } = await supabase
      .from("users")
      .select("id")
      .neq("role", "guest")
      .order("created_at", { ascending: true })
      .limit(PIONEER_PARTICIPANT_CAP);
    return (data ?? []).map((u) => u.id);
  });

  // --- Pioneer Organizer: first 50 organizer profiles by created_at ---
  result.organizersAwarded = await awardBadgeForSet(supabase, "pioneer_organizer", async () => {
    const { data } = await supabase
      .from("organizer_profiles")
      .select("user_id")
      .order("created_at", { ascending: true })
      .limit(PIONEER_ORGANIZER_CAP);
    return (data ?? []).map((o) => o.user_id).filter((id): id is string => id !== null);
  });

  // --- First Review: distinct users who have at least one non-anonymous club review ---
  result.reviewsAwarded = await awardBadgeForSet(supabase, "first_review", async () => {
    const { data } = await supabase
      .from("club_reviews")
      .select("user_id")
      .eq("is_anonymous", false);
    const unique = [...new Set((data ?? []).map((r) => r.user_id))];
    return unique;
  });

  return result;
}

/**
 * Generic helper: find badge by criteria_key, find eligible users missing it, bulk award.
 */
async function awardBadgeForSet(
  supabase: SupabaseClient<Database>,
  criteriaKey: string,
  getEligibleUserIds: () => Promise<string[]>,
): Promise<number> {
  // Look up the badge row
  const { data: badge } = await supabase
    .from("badges")
    .select("id, title")
    .eq("criteria_key", criteriaKey)
    .eq("type", "system")
    .single();

  if (!badge) return 0;

  const eligibleUserIds = await getEligibleUserIds();
  if (eligibleUserIds.length === 0) return 0;

  // Find which users already have this badge
  const { data: existing } = await supabase
    .from("user_badges")
    .select("user_id")
    .eq("badge_id", badge.id)
    .in("user_id", eligibleUserIds);

  const alreadyAwarded = new Set((existing ?? []).map((r) => r.user_id));
  const toAward = eligibleUserIds.filter((id) => !alreadyAwarded.has(id));
  if (toAward.length === 0) return 0;

  // Bulk insert user_badges
  const rows = toAward.map((userId) => ({ user_id: userId, badge_id: badge.id }));
  const { error } = await supabase.from("user_badges").insert(rows);

  if (error) {
    console.error(`[pioneer-badges] Failed to award ${criteriaKey}:`, error.message);
    return 0;
  }

  // Create notifications
  await createNotifications(
    supabase,
    toAward.map((userId) => ({
      userId,
      type: "badge_earned" as const,
      title: "Badge Earned!",
      body: `You earned the "${badge.title}" badge`,
      href: "/my-events?tab=badges",
    })),
  );

  return toAward.length;
}

/**
 * Eagerly award the "first_review" badge to a single user right after they write a review.
 * Fire-and-forget — errors are logged but do not propagate.
 */
export async function awardFirstReviewBadge(
  userId: string,
  supabase: SupabaseClient<Database>,
): Promise<void> {
  try {
    const { data: badge } = await supabase
      .from("badges")
      .select("id, title")
      .eq("criteria_key", "first_review")
      .eq("type", "system")
      .single();

    if (!badge) return;

    // Check if already awarded
    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", userId)
      .eq("badge_id", badge.id)
      .single();

    if (existing) return;

    const { error } = await supabase.from("user_badges").insert({
      user_id: userId,
      badge_id: badge.id,
    });

    if (error) {
      console.error(`[first-review-badge] Failed to award to ${userId}:`, error.message);
      return;
    }

    await createNotifications(supabase, [
      {
        userId,
        type: "badge_earned" as const,
        title: "Badge Earned!",
        body: `You earned the "${badge.title}" badge`,
        href: "/my-events?tab=badges",
      },
    ]);
  } catch (error) {
    console.error("[first-review-badge] Unexpected error:", error);
  }
}
