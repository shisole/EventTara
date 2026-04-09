import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { upcomingEventBlastHtml } from "@/lib/email/templates/upcoming-event-blast";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, date, location, type, difficulty_level, price, cover_image_url, max_participants, offline_participants",
    )
    .eq("id", body.eventId)
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

  const defaultDate = new Date(event.date).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = upcomingEventBlastHtml({
    eventTitle: event.title,
    eventDate: body.eventDate?.trim() || defaultDate,
    eventLocation: body.eventLocation?.trim() || event.location || "TBA",
    eventType: event.type || "",
    difficulty: event.difficulty_level,
    price: event.price,
    coverImageUrl: event.cover_image_url,
    spotsRemaining,
    maxParticipants: event.max_participants,
    eventId: event.id,
    userId: "preview",
    headline: body.headline,
    subtext: body.subtext,
    customMessage: body.customMessage,
  });

  return NextResponse.json({ html });
}
