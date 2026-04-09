import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { sendBatchEmails } from "@/lib/email/send";
import { upcomingEventBlastHtml } from "@/lib/email/templates/upcoming-event-blast";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get IDs of unsubscribed users
  const { data: unsubs } = await supabase.from("email_unsubscribes").select("user_id");
  const unsubIds = new Set((unsubs ?? []).map((u) => u.user_id));

  // Count eligible recipients (real emails, no Strava/guest/unsubscribed)
  const { data: allUsers } = await supabase
    .from("users")
    .select("id")
    .not("email", "is", null)
    .not("email", "like", "strava_%@strava.eventtara.com")
    .eq("is_guest", false);

  const recipientCount = (allUsers ?? []).filter((u) => !unsubIds.has(u.id)).length;

  // If eventId is provided, also return preview defaults + rendered HTML
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ recipientCount });
  }

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, date, location, type, difficulty_level, price, cover_image_url, max_participants, offline_participants, status",
    )
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { count: bookedCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)
    .in("status", ["confirmed", "pending", "reserved"]);

  const totalBooked = (bookedCount ?? 0) + (event.offline_participants ?? 0);
  const spotsRemaining = Math.max(0, event.max_participants - totalBooked);

  const eventDate = new Date(event.date).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const defaults = {
    subject: `New Climb Alert: ${event.title} — ${eventDate}`,
    headline: "",
    subtext: "",
    customMessage: "",
    eventLocation: event.location || "TBA",
    eventDate,
  };

  const html = upcomingEventBlastHtml({
    eventTitle: event.title,
    eventDate: defaults.eventDate,
    eventLocation: defaults.eventLocation,
    eventType: event.type || "",
    difficulty: event.difficulty_level,
    price: event.price,
    coverImageUrl: event.cover_image_url,
    spotsRemaining,
    maxParticipants: event.max_participants,
    eventId: event.id,
    userId: "preview",
  });

  return NextResponse.json({ recipientCount, defaults, html });
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

  const body = (await request.json().catch(() => null)) as {
    eventId?: string;
    subject?: string;
    headline?: string;
    subtext?: string;
    customMessage?: string;
    eventLocation?: string;
    eventDate?: string;
  } | null;
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

    // Format date (allow override)
    const defaultEventDate = new Date(event.date).toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const eventDate = body.eventDate?.trim() || defaultEventDate;
    const eventLocation = body.eventLocation?.trim() || event.location || "TBA";

    // Fetch all registered users with real emails (exclude Strava/guest accounts)
    const { data: allUsers } = await supabase
      .from("users")
      .select("id, email, full_name")
      .not("email", "is", null)
      .not("email", "like", "strava_%@strava.eventtara.com")
      .eq("is_guest", false);

    if (!allUsers?.length) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    // Filter out unsubscribed users
    const { data: unsubs } = await supabase.from("email_unsubscribes").select("user_id");
    const unsubIds = new Set((unsubs ?? []).map((u) => u.user_id));
    const users = allUsers.filter((u) => !unsubIds.has(u.id));

    if (users.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, total: 0 });
    }

    const subject = body.subject?.trim() || `New Climb Alert: ${event.title} — ${eventDate}`;

    // Build per-user HTML (each email has a unique unsubscribe link)
    const emails = users.map((u) => ({
      to: u.email!,
      subject,
      html: upcomingEventBlastHtml({
        eventTitle: event.title,
        eventDate,
        eventLocation,
        eventType: event.type || "",
        difficulty: event.difficulty_level,
        price: event.price,
        coverImageUrl: event.cover_image_url,
        spotsRemaining,
        maxParticipants: event.max_participants,
        eventId: event.id,
        userId: u.id,
        headline: body.headline,
        subtext: body.subtext,
        customMessage: body.customMessage,
      }),
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
