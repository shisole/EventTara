import { type NextRequest, NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { nextSortOrder } from "@/lib/itinerary/sort";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const { data: entries, error } = await supabase
    .from("event_itinerary")
    .select("id, time, title, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: entries ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let time: string;
  let title: string;
  try {
    const body = await request.json();
    time = String(body.time ?? "").trim();
    title = String(body.title ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!time || !title) {
    return NextResponse.json({ error: "time and title are required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("event_itinerary")
    .select("sort_order")
    .eq("event_id", eventId);

  const sort_order = nextSortOrder(existing ?? []);

  const { data: entry, error } = await supabase
    .from("event_itinerary")
    .insert({ event_id: eventId, time, title, sort_order })
    .select("id, time, title, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry }, { status: 201 });
}

// Bulk reorder: body = { order: Array<{ id: string; sort_order: number }> }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let order: { id: string; sort_order: number }[];
  try {
    const body = await request.json();
    order = body.order;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order must be an array" }, { status: 400 });
  }

  await Promise.all(
    order.map(({ id, sort_order }) =>
      supabase.from("event_itinerary").update({ sort_order }).eq("id", id).eq("event_id", eventId),
    ),
  );

  return NextResponse.json({ success: true });
}
