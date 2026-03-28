import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { bookingExpiredHtml } from "@/lib/email/templates/booking-expired";
import { createNotifications } from "@/lib/notifications/create";
import { createServiceClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";

function isAuthorized(request: Request): boolean {
  // Support both: Vercel Cron (Authorization: Bearer) and manual (x-cron-secret header)
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");
  const header = request.headers.get("x-cron-secret");
  return (bearer || header) === process.env.CRON_SECRET;
}

export async function GET(request: Request) {
  return handleExpireBookings(request);
}

export async function POST(request: Request) {
  return handleExpireBookings(request);
}

async function handleExpireBookings(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find expired pending bookings
  const { data: expiredBookings, error } = await supabase
    .from("bookings")
    .select("id, event_id, user_id, events:event_id(title)")
    .eq("payment_status", "pending")
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString())
    .not("expires_at", "is", null);

  if (error) {
    console.error("[CronExpireBookings] Query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!expiredBookings || expiredBookings.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  const bookingIds = expiredBookings.map((b) => b.id);

  // Cancel bookings
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .in("id", bookingIds);

  if (updateError) {
    console.error("[CronExpireBookings] Update failed:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Cancel companions and clear QR codes
  await supabase
    .from("booking_companions")
    .update({ status: "cancelled" as const, qr_code: null })
    .in("booking_id", bookingIds);

  // Notify and email each affected user
  const notifications = expiredBookings
    .filter((b) => b.user_id)
    .map((b) => ({
      userId: b.user_id!,
      type: "booking_expired" as const,
      title: "Booking Expired",
      body: `Your booking for ${(b.events as any)?.title ?? "an event"} has expired due to unpaid payment.`,
      href: `/events/${b.event_id}`,
    }));

  if (notifications.length > 0) {
    createNotifications(supabase, notifications).catch(() => null);
  }

  // Send expiry emails (fire-and-forget)
  for (const b of expiredBookings) {
    if (!b.user_id) continue;

    const { data: userProfile } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", b.user_id)
      .single();

    if (userProfile?.email) {
      const eventTitle = (b.events as any)?.title ?? "an event";
      sendEmail({
        to: userProfile.email,
        subject: `Booking Expired: ${eventTitle}`,
        html: bookingExpiredHtml({
          userName: userProfile.full_name,
          eventTitle,
          eventUrl: `${SITE_URL}/events/${b.event_id}`,
        }),
      }).catch((error_) => {
        console.error("[CronExpireBookings] Email failed:", error_);
      });
    }
  }

  return NextResponse.json({ expired: bookingIds.length });
}
