import { NextResponse } from "next/server";

import { sendEmail } from "@/lib/email/send";
import { paymentReminderHtml } from "@/lib/email/templates/payment-reminder";
import { createNotifications } from "@/lib/notifications/create";
import { createServiceClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";

function isAuthorized(request: Request): boolean {
  const bearer = request.headers.get("authorization")?.replace("Bearer ", "");
  const header = request.headers.get("x-cron-secret");
  return (bearer || header) === process.env.CRON_SECRET;
}

export async function GET(request: Request) {
  return handlePaymentReminders(request);
}

export async function POST(request: Request) {
  return handlePaymentReminders(request);
}

async function handlePaymentReminders(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find bookings expiring within the next 15 minutes that haven't been reminded yet
  const fifteenMinFromNow = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, event_id, user_id, events:event_id(title)")
    .eq("payment_status", "pending")
    .eq("status", "pending")
    .is("payment_reminder_sent_at", null)
    .not("expires_at", "is", null)
    .lte("expires_at", fifteenMinFromNow)
    .gt("expires_at", new Date().toISOString());

  if (error) {
    console.error("[CronPaymentReminders] Query failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ reminded: 0 });
  }

  // Mark all as reminded
  const bookingIds = bookings.map((b) => b.id);
  await supabase
    .from("bookings")
    .update({ payment_reminder_sent_at: new Date().toISOString() })
    .in("id", bookingIds);

  // Send notifications
  const notifications = bookings
    .filter((b) => b.user_id)
    .map((b) => ({
      userId: b.user_id!,
      type: "payment_reminder" as const,
      title: "Payment Reminder",
      body: `Your booking for ${(b.events as any)?.title ?? "an event"} will expire soon. Upload your payment proof now.`,
      href: `/events/${b.event_id}`,
    }));

  if (notifications.length > 0) {
    createNotifications(supabase, notifications).catch(() => null);
  }

  // Send reminder emails (fire-and-forget)
  for (const b of bookings) {
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
        subject: `Payment Reminder: ${eventTitle}`,
        html: paymentReminderHtml({
          userName: userProfile.full_name,
          eventTitle,
          eventUrl: `${SITE_URL}/events/${b.event_id}`,
        }),
      }).catch((error_) => {
        console.error("[CronPaymentReminders] Email failed:", error_);
      });
    }
  }

  return NextResponse.json({ reminded: bookingIds.length });
}
