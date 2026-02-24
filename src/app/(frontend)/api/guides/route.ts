import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const createdBy = searchParams.get("created_by") || "";

  const supabase = await createClient();

  let query = supabase
    .from("guides")
    .select("*")
    .order("created_at", { ascending: false });

  if (createdBy) {
    query = query.eq("created_by", createdBy);
  }

  const { data: guides, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch event counts and avg ratings separately
  const guideIds = (guides || []).map((g) => g.id);

  let eventCounts: Record<string, number> = {};
  let reviewStats: Record<string, { avg: number; count: number }> = {};

  if (guideIds.length > 0) {
    // Get event counts via event_guides
    const { data: eventGuideRows } = await supabase
      .from("event_guides")
      .select("guide_id")
      .in("guide_id", guideIds);

    if (eventGuideRows) {
      for (const row of eventGuideRows) {
        eventCounts[row.guide_id] = (eventCounts[row.guide_id] || 0) + 1;
      }
    }

    // Get review stats via guide_reviews
    const { data: reviews } = await supabase
      .from("guide_reviews")
      .select("guide_id, rating")
      .in("guide_id", guideIds);

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
  }

  const result = (guides || []).map((guide) => ({
    ...guide,
    event_count: eventCounts[guide.id] || 0,
    avg_rating: reviewStats[guide.id]?.avg || null,
    review_count: reviewStats[guide.id]?.count || 0,
  }));

  return NextResponse.json({ guides: result });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.full_name) {
    return NextResponse.json({ error: "full_name is required" }, { status: 400 });
  }

  const { data: guide, error } = await supabase
    .from("guides")
    .insert({
      full_name: body.full_name,
      bio: body.bio || null,
      avatar_url: body.avatar_url || null,
      contact_number: body.contact_number || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ guide });
}
