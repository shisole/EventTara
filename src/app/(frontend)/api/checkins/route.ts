import { NextResponse } from "next/server";

import { checkAndAwardSystemBadges } from "@/lib/badges/check-system-badges";
import { checkAndAwardBorders } from "@/lib/borders/check-borders";
import { sendEmail } from "@/lib/email/send";
import { badgesEarnedHtml } from "@/lib/email/templates/badges-earned";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event_id, user_id: bodyUserId, companion_id, force } = await request.json();

  // Default to authenticated user for self-check-in
  const user_id = bodyUserId || (companion_id ? undefined : user.id);

  if (!event_id || (!user_id && !companion_id)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Handle companion check-in
  if (companion_id) {
    const { data: companion } = await supabase
      .from("booking_companions")
      .select(
        "id, full_name, checked_in, booking_id, bookings:booking_id(event_id, status, payment_status, payment_method, events:event_id(title))",
      )
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

    const eventName = booking?.events?.title || "Event";

    if (companion.checked_in) {
      return NextResponse.json(
        {
          message: `${companion.full_name} is already checked in`,
          userName: companion.full_name,
          eventName,
          alreadyCheckedIn: true,
        },
        { status: 200 },
      );
    }

    if (booking?.payment_status !== "paid" && !force) {
      return NextResponse.json(
        {
          message: `${companion.full_name}'s booking has not been paid yet`,
          userName: companion.full_name,
          eventName,
          paymentStatus: booking?.payment_status,
          paymentMethod: booking?.payment_method,
          requiresConfirmation: true,
        },
        { status: 202 },
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
      eventName,
      paymentStatus: booking?.payment_status,
      paymentMethod: booking?.payment_method,
      alreadyCheckedIn: false,
    });
  }

  // Handle regular user check-in
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, payment_status, payment_method, users:user_id(full_name), events:event_id(title, date)",
    )
    .eq("event_id", event_id)
    .eq("user_id", user_id)
    .in("status", ["confirmed", "pending"])
    .single();

  if (!booking) {
    return NextResponse.json({ error: "No booking found for this participant" }, { status: 404 });
  }

  const userName = (booking.users as any)?.full_name || "Participant";
  const eventName = (booking.events as any)?.title || "Event";
  const paymentStatus = booking.payment_status;
  const paymentMethod = booking.payment_method;

  // Check if already checked in
  const { data: existingCheckin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", event_id)
    .eq("user_id", user_id)
    .single();

  if (existingCheckin) {
    return NextResponse.json(
      {
        message: `${userName} is already checked in`,
        userName,
        eventName,
        paymentStatus,
        paymentMethod,
        alreadyCheckedIn: true,
      },
      { status: 200 },
    );
  }

  // Self-check-in validation
  const isSelfCheckin = user.id === user_id;
  if (isSelfCheckin) {
    if (paymentStatus !== "paid") {
      return NextResponse.json(
        {
          error:
            paymentMethod === "cash"
              ? "Cash bookings must check in on-site"
              : "Payment must be verified before online check-in",
          eventName,
          paymentStatus,
          paymentMethod,
        },
        { status: 403 },
      );
    }
    const eventDate = new Date((booking.events as any)?.date);
    const hoursUntilEvent = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilEvent > 48 || hoursUntilEvent < -24) {
      return NextResponse.json(
        { error: "Online check-in is only available within 48 hours of the event", eventName },
        { status: 403 },
      );
    }
  }

  // Payment warning for club admin scanning unpaid participant
  if (!isSelfCheckin && paymentStatus !== "paid" && !force) {
    return NextResponse.json(
      {
        message: `${userName} has not paid yet`,
        userName,
        eventName,
        paymentStatus,
        paymentMethod,
        requiresConfirmation: true,
      },
      { status: 202 },
    );
  }

  // Create check-in
  const { error } = await supabase.from("event_checkins").insert({
    event_id,
    user_id,
    method: isSelfCheckin ? "online" : "qr",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Post-check-in side effects (all non-blocking) ──
  // Tokens, badges, borders, notifications, and email run in the background
  // so the response returns immediately after the insert.
  void (async () => {
    try {
      await awardTokens(supabase, user_id, TOKEN_REWARDS.check_in, "check_in", event_id);

      const { count: totalCheckins } = await supabase
        .from("event_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id);

      if (totalCheckins === 1) {
        await awardTokens(supabase, user_id, TOKEN_REWARDS.first_event, "first_event", event_id);
      }

      checkAndAwardBorders(user_id, supabase).catch(() => null);

      const awardedBadges = await checkAndAwardSystemBadges(user_id, supabase);

      if (awardedBadges.length > 0) {
        createNotifications(
          supabase,
          awardedBadges.map((b) => ({
            userId: user_id,
            type: "badge_earned" as const,
            title: "Badge Earned",
            body: `You earned the "${b.title}" badge!`,
            href: "/achievements",
          })),
        ).catch(() => null);

        const { data: participant } = await supabase
          .from("users")
          .select("email")
          .eq("id", user_id)
          .single();

        if (participant?.email) {
          const subject =
            awardedBadges.length === 1
              ? `You earned a new badge: ${awardedBadges[0].title}!`
              : `You earned ${String(awardedBadges.length)} new badges!`;

          await sendEmail({
            to: participant.email,
            subject,
            html: badgesEarnedHtml({ userName, badges: awardedBadges }),
          });
        }
      }
    } catch {
      // Side-effect failures should never surface to the user
    }
  })();

  return NextResponse.json({
    message: `${userName} checked in!`,
    userName,
    eventName,
    paymentStatus,
    paymentMethod,
    alreadyCheckedIn: false,
  });
}
