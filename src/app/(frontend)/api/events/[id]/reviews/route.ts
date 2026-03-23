import { NextResponse } from "next/server";

import { VALID_TAG_KEYS } from "@/lib/constants/review-tags";
import { createClient } from "@/lib/supabase/server";
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rating: number;
  let text: string | undefined;
  let tags: string[] = [];
  try {
    const body = await request.json();
    rating = body.rating;
    text = body.text;
    if (Array.isArray(body.tags)) {
      tags = body.tags.filter((t: unknown) => typeof t === "string" && VALID_TAG_KEYS.has(t));
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be an integer between 1 and 5" },
      { status: 400 },
    );
  }

  if (text && typeof text === "string" && text.trim().length > 500) {
    return NextResponse.json(
      { error: "Review text must be 500 characters or less" },
      { status: 400 },
    );
  }

  // Verify the event exists and is completed
  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.status !== "completed") {
    return NextResponse.json(
      { error: "Reviews can only be left for completed events" },
      { status: 400 },
    );
  }

  // Verify user has a check-in for this event
  const { data: checkin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (!checkin) {
    return NextResponse.json(
      { error: "Only checked-in participants can leave reviews" },
      { status: 403 },
    );
  }

  // Check for existing review
  const { data: existing } = await supabase
    .from("event_reviews")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this event" }, { status: 400 });
  }

  const { data: review, error } = await supabase
    .from("event_reviews")
    .insert({
      event_id: eventId,
      user_id: user.id,
      rating,
      text: text?.trim() || null,
      tags,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget: award coins for submitting a review
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  awardTokens(supabase, user.id, TOKEN_REWARDS.review, "review", review.id).catch(() => {});

  return NextResponse.json({ review });
}
