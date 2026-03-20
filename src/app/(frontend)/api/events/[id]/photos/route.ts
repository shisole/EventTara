import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: photos, error } = await supabase
    .from("event_photos")
    .select("id, event_id, image_url, caption, sort_order, uploaded_at")
    .eq("event_id", id)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch photos" }, { status: 500 });
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

  // Get the event's club_id
  const { data: event } = await supabase.from("events").select("club_id").eq("id", id).single();

  if (!event?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Verify user has permission to edit events in this club
  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { image_url, caption, sort_order } = body as {
    image_url: string;
    caption?: string | null;
    sort_order?: number;
  };

  if (!image_url) {
    return NextResponse.json({ error: "image_url is required" }, { status: 400 });
  }

  const { data: photo, error } = await supabase
    .from("event_photos")
    .insert({
      event_id: id,
      image_url,
      caption: caption ?? null,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    console.error("[event-photos] Insert error:", error);
    return NextResponse.json({ error: "Failed to add photo" }, { status: 500 });
  }

  return NextResponse.json({ photo }, { status: 201 });
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

  // Get the event's club_id
  const { data: event } = await supabase.from("events").select("club_id").eq("id", id).single();

  if (!event?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { photo_id } = body as { photo_id: string };

  if (!photo_id) {
    return NextResponse.json({ error: "photo_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("event_photos")
    .delete()
    .eq("id", photo_id)
    .eq("event_id", id);

  if (error) {
    console.error("[event-photos] Delete error:", error);
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
