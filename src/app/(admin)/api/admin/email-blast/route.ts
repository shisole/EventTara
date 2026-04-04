import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { sendBatchEmails } from "@/lib/email/send";
import { upcomingEventBlastHtml } from "@/lib/email/templates/upcoming-event-blast";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Return count of eligible recipients (real emails only, no Strava/guest accounts)
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .not("email", "is", null)
    .not("email", "like", "strava_%@strava.eventtara.com")
    .eq("is_guest", false);

  return NextResponse.json({ recipientCount: count ?? 0 });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth: admin user OR cron secret
  const cronSecret = request.headers.get("x-cron-secret");
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!isCron) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isAdminUser(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => null);
  if (!body?.eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  try {
    // Fetch event
    const { data: event } = await supabase
      .from("events")
      .select(
        "id, title, date, location, type, difficulty_level, price, cover_image_url, max_participants, offline_participants, status",
      )
      .eq("id", body.eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "published") {
      return NextResponse.json({ error: "Event must be published" }, { status: 400 });
    }

    // Count confirmed bookings for spots remaining
    const { count: bookedCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .in("status", ["confirmed", "pending", "reserved"]);

    const totalBooked = (bookedCount ?? 0) + (event.offline_participants ?? 0);
    const spotsRemaining = Math.max(0, event.max_participants - totalBooked);

    // Format date
    const eventDate = new Date(event.date).toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Build email HTML
    const html = upcomingEventBlastHtml({
      eventTitle: event.title,
      eventDate,
      eventLocation: event.location || "TBA",
      eventType: event.type || "",
      difficulty: event.difficulty_level,
      price: event.price,
      coverImageUrl: event.cover_image_url,
      spotsRemaining,
      maxParticipants: event.max_participants,
      eventId: event.id,
    });

    // Fetch all registered users with real emails (exclude Strava/guest accounts)
    const { data: users } = await supabase
      .from("users")
      .select("email, full_name")
      .not("email", "is", null)
      .not("email", "like", "strava_%@strava.eventtara.com")
      .eq("is_guest", false);

    if (!users?.length) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    const subject = `New Climb Alert: ${event.title} — ${eventDate}`;

    // Use Resend batch API — single API call instead of N individual calls
    const emails = users.map((u) => ({
      to: u.email!,
      subject,
      html,
    }));

    const result = await sendBatchEmails(emails);

    console.log(
      `[EmailBlast] Event "${event.title}": sent=${result.sent}, failed=${result.failed}, total=${users.length}`,
    );

    return NextResponse.json({ sent: result.sent, failed: result.failed, total: users.length });
  } catch (error) {
    console.error("[EmailBlast] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
