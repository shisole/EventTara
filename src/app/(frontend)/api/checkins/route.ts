import { NextResponse } from "next/server";

import { checkAndAwardSystemBadges } from "@/lib/badges/check-system-badges";
import { checkAndAwardBorders } from "@/lib/borders/check-borders";
import { sendEmail } from "@/lib/email/send";
import { badgesEarnedHtml } from "@/lib/email/templates/badges-earned";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event_id, user_id, companion_id } = await request.json();

  if (!event_id || (!user_id && !companion_id)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Handle companion check-in
  if (companion_id) {
    const { data: companion } = await supabase
      .from("booking_companions")
      .select("id, full_name, checked_in, booking_id, bookings:booking_id(event_id, status)")
      .eq("id", companion_id)
      .single();

    if (!companion) {
      return NextResponse.json({ error: "Companion not found" }, { status: 404 });
    }

    const booking = companion.bookings as any;
    if (booking?.event_id !== event_id) {
      return NextResponse.json(
        { error: "Companion is not registered for this event" },
        { status: 400 },
      );
    }

    if (companion.checked_in) {
      return NextResponse.json(
        { message: `${companion.full_name} is already checked in`, userName: companion.full_name },
        { status: 200 },
      );
    }

    const { error } = await supabase
      .from("booking_companions")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", companion_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `${companion.full_name} checked in!`,
      userName: companion.full_name,
    });
  }

  // Handle regular user check-in
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, users:user_id(full_name)")
    .eq("event_id", event_id)
    .eq("user_id", user_id)
    .in("status", ["confirmed", "pending"])
    .single();

  if (!booking) {
    return NextResponse.json({ error: "No booking found for this participant" }, { status: 404 });
  }

  // Check if already checked in
  const { data: existingCheckin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", event_id)
    .eq("user_id", user_id)
    .single();

  if (existingCheckin) {
    const userName = (booking.users as any)?.full_name || "Participant";
    return NextResponse.json(
      { message: `${userName} is already checked in`, userName },
      { status: 200 },
    );
  }

  // Create check-in
  const { error } = await supabase.from("event_checkins").insert({
    event_id,
    user_id,
    method: "qr",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Trigger border and badge checks in background (non-blocking)
  checkAndAwardBorders(user_id, supabase).catch(() => null);

  const userName = (booking.users as any)?.full_name || "Participant";

  // Check and award system badges, then send batched email if any earned
  checkAndAwardSystemBadges(user_id, supabase)
    .then(async (awardedBadges) => {
      if (awardedBadges.length === 0) return;

      // Fetch user email for notification
      const { data: participant } = await supabase
        .from("users")
        .select("email")
        .eq("id", user_id)
        .single();

      if (participant?.email) {
        const subject =
          awardedBadges.length === 1
            ? `You earned a new badge: ${awardedBadges[0].title}!`
            : `You earned ${awardedBadges.length} new badges!`;

        await sendEmail({
          to: participant.email,
          subject,
          html: badgesEarnedHtml({ userName, badges: awardedBadges }),
        });
      }
    })
    .catch(() => null);

  return NextResponse.json({ message: `${userName} checked in!`, userName });
}
