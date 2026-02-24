import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guideId } = await params;
  const supabase = await createClient();

  // Verify guide exists
  const { data: guide } = await supabase
    .from("guides")
    .select("id")
    .eq("id", guideId)
    .single();

  if (!guide) {
    return NextResponse.json({ error: "Guide not found" }, { status: 404 });
  }

  // Fetch reviews with user info
  const { data: reviews, error } = await supabase
    .from("guide_reviews")
    .select("*, users(full_name, avatar_url)")
    .eq("guide_id", guideId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: reviews || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: guideId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event_id: string;
  let rating: number;
  let text: string | undefined;
  try {
    const body = await request.json();
    event_id = body.event_id;
    rating = body.rating;
    text = body.text;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!event_id) {
    return NextResponse.json(
      { error: "event_id is required" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 }
    );
  }

  if (text && typeof text === "string" && text.trim().length > 500) {
    return NextResponse.json(
      { error: "Review text must be 500 characters or less" },
      { status: 400 }
    );
  }

  // Verify the event exists and is completed
  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", event_id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.status !== "completed") {
    return NextResponse.json(
      { error: "Reviews can only be left for completed events" },
      { status: 400 }
    );
  }

  // Verify the guide is tagged on this event
  const { data: eventGuide } = await supabase
    .from("event_guides")
    .select("id")
    .eq("event_id", event_id)
    .eq("guide_id", guideId)
    .single();

  if (!eventGuide) {
    return NextResponse.json(
      { error: "This guide is not associated with the specified event" },
      { status: 400 }
    );
  }

  // Verify the user has a confirmed booking on this event
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("event_id", event_id)
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .single();

  if (!booking) {
    return NextResponse.json(
      { error: "You must have a confirmed booking on this event to review the guide" },
      { status: 400 }
    );
  }

  // Check for existing review by this user for this guide on this event
  const { data: existing } = await supabase
    .from("guide_reviews")
    .select("id")
    .eq("guide_id", guideId)
    .eq("user_id", user.id)
    .eq("event_id", event_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "You have already reviewed this guide for this event" },
      { status: 400 }
    );
  }

  const { data: review, error } = await supabase
    .from("guide_reviews")
    .insert({
      guide_id: guideId,
      user_id: user.id,
      event_id,
      rating,
      text: text?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ review });
}
