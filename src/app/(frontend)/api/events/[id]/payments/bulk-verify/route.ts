import { NextResponse } from "next/server";

import { checkClubPermissionServer } from "@/lib/clubs/permissions";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationHtml } from "@/lib/email/templates/booking-confirmation";
import { createNotification } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bookingIds, action } = await request.json();
  if (!Array.isArray(bookingIds) || bookingIds.length === 0 || action !== "approve") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Fetch event to get club_id
  const { data: event } = await supabase
    .from("events")
    .select("club_id, title, date, location")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, "moderator");
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let approved = 0;
  let failed = 0;

  for (const bookingId of bookingIds) {
    // Get booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, event_id, user_id, payment_status, users:user_id(full_name, email)")
      .eq("id", bookingId)
      .eq("event_id", eventId)
      .eq("payment_status", "pending")
      .single();

    if (!booking) {
      failed++;
      continue;
    }

    const qrCode = `eventtara:checkin:${eventId}:${booking.user_id}`;

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_verified_at: new Date().toISOString(),
        payment_verified_by: user.id,
        qr_code: qrCode,
      })
      .eq("id", bookingId);

    if (error) {
      failed++;
      continue;
    }

    // Confirm companions
    const { data: companions } = await supabase
      .from("booking_companions")
      .select("id")
      .eq("booking_id", bookingId);

    if (companions && companions.length > 0) {
      for (const comp of companions) {
        const companionQr = `eventtara:checkin:${eventId}:companion:${comp.id}`;
        await supabase
          .from("booking_companions")
          .update({ status: "confirmed" as const, qr_code: companionQr })
          .eq("id", comp.id);
      }
    }

    // Send confirmation email
    const email = (booking.users as any)?.email;
    if (email) {
      const eventDate = new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      sendEmail({
        to: email,
        subject: `Booking Confirmed: ${event.title}`,
        html: bookingConfirmationHtml({
          userName: (booking.users as any)?.full_name ?? "",
          eventTitle: event.title,
          eventDate,
          eventLocation: event.location,
          bookingId,
          qrCode,
        }),
      }).catch((error_) => {
        console.error("[BulkVerify] Email failed:", error_);
      });
    }

    // Notify participant
    if (booking.user_id) {
      createNotification(supabase, {
        userId: booking.user_id,
        type: "booking_confirmed",
        title: "Booking Confirmed",
        body: `Your payment for ${event.title} has been approved. You're all set!`,
        href: `/events/${eventId}`,
        actorId: user.id,
      }).catch(() => null);
    }

    approved++;
  }

  return NextResponse.json({ approved, failed });
}
