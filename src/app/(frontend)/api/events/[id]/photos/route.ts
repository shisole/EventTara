import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: photos, error } = await supabase
    .from("event_photos")
    .select(
      "id, event_id, user_id, image_url, caption, sort_order, uploaded_at, users(full_name, username, avatar_url)",
    )
    .eq("event_id", id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("[EventPhotos] GET error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ photos: photos ?? [] });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch event to get club_id
  const { data: event } = await supabase
    .from("events")
    .select("club_id, title")
    .eq("id", id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Check authorization: must be checked-in participant OR club member
  const [{ data: checkin }, clubRole] = await Promise.all([
    supabase
      .from("event_checkins")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    checkClubPermissionServer(user.id, event.club_id, "member"),
  ]);

  if (!checkin && !clubRole) {
    return NextResponse.json(
      { error: "You must be checked in or a club member to upload photos" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { image_url, caption } = body as { image_url: string; caption?: string };

  if (!image_url) {
    return NextResponse.json({ error: "image_url is required" }, { status: 400 });
  }

  // Insert photo
  const { data: photo, error } = await supabase
    .from("event_photos")
    .insert({
      event_id: id,
      user_id: user.id,
      image_url,
      caption: caption || null,
    })
    .select("id, event_id, user_id, image_url, caption, sort_order, uploaded_at")
    .single();

  if (error) {
    console.error("[EventPhotos] POST insert error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ photo }, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase.from("events").select("club_id").eq("id", id).single();

  if (!event?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { order } = body as { order: { id: string; sort_order: number }[] };

  if (!order || !Array.isArray(order)) {
    return NextResponse.json({ error: "order array is required" }, { status: 400 });
  }

  for (const item of order) {
    await supabase
      .from("event_photos")
      .update({ sort_order: item.sort_order })
      .eq("id", item.id)
      .eq("event_id", id);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("photoId");

  if (!photoId) {
    return NextResponse.json({ error: "photoId is required" }, { status: 400 });
  }

  // Fetch the photo
  const { data: photo } = await supabase
    .from("event_photos")
    .select("id, event_id, user_id")
    .eq("id", photoId)
    .eq("event_id", id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // Check authorization: must be photo owner OR club admin+
  const isOwner = photo.user_id === user.id;

  if (!isOwner) {
    const { data: ev } = await supabase.from("events").select("club_id").eq("id", id).single();

    if (!ev) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const role = await checkClubPermissionServer(user.id, ev.club_id, "admin");
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabase.from("event_photos").delete().eq("id", photoId);

  if (error) {
    console.error("[EventPhotos] DELETE error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
