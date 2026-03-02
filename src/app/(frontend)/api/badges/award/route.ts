import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { badgeAwardedHtml } from "@/lib/email/templates/badge-awarded";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { badge_id, user_ids } = await request.json();

  if (!badge_id || !user_ids || !Array.isArray(user_ids)) {
    return NextResponse.json({ error: "Missing badge_id or user_ids" }, { status: 400 });
  }

  const records = user_ids.map((userId: string) => ({
    badge_id,
    user_id: userId,
  }));

  const { error } = await supabase
    .from("user_badges")
    .upsert(records, { onConflict: "user_id,badge_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send in-app badge notifications (fire-and-forget)
  createNotifications(
    supabase,
    user_ids.map((uid: string) => ({
      userId: uid,
      type: "badge_earned" as const,
      title: "Badge Earned",
      body: "You earned a new badge! Check your achievements.",
      href: "/achievements",
      actorId: user.id,
    })),
  ).catch(() => null);

  // Send badge notification emails (non-blocking)
  try {
    const { data: badge } = await supabase
      .from("badges")
      .select("title, description, image_url, event_id")
      .eq("id", badge_id)
      .single();

    if (badge) {
      const event = badge.event_id
        ? (await supabase.from("events").select("title").eq("id", badge.event_id).single()).data
        : null;

      const { data: users } = await supabase
        .from("users")
        .select("email, full_name, username")
        .in("id", user_ids);

      if (users) {
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
                badgeId: badge_id,
              }),
            }).catch((error_) => {
              console.error("[Email] Badge notification failed:", error_);
            });
          }
        }
      }
    }
  } catch (error_) {
    // Don't fail the badge award if email fails
    console.error("[Email] Error preparing badge notifications:", error_);
  }

  return NextResponse.json({ awarded: user_ids.length });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { badge_id, user_id } = await request.json();

  if (!badge_id || !user_id) {
    return NextResponse.json({ error: "Missing badge_id or user_id" }, { status: 400 });
  }

  // Fetch badge to verify it's an event badge and caller is the organizer
  const { data: badge } = await supabase
    .from("badges")
    .select("id, event_id")
    .eq("id", badge_id)
    .single();

  if (!badge) {
    return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  }

  if (!badge.event_id) {
    return NextResponse.json({ error: "Cannot revoke system badges" }, { status: 403 });
  }

  // Verify caller is the event organizer
  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", badge.event_id)
    .single();

  if (event?.organizer_id !== user.id) {
    return NextResponse.json(
      { error: "Only the event organizer can revoke badges" },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("user_badges")
    .delete()
    .eq("badge_id", badge_id)
    .eq("user_id", user_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ revoked: true });
}
