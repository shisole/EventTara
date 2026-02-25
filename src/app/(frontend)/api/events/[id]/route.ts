import { NextResponse } from "next/server";

import { findProvinceFromLocation } from "@/lib/constants/philippine-provinces";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase.from("events").select("*").eq("id", id).single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Use provided coordinates, or fall back to province centroid lookup
  let coordinates = body.coordinates === undefined ? undefined : body.coordinates;
  if (coordinates === undefined && body.location) {
    const province = findProvinceFromLocation(body.location);
    if (province) {
      coordinates = { lat: province.lat, lng: province.lng };
    }
  }

  const { data: event, error } = await supabase
    .from("events")
    .update({
      title: body.title,
      description: body.description,
      type: body.type,
      date: body.date,
      ...(body.end_date !== undefined && { end_date: body.end_date }),
      location: body.location,
      ...(coordinates !== undefined && { coordinates }),
      max_participants: body.max_participants,
      price: body.price,
      cover_image_url: body.cover_image_url,
      ...(body.difficulty_level !== undefined && { difficulty_level: body.difficulty_level }),
      ...(body.status && { status: body.status }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event });
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

  const { error } = await supabase.from("events").update({ status: "cancelled" }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
