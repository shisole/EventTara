import type { SupabaseClient } from "@supabase/supabase-js";

import { checkAndAwardSystemBadges } from "@/lib/badges/check-system-badges";
import { sendEmail } from "@/lib/email/send";
import { badgeAwardedHtml } from "@/lib/email/templates/badge-awarded";
import { createNotifications } from "@/lib/notifications/create";
import type { Database } from "@/lib/supabase/types";

/**
 * Handles all badge-related work when an event is completed:
 * 1. Awards the event-specific badge to checked-in participants
 * 2. Re-evaluates system badges (distance milestones require completed events)
 *
 * Never throws — logs errors internally.
 */
export async function onEventCompleted(
  eventId: string,
  supabase: SupabaseClient<Database>,
): Promise<{ awarded: number }> {
  try {
    // Get checked-in user IDs (needed for both event badge and system badge re-eval)
    const { data: checkins } = await supabase
      .from("event_checkins")
      .select("user_id")
      .eq("event_id", eventId);

    const checkedInUserIds = (checkins ?? []).map((c) => c.user_id);

    // Award event badge
    const eventBadgeResult =
      checkedInUserIds.length > 0 ? await awardEventBadge(eventId, checkedInUserIds, supabase) : 0;

    // Re-evaluate system badges for all checked-in users (distance milestones
    // require completed events, so this triggers on completion)
    reEvaluateSystemBadges(checkedInUserIds, supabase);

    return { awarded: eventBadgeResult };
  } catch (error) {
    console.error("[onEventCompleted] unexpected error:", error);
    return { awarded: 0 };
  }
}

/**
 * Awards the event-specific badge to checked-in participants who haven't received it yet.
 */
async function awardEventBadge(
  eventId: string,
  checkedInUserIds: string[],
  supabase: SupabaseClient<Database>,
): Promise<number> {
  // Find the event badge
  const { data: badge } = await supabase
    .from("badges")
    .select("id, title, description, image_url")
    .eq("event_id", eventId)
    .eq("type", "event")
    .single();

  if (!badge) return 0;

  // Filter out already-awarded users
  const { data: existing } = await supabase
    .from("user_badges")
    .select("user_id")
    .eq("badge_id", badge.id)
    .in("user_id", checkedInUserIds);

  const alreadyAwarded = new Set((existing ?? []).map((e) => e.user_id));
  const newUserIds = checkedInUserIds.filter((uid) => !alreadyAwarded.has(uid));

  if (newUserIds.length === 0) return 0;

  // Upsert user_badges
  const records = newUserIds.map((userId) => ({
    badge_id: badge.id,
    user_id: userId,
  }));

  const { error } = await supabase
    .from("user_badges")
    .upsert(records, { onConflict: "user_id,badge_id" });

  if (error) {
    console.error("[awardEventBadge] upsert failed:", error.message);
    return 0;
  }

  // Fire-and-forget: notifications
  createNotifications(
    supabase,
    newUserIds.map((uid) => ({
      userId: uid,
      type: "badge_earned" as const,
      title: "Badge Earned",
      body: "You earned a new badge! Check your achievements.",
      href: "/achievements",
    })),
  ).catch(() => null);

  // Fire-and-forget: emails
  sendBadgeEmails(supabase, badge, newUserIds, eventId).catch(() => null);

  return newUserIds.length;
}

/**
 * Fire-and-forget: re-evaluate system badges for all checked-in users.
 * Distance milestone badges require event completion, so we re-run evaluation
 * whenever an event is completed.
 */
function reEvaluateSystemBadges(userIds: string[], supabase: SupabaseClient<Database>) {
  for (const userId of userIds) {
    checkAndAwardSystemBadges(userId, supabase).catch(() => null);
  }
}

async function sendBadgeEmails(
  supabase: SupabaseClient<Database>,
  badge: { id: string; title: string; description: string | null; image_url: string | null },
  userIds: string[],
  eventId: string,
) {
  const { data: event } = await supabase.from("events").select("title").eq("id", eventId).single();

  const { data: users } = await supabase
    .from("users")
    .select("email, full_name, username")
    .in("id", userIds);

  if (!users) return;

  for (const u of users) {
    if (u.email) {
      sendEmail({
        to: u.email,
        subject: `You earned a badge: ${badge.title}`,
        html: badgeAwardedHtml({
          userName: u.full_name,
          badgeTitle: badge.title,
          badgeDescription: badge.description,
          badgeImageUrl: badge.image_url,
          eventTitle: event?.title || "an EventTara event",
          username: u.username ?? undefined,
          badgeId: badge.id,
        }),
      }).catch((error_) => {
        console.error("[awardEventBadge] email failed:", error_);
      });
    }
  }
}
