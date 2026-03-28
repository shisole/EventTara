import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { bookingCancelledHtml } from "@/lib/email/templates/booking-cancelled";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get booking with event info
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, events:event_id(title, date, club_id)")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only the booking owner can cancel
  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only pending or confirmed bookings can be cancelled (not already cancelled)
  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 });
  }

  // Don't allow cancellation if already checked in
  const { data: checkin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", booking.event_id)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (checkin) {
    return NextResponse.json({ error: "Cannot cancel a booking after check-in" }, { status: 400 });
  }

  // Cancel the booking
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", qr_code: null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Cancel companions and clear QR codes
  await supabase
    .from("booking_companions")
    .update({ status: "cancelled" as const, qr_code: null })
    .eq("booking_id", id);

  const eventTitle = (booking.events as any)?.title ?? "an event";

  // Get user email for notification
  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  // Send cancellation email (fire-and-forget)
  if (userProfile?.email) {
    sendEmail({
      to: userProfile.email,
      subject: `Booking Cancelled: ${eventTitle}`,
      html: bookingCancelledHtml({
        userName: userProfile.full_name,
        eventTitle,
        eventUrl: `${SITE_URL}/events/${booking.event_id}`,
      }),
    }).catch((error_) => {
      console.error("[CancelBooking] Email failed:", error_);
    });
  }

  // Notify the organizer (club owner/admins) about the cancellation
  const clubId = (booking.events as any)?.club_id;
  if (clubId) {
    const { data: clubAdmins } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", clubId)
      .in("role", ["owner", "admin", "moderator"]);

    if (clubAdmins && clubAdmins.length > 0) {
      const notifications = clubAdmins.map((admin) => ({
        userId: admin.user_id,
        type: "booking_cancelled" as const,
        title: "Booking Cancelled",
        body: `${userProfile?.full_name ?? "A participant"} cancelled their booking for ${eventTitle}.`,
        href: `/dashboard/events/${booking.event_id}`,
        actorId: user.id,
      }));

      createNotifications(supabase, notifications).catch(() => null);
    }
  }

  return NextResponse.json({ message: "Booking cancelled" });
}
