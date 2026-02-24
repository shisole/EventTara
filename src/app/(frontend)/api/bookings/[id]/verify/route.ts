import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationHtml } from "@/lib/email/templates/booking-confirmation";
import { paymentRejectedHtml } from "@/lib/email/templates/payment-rejected";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json();
  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get booking with event and user info
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "*, events:event_id(title, date, location, organizer_id, organizer_profiles:organizer_id(user_id)), users:user_id(full_name, email)",
    )
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Verify the current user is the organizer
  const organizerUserId = (booking.events as any)?.organizer_profiles?.user_id;
  if (organizerUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "approve") {
    const qrCode = `eventtara:checkin:${booking.event_id}:${booking.user_id}`;

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_verified_at: new Date().toISOString(),
        payment_verified_by: user.id,
        qr_code: qrCode,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Confirm companions and generate QR codes
    const { data: companions } = await supabase
      .from("booking_companions")
      .select("id")
      .eq("booking_id", id);

    if (companions && companions.length > 0) {
      for (const comp of companions) {
        const companionQr = `eventtara:checkin:${booking.event_id}:companion:${comp.id}`;
        await supabase
          .from("booking_companions")
          .update({ status: "confirmed" as const, qr_code: companionQr })
          .eq("id", comp.id);
      }
    }

    // Send confirmation email with QR code
    const email = (booking.users as any)?.email;
    if (email) {
      const eventDate = new Date((booking.events as any).date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      sendEmail({
        to: email,
        subject: `Booking Confirmed: ${(booking.events as any).title}`,
        html: bookingConfirmationHtml({
          userName: (booking.users as any)?.full_name ?? "",
          eventTitle: (booking.events as any).title,
          eventDate,
          eventLocation: (booking.events as any).location,
          bookingId: booking.id,
          qrCode,
        }),
      }).catch((error_) => { console.error("[Email] Confirmation failed:", error_); });
    }

    return NextResponse.json({ message: "Payment approved", qrCode });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: "rejected" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Cancel all companions when booking is rejected
    await supabase
      .from("booking_companions")
      .update({ status: "cancelled" as const, qr_code: null })
      .eq("booking_id", id);

    const email = (booking.users as any)?.email;
    if (email) {
      sendEmail({
        to: email,
        subject: `Payment Issue: ${(booking.events as any).title}`,
        html: paymentRejectedHtml({
          userName: (booking.users as any)?.full_name ?? "",
          eventTitle: (booking.events as any).title,
        }),
      }).catch((error_) => { console.error("[Email] Rejection email failed:", error_); });
    }

    return NextResponse.json({ message: "Payment rejected" });
  }
}
