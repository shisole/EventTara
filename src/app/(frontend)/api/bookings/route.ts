import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationHtml } from "@/lib/email/templates/booking-confirmation";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { event_id, payment_method } = body;

  if (!event_id || !payment_method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check event exists and has capacity
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", event_id)
    .eq("status", "published")
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Check capacity
  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event_id)
    .in("status", ["pending", "confirmed"]);

  if ((bookingCount || 0) >= event.max_participants) {
    return NextResponse.json({ error: "Event is fully booked" }, { status: 400 });
  }

  // Check if user already booked
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id")
    .eq("event_id", event_id)
    .eq("user_id", user.id)
    .in("status", ["pending", "confirmed"])
    .single();

  if (existingBooking) {
    return NextResponse.json({ error: "You have already booked this event" }, { status: 400 });
  }

  // Generate QR code value
  const qrCode = `eventtara:checkin:${event_id}:${user.id}`;

  // Create booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      event_id,
      user_id: user.id,
      payment_method,
      qr_code: qrCode,
      status: "confirmed",
      payment_status: "paid", // Simplified for MVP
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send booking confirmation email (non-blocking)
  try {
    const { data: userProfile } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const emailAddress = user.email ?? userProfile?.email;

    if (emailAddress) {
      const eventDate = new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      sendEmail({
        to: emailAddress,
        subject: `Booking Confirmed: ${event.title}`,
        html: bookingConfirmationHtml({
          userName: userProfile?.full_name ?? "",
          eventTitle: event.title,
          eventDate,
          eventLocation: event.location,
          bookingId: booking.id,
          qrCode: qrCode,
        }),
      }).catch((err) => console.error("[Email] Booking confirmation failed:", err));
    }
  } catch (emailErr) {
    // Don't fail the booking if email fails
    console.error("[Email] Error preparing booking confirmation:", emailErr);
  }

  return NextResponse.json({ booking });
}
