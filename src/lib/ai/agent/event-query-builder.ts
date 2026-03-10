import { type ParsedSearchParams } from "@/lib/ai/search-prompt";
import { ACTIVITY_TYPES } from "@/lib/constants/activity-types";
import { haversineDistance } from "@/lib/utils/geo";

import { type AgentSupabaseClient, type MiniEventResult } from "./types";

interface EventQueryOptions {
  supabase: AgentSupabaseClient;
  parsed: ParsedSearchParams;
  userLocation?: { lat: number; lng: number } | null;
}

interface EventQueryResult {
  events: MiniEventResult[];
  totalCount: number;
  filterUrl: string;
}

/**
 * Build and execute an event search query from parsed search params.
 * Extracted from the chat route.ts to be shared between legacy path and searchEvents tool.
 */
export async function executeEventSearch({
  supabase,
  parsed,
  userLocation,
}: EventQueryOptions): Promise<EventQueryResult> {
  const today = new Date().toISOString().split("T")[0];

  let countQ = supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .in("status", ["published", "completed"] as const);

  let dataQ = supabase
    .from("events")
    .select("id, title, type, date, location, price, cover_image_url, coordinates")
    .in("status", ["published", "completed"] as const);

  // Activity type filter
  if (parsed.type && (ACTIVITY_TYPES as readonly string[]).includes(parsed.type)) {
    countQ = countQ.eq("type", parsed.type);
    dataQ = dataQ.eq("type", parsed.type);
  }

  // Text search (title, location, club name, guide name)
  if (parsed.search) {
    const pattern = parsed.search.trim().replaceAll(/\s+/g, "%");

    const { data: matchingClubs } = await supabase
      .from("clubs")
      .select("id")
      .ilike("name", `%${pattern}%`);
    const clubIds = matchingClubs?.map((c) => c.id) ?? [];

    const { data: matchingGuides } = await supabase
      .from("guides")
      .select("id")
      .ilike("full_name", `%${pattern}%`);
    let guideEventIds: string[] = [];
    if (matchingGuides && matchingGuides.length > 0) {
      const guideIds = matchingGuides.map((g) => g.id);
      const { data: links } = await supabase
        .from("event_guides")
        .select("event_id")
        .in("guide_id", guideIds);
      guideEventIds = links?.map((l) => l.event_id) ?? [];
    }

    let filter = `title.ilike.%${pattern}%,location.ilike.%${pattern}%`;
    if (clubIds.length > 0) {
      filter += `,club_id.in.(${clubIds.join(",")})`;
    }
    if (guideEventIds.length > 0) {
      filter += `,id.in.(${guideEventIds.join(",")})`;
    }
    countQ = countQ.or(filter);
    dataQ = dataQ.or(filter);
  }

  // Duration filter
  if (parsed.duration === "single") {
    countQ = countQ.is("end_date", null);
    dataQ = dataQ.is("end_date", null);
  } else if (parsed.duration === "multi") {
    countQ = countQ.not("end_date", "is", null);
    dataQ = dataQ.not("end_date", "is", null);
  }

  // Distance filter
  if (parsed.distance) {
    const { data: distanceRows } = await supabase
      .from("event_distances")
      .select("event_id")
      .eq("distance_km", parsed.distance);
    const distanceEventIds = distanceRows?.map((d) => d.event_id) ?? [];
    if (distanceEventIds.length === 0) {
      return {
        events: [],
        totalCount: 0,
        filterUrl: buildFilterUrl(parsed),
      };
    }
    countQ = countQ.in("id", distanceEventIds);
    dataQ = dataQ.in("id", distanceEventIds);
  }

  // Difficulty filter
  if (parsed.difficulty) {
    const [minStr, maxStr] = parsed.difficulty.split("-");
    const min = Number.parseInt(minStr, 10);
    const max = Number.parseInt(maxStr, 10);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      countQ = countQ
        .not("difficulty_level", "is", null)
        .gte("difficulty_level", min)
        .lte("difficulty_level", max);
      dataQ = dataQ
        .not("difficulty_level", "is", null)
        .gte("difficulty_level", min)
        .lte("difficulty_level", max);
    }
  }

  // Date filters
  if (parsed.dateFrom) {
    countQ = countQ.gte("date", parsed.dateFrom);
    dataQ = dataQ.gte("date", parsed.dateFrom);
  }
  if (parsed.dateTo) {
    countQ = countQ.lte("date", `${parsed.dateTo}T23:59:59`);
    dataQ = dataQ.lte("date", `${parsed.dateTo}T23:59:59`);
  }

  // When filter
  if (parsed.when) {
    switch (parsed.when) {
      case "upcoming": {
        countQ = countQ.gt("date", today);
        dataQ = dataQ.gt("date", today);
        break;
      }
      case "now": {
        countQ = countQ.gte("date", today).lte("date", `${today}T23:59:59`);
        dataQ = dataQ.gte("date", today).lte("date", `${today}T23:59:59`);
        break;
      }
      case "past": {
        countQ = countQ.lt("date", today);
        dataQ = dataQ.lt("date", today);
        break;
      }
    }
  }

  // Fetch more if sorting by distance
  const fetchLimit = userLocation && parsed.nearMe ? 20 : 3;
  dataQ = dataQ.order("date", { ascending: true }).limit(fetchLimit);

  const [{ count: totalCount }, { data: events }] = await Promise.all([countQ, dataQ]);

  interface ChatEvent {
    id: string;
    title: string;
    type: string;
    date: string;
    location: string;
    price: number;
    cover_image_url: string | null;
    coordinates: { lat: number; lng: number } | null;
  }

  const allEvents = (events ?? []) as ChatEvent[];

  // Sort by distance when nearMe is requested
  const topEvents: ChatEvent[] =
    userLocation && parsed.nearMe && allEvents.length > 0
      ? [...allEvents]
          .sort((a, b) => {
            const distA = a.coordinates
              ? haversineDistance(
                  userLocation.lat,
                  userLocation.lng,
                  a.coordinates.lat,
                  a.coordinates.lng,
                )
              : Infinity;
            const distB = b.coordinates
              ? haversineDistance(
                  userLocation.lat,
                  userLocation.lng,
                  b.coordinates.lat,
                  b.coordinates.lng,
                )
              : Infinity;
            return distA - distB;
          })
          .slice(0, 3)
      : allEvents.slice(0, 3);

  const miniEvents: MiniEventResult[] = topEvents.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date,
    location: e.location,
    price: e.price,
    cover_image_url: e.cover_image_url,
  }));

  return {
    events: miniEvents,
    totalCount: totalCount ?? 0,
    filterUrl: buildFilterUrl(parsed),
  };
}

/** Build a filter URL for the events page from parsed params */
export function buildFilterUrl(parsed: ParsedSearchParams): string {
  const parts: string[] = [];
  if (parsed.search) parts.push(`search=${encodeURIComponent(parsed.search)}`);
  if (parsed.type) parts.push(`type=${parsed.type}`);
  if (parsed.dateFrom) parts.push(`from=${parsed.dateFrom}`);
  if (parsed.dateTo) parts.push(`to=${parsed.dateTo}`);
  if (parsed.when) parts.push(`when=${parsed.when}`);
  if (parsed.distance) parts.push(`distance=${parsed.distance}`);
  if (parsed.difficulty) parts.push(`difficulty=${parsed.difficulty}`);
  return `/events${parts.length > 0 ? `?${parts.join("&")}` : ""}`;
}
