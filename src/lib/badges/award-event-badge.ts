import type { SupabaseClient } from "@supabase/supabase-js";

import { sendEmail } from "@/lib/email/send";
import { badgeAwardedHtml } from "@/lib/email/templates/badge-awarded";
import { createNotifications } from "@/lib/notifications/create";
import type { Database } from "@/lib/supabase/types";

/**
 * Auto-award an event badge to all checked-in participants who haven't received it yet.
 * Never throws — logs errors internally.
 */
export async function awardEventBadge(
  eventId: string,
  supabase: SupabaseClient<Database>,
): Promise<{ awarded: number }> {
  try {
    // 1. Find the event badge
    const { data: badge } = await supabase
      .from("badges")
      .select("id, title, description, image_url")
      .eq("event_id", eventId)
      .eq("type", "event")
      .single();

    if (!badge) return { awarded: 0 };

    // 2. Get checked-in user IDs
    const { data: checkins } = await supabase
      .from("event_checkins")
      .select("user_id")
      .eq("event_id", eventId);

    if (!checkins || checkins.length === 0) return { awarded: 0 };

    const checkedInUserIds = checkins.map((c) => c.user_id);

    // 3. Filter out already-awarded users
    const { data: existing } = await supabase
      .from("user_badges")
      .select("user_id")
      .eq("badge_id", badge.id)
      .in("user_id", checkedInUserIds);

    const alreadyAwarded = new Set((existing ?? []).map((e) => e.user_id));
    const newUserIds = checkedInUserIds.filter((uid) => !alreadyAwarded.has(uid));

    if (newUserIds.length === 0) return { awarded: 0 };

    // 4. Upsert user_badges
    const records = newUserIds.map((userId) => ({
      badge_id: badge.id,
      user_id: userId,
    }));

    const { error } = await supabase
      .from("user_badges")
      .upsert(records, { onConflict: "user_id,badge_id" });

    if (error) {
      console.error("[awardEventBadge] upsert failed:", error.message);
      return { awarded: 0 };
    }

    // 5. Fire-and-forget: notifications
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

    // 6. Fire-and-forget: emails
    sendBadgeEmails(supabase, badge, newUserIds, eventId).catch(() => null);

    return { awarded: newUserIds.length };
  } catch (error) {
    console.error("[awardEventBadge] unexpected error:", error);
    return { awarded: 0 };
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
