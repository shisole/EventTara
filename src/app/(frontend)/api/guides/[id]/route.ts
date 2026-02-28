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
