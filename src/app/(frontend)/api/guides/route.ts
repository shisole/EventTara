import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const createdBy = searchParams.get("created_by") || "";
  const checkDate = searchParams.get("check_date") || "";
  const excludeEventId = searchParams.get("exclude_event_id") || "";

  const supabase = await createClient();

  let query = supabase.from("guides").select("*").order("created_at", { ascending: false });

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
  // Maps guide_id -> conflicting event title (if busy on check_date)
  let busyGuides: Record<string, string> = {};

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

    // Check guide availability for a specific date
    if (checkDate) {
      const dateObj = new Date(checkDate);
      const dayStart = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate(),
      ).toISOString();
      const dayEnd = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate() + 1,
      ).toISOString();

      const { data: busyRows } = await supabase
        .from("event_guides")
        .select("guide_id, event_id")
        .in("guide_id", guideIds);

      if (busyRows && busyRows.length > 0) {
        // Get the events to check their dates
        const eventIds = [...new Set(busyRows.map((r) => r.event_id))];
        // Exclude the current event being edited
        const filteredEventIds = excludeEventId
          ? eventIds.filter((eid) => eid !== excludeEventId)
          : eventIds;

        if (filteredEventIds.length > 0) {
          const { data: events } = await supabase
            .from("events")
            .select("id, title, date")
            .in("id", filteredEventIds)
            .gte("date", dayStart)
            .lt("date", dayEnd);

          if (events && events.length > 0) {
            const eventMap = new Map(events.map((e) => [e.id, e.title]));
            for (const row of busyRows) {
              if (eventMap.has(row.event_id)) {
                busyGuides[row.guide_id] = eventMap.get(row.event_id)!;
              }
            }
          }
        }
      }
    }
  }

  const result = (guides || []).map((guide) => ({
    ...guide,
    event_count: eventCounts[guide.id] || 0,
    avg_rating: reviewStats[guide.id]?.avg || null,
    review_count: reviewStats[guide.id]?.count || 0,
    ...(checkDate && {
      busy: !!busyGuides[guide.id],
      busy_event_title: busyGuides[guide.id] || null,
    }),
  }));

  return NextResponse.json({ guides: result });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
