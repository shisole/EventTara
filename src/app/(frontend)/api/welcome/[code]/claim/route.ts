import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationHtml } from "@/lib/email/templates/booking-confirmation";
import { createNotification } from "@/lib/notifications/create";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { matchBookingByName } from "@/lib/welcome/match-booking";
import { validateWelcomePage } from "@/lib/welcome/validate";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Parse optional body (booking_id for manual pick)
  let bookingId: string | undefined;
  try {
    const body = await request.json();
    bookingId = body?.booking_id;
  } catch {
    // No body or invalid JSON — that's fine
  }

  // Fetch welcome page
  const { data: page, error: pageError } = await supabase
    .from("welcome_pages")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (pageError || !page) {
    return NextResponse.json({ error: "Welcome page not found" }, { status: 404 });
  }

  // Get claim count
  const { count: claimCount } = await supabase
    .from("welcome_page_claims")
    .select("id", { count: "exact", head: true })
    .eq("welcome_page_id", page.id);

  // Validate
  const validation = validateWelcomePage({
    is_active: page.is_active,
    expires_at: page.expires_at,
    max_claims: page.max_claims,
    claimCount: claimCount ?? 0,
  });

  if (!validation.valid) {
    const messages: Record<string, string> = {
      inactive: "This welcome page is no longer active",
      expired: "This offer has expired",
      max_claims_reached: "All rewards have been claimed",
    };
    return NextResponse.json({ error: messages[validation.error] }, { status: 410 });
  }

  // Check existing claim (also guarded by DB unique constraint)
  const { data: existingClaim } = await supabase
    .from("welcome_page_claims")
    .select("id")
    .eq("welcome_page_id", page.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingClaim) {
    return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  }

  // Insert claim
  const { error: claimError } = await supabase.from("welcome_page_claims").insert({
    welcome_page_id: page.id,
    user_id: user.id,
  });

  if (claimError) {
    // Unique constraint violation = race condition double claim
    if (claimError.code === "23505") {
      return NextResponse.json({ error: "Already claimed" }, { status: 409 });
    }
    console.error("[welcome-claim] Insert failed:", claimError.message);
    return NextResponse.json({ error: "Failed to claim reward" }, { status: 500 });
  }

  // Service client bypasses RLS — needed for club join (private clubs block
  // self-insert) and booking link (user_id IS NULL blocks regular updates)
  const serviceClient = createServiceClient();

  // Award badge if linked
  let badgeAwarded = false;
  if (page.badge_id) {
    // Check if user already has badge
    const { data: existingBadge } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_id", user.id)
      .eq("badge_id", page.badge_id)
      .maybeSingle();

    if (!existingBadge) {
      const { error: badgeError } = await supabase.from("user_badges").insert({
        user_id: user.id,
        badge_id: page.badge_id,
      });

      if (badgeError) {
        console.error("[welcome-claim] Badge award failed:", badgeError.message);
      } else {
        badgeAwarded = true;

        // Get badge title for notification
        const { data: badge } = await supabase
          .from("badges")
          .select("title")
          .eq("id", page.badge_id)
          .single();

        if (badge) {
          await createNotification(supabase, {
            userId: user.id,
            type: "badge_earned",
            title: "Badge Earned!",
            body: `You earned the "${badge.title}" badge`,
            href: "/achievements",
          });
        }
      }
    }
  }

  // Auto-join club if linked
  let clubJoined = false;
  if (page.club_id) {
    const { data: existingMember } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", page.club_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingMember) {
      const { error: joinError } = await serviceClient.from("club_members").insert({
        club_id: page.club_id,
        user_id: user.id,
        role: "member",
      });

      if (joinError) {
        console.error("[welcome-claim] Club join failed:", joinError.message);
      } else {
        clubJoined = true;

        // Get club name and slug for notification
        const { data: club } = await supabase
          .from("clubs")
          .select("name, slug")
          .eq("id", page.club_id)
          .single();

        if (club) {
          await createNotification(supabase, {
            userId: user.id,
            type: "booking_confirmed",
            title: "Welcome to the club!",
            body: `You've joined ${club.name}`,
            href: `/clubs/${club.slug}`,
          });
        }
      }
    }
  }

  // Link booking if event is attached
  let bookingLinked = false;
  let linkedBookingId: string | null = null;
  let unclaimedBookings: { id: string; manual_name: string; event_distance_id: string | null }[] =
    [];

  if (page.event_id) {
    // Fetch event details for notification/email
    const { data: eventData } = await supabase
      .from("events")
      .select("id, title, date, location")
      .eq("id", page.event_id)
      .single();

    // Fetch unclaimed bookings for this event (service client bypasses RLS)
    const { data: unclaimed } = await serviceClient
      .from("bookings")
      .select("id, manual_name, event_distance_id")
      .eq("event_id", page.event_id)
      .is("user_id", null)
      .not("manual_name", "is", null);

    const available = (unclaimed ?? []) as {
      id: string;
      manual_name: string;
      event_distance_id: string | null;
    }[];

    // Fetch user data for name matching and email
    const { data: userData } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (available.length > 0) {
      let targetBooking: (typeof available)[number] | null = null;

      targetBooking = bookingId
        ? (available.find((b) => b.id === bookingId) ?? null)
        : (matchBookingByName(available, userData?.full_name) as typeof targetBooking);

      if (targetBooking) {
        const qrCode = `eventtara:checkin:${page.event_id}:${user.id}:${randomUUID().slice(0, 8)}`;
        const { error: linkError } = await serviceClient
          .from("bookings")
          .update({
            user_id: user.id,
            status: "confirmed" as const,
            qr_code: qrCode,
            booked_at: new Date().toISOString(),
          })
          .eq("id", targetBooking.id)
          .is("user_id", null);

        if (linkError) {
          console.error("[welcome-claim] Booking link failed:", linkError.message);
        } else {
          bookingLinked = true;
          linkedBookingId = targetBooking.id;

          // Send booking confirmation notification (fire-and-forget)
          if (eventData) {
            createNotification(supabase, {
              userId: user.id,
              type: "booking_confirmed",
              title: "Booking Confirmed",
              body: `Your booking for ${eventData.title} has been confirmed.`,
              href: `/events/${page.event_id}`,
            }).catch(() => null);
          }

          // Send booking confirmation email (fire-and-forget)
          if (userData?.email && eventData) {
            sendEmail({
              to: userData.email,
              subject: "Booking Confirmed",
              html: bookingConfirmationHtml({
                userName: userData.full_name ?? "Adventurer",
                eventTitle: eventData.title,
                eventDate: eventData.date,
                eventLocation: eventData.location,
                bookingId: targetBooking.id,
                qrCode,
              }),
            }).catch(() => null);
          }
        }
      } else if (!bookingId) {
        // No auto-match — return unclaimed list for manual pick
        unclaimedBookings = available.map((b) => ({
          id: b.id,
          manual_name: b.manual_name,
          event_distance_id: b.event_distance_id,
        }));
      }
    }
  }

  return NextResponse.json({
    success: true,
    badge_awarded: badgeAwarded,
    club_joined: clubJoined,
    booking_linked: bookingLinked,
    booking_id: linkedBookingId,
    unclaimed_bookings: unclaimedBookings.length > 0 ? unclaimedBookings : undefined,
  });
}
