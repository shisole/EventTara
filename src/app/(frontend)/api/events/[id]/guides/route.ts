import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  // Fetch event_guides rows for this event
  const { data: eventGuides, error } = await supabase
    .from("event_guides")
    .select("id, guide_id, created_at")
    .eq("event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!eventGuides || eventGuides.length === 0) {
    return NextResponse.json({ guides: [] });
  }

  const guideIds = eventGuides.map((eg) => eg.guide_id);

  // Fetch guide details
  const { data: guides, error: guidesError } = await supabase
    .from("guides")
    .select("*")
    .in("id", guideIds);

  if (guidesError) {
    return NextResponse.json({ error: guidesError.message }, { status: 500 });
  }

  // Fetch review stats for these guides
  const { data: reviews } = await supabase
    .from("guide_reviews")
    .select("guide_id, rating")
    .in("guide_id", guideIds);

  const reviewStats: Record<string, { avg: number; count: number }> = {};
  if (reviews) {
    const perGuide: Record<string, { sum: number; count: number }> = {};
    for (const r of reviews) {
      if (!perGuide[r.guide_id]) perGuide[r.guide_id] = { sum: 0, count: 0 };
      perGuide[r.guide_id].sum += r.rating;
      perGuide[r.guide_id].count++;
    }
    for (const [gid, stats] of Object.entries(perGuide)) {
      reviewStats[gid] = { avg: stats.sum / stats.count, count: stats.count };
    }
  }

  // Merge guide info with review stats and event_guide linking metadata
  const eventGuideMap = new Map(eventGuides.map((eg) => [eg.guide_id, eg]));

  const result = (guides || []).map((guide) => ({
    ...guide,
    event_guide_id: eventGuideMap.get(guide.id)?.id,
    linked_at: eventGuideMap.get(guide.id)?.created_at,
    avg_rating: reviewStats[guide.id]?.avg || null,
    review_count: reviewStats[guide.id]?.count || 0,
  }));

  return NextResponse.json({ guides: result });
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

  const body = await request.json();

  if (!body.guide_id) {
    return NextResponse.json({ error: "guide_id is required" }, { status: 400 });
  }

  // Check if the link already exists
  const { data: existing } = await supabase
    .from("event_guides")
    .select("id")
    .eq("event_id", eventId)
    .eq("guide_id", body.guide_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Guide is already linked to this event" }, { status: 409 });
  }

  const { data: eventGuide, error } = await supabase
    .from("event_guides")
    .insert({
      event_id: eventId,
      guide_id: body.guide_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event_guide: eventGuide });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.guide_id) {
    return NextResponse.json({ error: "guide_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("event_guides")
    .delete()
    .eq("event_id", eventId)
    .eq("guide_id", body.guide_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
