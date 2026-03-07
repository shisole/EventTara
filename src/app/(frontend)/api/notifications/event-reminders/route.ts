import { NextResponse } from "next/server";

import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Find events happening tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfDay = new Date(tomorrow);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(tomorrow);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, date, location")
    .gte("date", startOfDay.toISOString())
    .lte("date", endOfDay.toISOString())
    .eq("status", "published");

  if (!events || events.length === 0) {
    return NextResponse.json({ message: "No upcoming events", notified: 0 });
  }

  let totalNotified = 0;

  for (const event of events) {
    // Find confirmed bookings for this event
    const { data: bookings } = await supabase
      .from("bookings")
      .select("user_id")
      .eq("event_id", event.id)
      .eq("status", "confirmed");

    if (!bookings || bookings.length === 0) continue;

    const eventDate = new Date(event.date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    await createNotifications(
      supabase,
      bookings
        .filter((b) => b.user_id)
        .map((b) => ({
          userId: b.user_id!,
          type: "event_reminder" as const,
          title: "Event Tomorrow",
          body: `${event.title} is happening tomorrow at ${eventDate}. Don't forget!`,
          href: `/events/${event.id}`,
        })),
    );

    totalNotified += bookings.length;
  }

  return NextResponse.json({ message: "Reminders sent", notified: totalNotified });
}
