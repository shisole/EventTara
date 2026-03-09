import type { SupabaseClient } from "@supabase/supabase-js";

import { checkAndAwardSystemBadges } from "@/lib/badges/check-system-badges";
import { sendEmail } from "@/lib/email/send";
import { badgeAwardedHtml } from "@/lib/email/templates/badge-awarded";
import { reviewRequestHtml } from "@/lib/email/templates/review-request";
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

    // Fire-and-forget: review request emails
    sendReviewRequestEmails(eventId, checkedInUserIds, supabase).catch(() => null);

    // Fire-and-forget: in-app review request notifications
    sendReviewRequestNotifications(eventId, checkedInUserIds, supabase).catch(() => null);

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
          eventTitle: event?.title ?? "an EventTara event",
          username: u.username ?? undefined,
          badgeId: badge.id,
        }),
      }).catch((error_) => {
        console.error("[awardEventBadge] email failed:", error_);
      });
    }
  }
}

/**
 * Fire-and-forget: send review request emails to checked-in participants.
 * Fetches event details and organizer info, then sends review invitation
 * emails to all non-guest participants with valid email addresses.
 *
 * Never throws — errors are logged internally.
 */
async function sendReviewRequestEmails(
  eventId: string,
  userIds: string[],
  supabase: SupabaseClient<Database>,
) {
  // Return early if no user IDs
  if (userIds.length === 0) return;

  // Fetch event details
  const { data: event } = await supabase
    .from("events")
    .select("title, date, club_id")
    .eq("id", eventId)
    .single();

  if (!event?.club_id) return;

  // Fetch club name
  const { data: club } = await supabase
    .from("clubs")
    .select("name, slug")
    .eq("id", event.club_id)
    .single();

  const clubName = club?.name ?? null;

  // Fetch user emails, filtering out guests
  const { data: users } = await supabase
    .from("users")
    .select("id, email, full_name")
    .in("id", userIds)
    .eq("is_guest", false);

  if (!users) return;

  // Format event date
  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Date TBD";

  // Build review URL using the club slug
  const reviewUrl = club?.slug
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://eventtara.com"}/clubs/${club.slug}/reviews`
    : `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://eventtara.com"}/events`;

  // Send emails to all users with non-null email
  for (const u of users) {
    if (u.email) {
      sendEmail({
        to: u.email,
        subject: `Share your review for ${event.title}`,
        html: reviewRequestHtml({
          userName: u.full_name || "Adventurer",
          eventTitle: event.title,
          eventDate,
          clubName: clubName ?? "the event club",
          reviewUrl,
        }),
      }).catch((error_) => {
        console.error("[sendReviewRequestEmails] email failed:", error_);
      });
    }
  }
}

/**
 * Fire-and-forget: create in-app review request notifications for checked-in participants.
 * Filters out guests and users who already reviewed the event.
 */
async function sendReviewRequestNotifications(
  eventId: string,
  userIds: string[],
  supabase: SupabaseClient<Database>,
) {
  if (userIds.length === 0) return;

  // Fetch event title and club_id
  const { data: event } = await supabase
    .from("events")
    .select("title, club_id")
    .eq("id", eventId)
    .single();

  if (!event) return;

  // Fetch club owner as the actor for the notification
  const { data: clubOwner } = await supabase
    .from("club_members")
    .select("user_id")
    .eq("club_id", event.club_id)
    .eq("role", "owner")
    .single();

  // Filter out guests
  const { data: nonGuestUsers } = await supabase
    .from("users")
    .select("id")
    .in("id", userIds)
    .eq("is_guest", false);

  if (!nonGuestUsers || nonGuestUsers.length === 0) return;

  const nonGuestIds = nonGuestUsers.map((u) => u.id);

  // Filter out users who already reviewed
  const { data: existingReviews } = await supabase
    .from("event_reviews")
    .select("user_id")
    .eq("event_id", eventId)
    .in("user_id", nonGuestIds);

  const reviewedSet = new Set((existingReviews ?? []).map((r) => r.user_id));
  const eligibleIds = nonGuestIds.filter((id) => !reviewedSet.has(id));

  if (eligibleIds.length === 0) return;

  createNotifications(
    supabase,
    eligibleIds.map((uid) => ({
      userId: uid,
      type: "review_request" as const,
      title: `How was ${event.title}?`,
      body: "Share your experience and help other adventurers!",
      href: `/events/${eventId}/review`,
      actorId: clubOwner?.user_id ?? undefined,
      metadata: { event_id: eventId },
    })),
  ).catch(() => null);
}
