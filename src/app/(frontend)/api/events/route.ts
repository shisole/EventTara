import { type NextRequest, NextResponse } from "next/server";

import { findProvinceFromLocation } from "@/lib/constants/philippine-provinces";
import { fetchEventEnrichments, mapEventToCard } from "@/lib/events/map-event-card";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type EventType = Database["public"]["Tables"]["events"]["Row"]["type"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const offset = Number.parseInt(searchParams.get("offset") || "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") || "9", 10);
  const type = searchParams.get("type") || "";
  const when = searchParams.get("when") || "";
  const search = searchParams.get("search") || "";
  const org = searchParams.get("org") || "";
  const guide = searchParams.get("guide") || "";
  const distance = searchParams.get("distance") || "";
  const difficulty = searchParams.get("difficulty") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

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
    const types = type.split(",").filter(Boolean) as EventType[];
    if (types.length === 1) {
      countQuery = countQuery.eq("type", types[0]);
      dataQuery = dataQuery.eq("type", types[0]);
    } else if (types.length > 1) {
      countQuery = countQuery.in("type", types);
      dataQuery = dataQuery.in("type", types);
    }
  }

  if (search) {
    const pattern = search.trim().replaceAll(/\s+/g, "%");

    // Also match organizer names
    const { data: matchingOrgs } = await supabase
      .from("organizer_profiles")
      .select("id")
      .ilike("org_name", `%${pattern}%`);
    const orgIds = matchingOrgs?.map((o) => o.id) ?? [];

    let filter = `title.ilike.%${pattern}%,location.ilike.%${pattern}%`;
    if (orgIds.length > 0) {
      filter += `,organizer_id.in.(${orgIds.join(",")})`;
    }
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  if (org) {
    const orgs = org.split(",").filter(Boolean);
    if (orgs.length === 1) {
      countQuery = countQuery.eq("organizer_id", orgs[0]);
      dataQuery = dataQuery.eq("organizer_id", orgs[0]);
    } else if (orgs.length > 1) {
      countQuery = countQuery.in("organizer_id", orgs);
      dataQuery = dataQuery.in("organizer_id", orgs);
    }
  }

  if (from) {
    countQuery = countQuery.gte("date", from);
    dataQuery = dataQuery.gte("date", from);
  }

  if (to) {
    countQuery = countQuery.lte("date", `${to}T23:59:59`);
    dataQuery = dataQuery.lte("date", `${to}T23:59:59`);
  }

  // Guide filter: fetch linked event IDs first, then constrain both queries
  if (guide) {
    const guideIds = guide.split(",").filter(Boolean);
    const linksQuery =
      guideIds.length === 1
        ? supabase.from("event_guides").select("event_id").eq("guide_id", guideIds[0])
        : supabase.from("event_guides").select("event_id").in("guide_id", guideIds);
    const { data: links } = await linksQuery;

    const eventIds = links?.map((l) => l.event_id) ?? [];
    if (eventIds.length === 0) {
      return NextResponse.json({ events: [], totalCount: 0 });
    }

    countQuery = countQuery.in("id", eventIds);
    dataQuery = dataQuery.in("id", eventIds);
  }

  // Distance filter: fetch linked event IDs first, then constrain both queries
  if (distance) {
    const distanceKms = distance.split(",").map(Number).filter(Boolean);
    const { data: distLinks } = await supabase
      .from("event_distances")
      .select("event_id")
      .in("distance_km", distanceKms);

    const distEventIds = distLinks?.map((d) => d.event_id) ?? [];
    if (distEventIds.length === 0) {
      return NextResponse.json({ events: [], totalCount: 0 });
    }

    countQuery = countQuery.in("id", distEventIds);
    dataQuery = dataQuery.in("id", distEventIds);
  }

  // Difficulty filter: range-based (e.g. "1-4", "5-7", "8-9")
  if (difficulty) {
    const [minStr, maxStr] = difficulty.split("-");
    const min = Number.parseInt(minStr, 10);
    const max = Number.parseInt(maxStr, 10);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      countQuery = countQuery
        .not("difficulty_level", "is", null)
        .gte("difficulty_level", min)
        .lte("difficulty_level", max);
      dataQuery = dataQuery
        .not("difficulty_level", "is", null)
        .gte("difficulty_level", min)
        .lte("difficulty_level", max);
    }
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

  // Fetch enrichments (race distances, review stats) and detail distances in parallel
  const eventIds = events.map((e) => e.id);

  const distancesByEvent: Record<
    string,
    {
      id: string;
      distance_km: number;
      label: string | null;
      price: number;
      max_participants: number;
    }[]
  > = {};

  const [enrichments] = await Promise.all([
    fetchEventEnrichments(supabase, events),
    // Detail distances for booking page (includes id, label, price, max_participants)
    eventIds.length > 0
      ? supabase
          .from("event_distances")
          .select("id, event_id, distance_km, label, price, max_participants")
          .in("event_id", eventIds)
          .order("distance_km", { ascending: true })
          .then(({ data }) => {
            if (data) {
              for (const d of data) {
                if (!distancesByEvent[d.event_id]) distancesByEvent[d.event_id] = [];
                distancesByEvent[d.event_id].push({
                  id: d.id,
                  distance_km: d.distance_km,
                  label: d.label,
                  price: d.price,
                  max_participants: d.max_participants,
                });
              }
            }
          })
      : Promise.resolve(),
  ]);

  const gridEvents = events.map((event: any) => ({
    ...mapEventToCard(event, today, enrichments),
    distances: distancesByEvent[event.id] ?? [],
  }));

  // Search for matching users when search param is provided
  let matchingUsers: {
    id: string;
    username: string | null;
    full_name: string;
    avatar_url: string | null;
  }[] = [];
  if (search) {
    const pattern = search.trim().replaceAll(/\s+/g, "%");
    const { data: users } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .eq("is_guest", false)
      .or(`username.ilike.%${pattern}%,full_name.ilike.%${pattern}%`)
      .limit(5);
    matchingUsers = (users ?? []).filter((u) => u.username);
  }

  return NextResponse.json({ events: gridEvents, totalCount: count ?? 0, users: matchingUsers });
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
      end_date: body.end_date || null,
      location: body.location,
      coordinates,
      max_participants: body.max_participants,
      price: body.price,
      cover_image_url: body.cover_image_url,
      difficulty_level: body.difficulty_level ?? null,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Bulk insert distances if provided
  let distances: Database["public"]["Tables"]["event_distances"]["Row"][] = [];
  if (Array.isArray(body.distances) && body.distances.length > 0) {
    const distanceRows = body.distances.map(
      (d: {
        distance_km: number;
        label?: string | null;
        price: number;
        max_participants: number;
      }) => ({
        event_id: event.id,
        distance_km: d.distance_km,
        label: d.label ?? null,
        price: d.price,
        max_participants: d.max_participants,
      }),
    );

    const { data: insertedDistances, error: distError } = await supabase
      .from("event_distances")
      .insert(distanceRows)
      .select();

    if (distError) {
      return NextResponse.json({ error: distError.message }, { status: 500 });
    }
    distances = insertedDistances ?? [];
  }

  return NextResponse.json({ event, distances });
}
