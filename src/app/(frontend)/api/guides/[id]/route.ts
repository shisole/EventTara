import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch guide
  const { data: guide, error } = await supabase.from("guides").select("*").eq("id", id).single();

  if (error || !guide) {
    return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  }

  // Fetch events via event_guides with event details
  const { data: eventGuideRows } = await supabase
    .from("event_guides")
    .select("event_id")
    .eq("guide_id", id);

  let events: any[] = [];
  if (eventGuideRows && eventGuideRows.length > 0) {
    const eventIds = eventGuideRows.map((eg) => eg.event_id);
    const { data: eventData } = await supabase
      .from("events")
      .select("*, bookings(count), organizer_profiles!inner(org_name)")
      .in("id", eventIds)
      .order("date", { ascending: false });

    events = (eventData || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      location: event.location,
      price: Number(event.price),
      cover_image_url: event.cover_image_url,
      status: event.status,
      booking_count: event.bookings?.[0]?.count || 0,
      organizer_name: event.organizer_profiles?.org_name,
    }));
  }

  // Fetch reviews with user info
  const { data: reviews } = await supabase
    .from("guide_reviews")
    .select("*, users(full_name, avatar_url)")
    .eq("guide_id", id)
    .order("created_at", { ascending: false });

  // Calculate avg rating
  let avgRating: number | null = null;
  const reviewList = reviews || [];
  if (reviewList.length > 0) {
    const sum = reviewList.reduce((acc, r) => acc + r.rating, 0);
    avgRating = sum / reviewList.length;
  }

  return NextResponse.json({
    guide: {
      ...guide,
      avg_rating: avgRating,
      review_count: reviewList.length,
    },
    events,
    reviews: reviewList,
  });
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

  // Verify ownership
  const { data: existing } = await supabase
    .from("guides")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  }

  if (existing.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const { data: guide, error } = await supabase
    .from("guides")
    .update({
      ...(body.full_name !== undefined && { full_name: body.full_name }),
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.avatar_url !== undefined && { avatar_url: body.avatar_url }),
      ...(body.contact_number !== undefined && { contact_number: body.contact_number }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ guide });
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

  // Verify ownership
  const { data: existing } = await supabase
    .from("guides")
    .select("created_by")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  }

  if (existing.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("guides").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
