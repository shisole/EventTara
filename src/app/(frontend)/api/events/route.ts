import { type NextRequest, NextResponse } from "next/server";

import { findProvinceFromLocation } from "@/lib/constants/philippine-provinces";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type EventType = Database["public"]["Tables"]["events"]["Row"]["type"];

function getEventStatus(eventDate: string, today: string): "upcoming" | "happening_now" | "past" {
  const dateOnly = eventDate.split("T")[0];
  if (dateOnly === today) return "happening_now";
  return dateOnly > today ? "upcoming" : "past";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const offset = Number.parseInt(searchParams.get("offset") || "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") || "9", 10);
  const type = searchParams.get("type") || "";
  const when = searchParams.get("when") || "";
  const search = searchParams.get("search") || "";

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Count query
  let countQuery = supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .in("status", ["published", "completed"]);

  // Data query
  let dataQuery = supabase
    .from("events")
    .select("*, bookings(count), organizer_profiles!inner(org_name)")
    .in("status", ["published", "completed"]);

  // Apply filters to both queries
  switch (when) {
    case "upcoming": {
      countQuery = countQuery.gt("date", today);
      dataQuery = dataQuery.gt("date", today);

      break;
    }
    case "now": {
      countQuery = countQuery.gte("date", today).lte("date", `${today}T23:59:59`);
      dataQuery = dataQuery.gte("date", today).lte("date", `${today}T23:59:59`);

      break;
    }
    case "past": {
      countQuery = countQuery.lt("date", today);
      dataQuery = dataQuery.lt("date", today);

      break;
    }
    // No default
  }

  if (type) {
    countQuery = countQuery.eq("type", type as EventType);
    dataQuery = dataQuery.eq("type", type as EventType);
  }

  if (search) {
    const pattern = search.trim().replaceAll(/\s+/g, "%");
    const filter = `title.ilike.%${pattern}%,location.ilike.%${pattern}%`;
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  // For "no when filter", we need custom sorting: upcoming first, then past reversed
  // We'll fetch with a basic order and sort in-memory for this case
  dataQuery = when
    ? dataQuery.order("date", { ascending: when !== "past" })
    : dataQuery.order("date", { ascending: true });

  const [{ count }, { data: allEvents }] = await Promise.all([
    countQuery,
    // For "no when filter", we need all events to sort properly, then slice
    when ? dataQuery.range(offset, offset + limit - 1) : dataQuery,
  ]);

  let events = allEvents || [];

  // When no "when" filter, sort upcoming first then past, then paginate
  if (!when && events.length > 0) {
    const upcoming = events.filter((e) => e.date.split("T")[0] >= today);
    const past = events.filter((e) => e.date.split("T")[0] < today).reverse();
    events = [...upcoming, ...past].slice(offset, offset + limit);
  }

  // Fetch review stats for completed events
  const completedIds = events.filter((e) => e.status === "completed").map((e) => e.id);
  const reviewStats: Record<string, { avg: number; count: number }> = {};

  if (completedIds.length > 0) {
    const { data: allRatings } = await supabase
      .from("event_reviews")
      .select("rating, event_id")
      .in("event_id", completedIds);

    if (allRatings) {
      const perEvent: Record<string, { sum: number; count: number }> = {};
      for (const r of allRatings) {
        if (!perEvent[r.event_id]) perEvent[r.event_id] = { sum: 0, count: 0 };
        perEvent[r.event_id].sum += r.rating;
        perEvent[r.event_id].count++;
      }
      for (const [eid, stats] of Object.entries(perEvent)) {
        reviewStats[eid] = { avg: stats.sum / stats.count, count: stats.count };
      }
    }
  }

  const gridEvents = events.map((event: any) => {
    const stats = reviewStats[event.id];
    return {
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      location: event.location,
      price: Number(event.price),
      cover_image_url: event.cover_image_url,
      max_participants: event.max_participants,
      booking_count: event.bookings?.[0]?.count || 0,
      status: getEventStatus(event.date, today),
      organizer_name: event.organizer_profiles?.org_name,
      organizer_id: event.organizer_id,
      coordinates: event.coordinates as { lat: number; lng: number } | null,
      avg_rating: stats?.avg,
      review_count: stats?.count,
    };
  });

  return NextResponse.json({ events: gridEvents, totalCount: count ?? 0 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get or create organizer profile
  let { data: profile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    // Auto-create organizer profile
    const { data: newProfile, error: profileError } = await supabase
      .from("organizer_profiles")
      .insert({ user_id: user.id, org_name: user.user_metadata?.full_name || "My Organization" })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    profile = newProfile;

    // Update user role to organizer
    await supabase.from("users").update({ role: "organizer" }).eq("id", user.id);
  }

  const body = await request.json();

  // Use provided coordinates, or fall back to province centroid lookup
  let coordinates = body.coordinates || null;
  if (!coordinates && body.location) {
    const province = findProvinceFromLocation(body.location);
    if (province) {
      coordinates = { lat: province.lat, lng: province.lng };
    }
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      organizer_id: profile.id,
      title: body.title,
      description: body.description,
      type: body.type,
      date: body.date,
      location: body.location,
      coordinates,
      max_participants: body.max_participants,
      price: body.price,
      cover_image_url: body.cover_image_url,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event });
}
