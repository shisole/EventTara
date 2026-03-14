import type { SupabaseClient } from "@supabase/supabase-js";

import { cdnUrl } from "@/lib/storage";
import type { Database } from "@/lib/supabase/types";

export interface EventCardData {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location: string;
  price: number;
  cover_image_url: string | null;
  max_participants: number;
  booking_count: number;
  status: "upcoming" | "happening_now" | "past";
  organizer_name?: string;
  club_id?: string;
  club_name?: string;
  club_slug?: string;
  club_logo_url?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  avg_rating?: number;
  review_count?: number;
  difficulty_level?: number | null;
  race_distances: number[];
  hasRoute?: boolean;
  is_featured?: boolean;
  is_demo?: boolean;
  members_only?: boolean;
}

export interface EventEnrichments {
  raceDistances: Record<string, number[]>;
  reviewStats: Record<string, { avg: number; count: number }>;
  routeEventIds: Set<string>;
}

export function getEventStatus(
  eventDate: string,
  today: string,
): "upcoming" | "happening_now" | "past" {
  const dateOnly = eventDate.split("T")[0];
  if (dateOnly === today) return "happening_now";
  return dateOnly > today ? "upcoming" : "past";
}

/**
 * Fetch enrichment data (race distances, review stats) for a batch of events.
 */
export async function fetchEventEnrichments(
  supabase: SupabaseClient<Database>,
  events: { id: string; status?: string }[],
): Promise<EventEnrichments> {
  const eventIds = events.map((e) => e.id);

  if (eventIds.length === 0) {
    return { raceDistances: {}, reviewStats: {}, routeEventIds: new Set() };
  }

  // Fetch race distances, review stats, and route existence in parallel
  const completedIds = events.filter((e) => e.status === "completed").map((e) => e.id);

  const [distResult, reviewResult, routeResult] = await Promise.all([
    supabase
      .from("event_distances")
      .select("event_id, distance_km")
      .in("event_id", eventIds)
      .order("distance_km", { ascending: true }),
    completedIds.length > 0
      ? supabase.from("event_reviews").select("rating, event_id").in("event_id", completedIds)
      : Promise.resolve({ data: null }),
    supabase.from("event_routes").select("event_id").in("event_id", eventIds),
  ]);

  // Build race distance map
  const raceDistances: Record<string, number[]> = {};
  if (distResult.data) {
    for (const d of distResult.data) {
      if (!raceDistances[d.event_id]) raceDistances[d.event_id] = [];
      raceDistances[d.event_id].push(d.distance_km);
    }
  }

  // Build review stats map
  const reviewStats: Record<string, { avg: number; count: number }> = {};
  if (reviewResult.data) {
    const perEvent: Record<string, { sum: number; count: number }> = {};
    for (const r of reviewResult.data) {
      if (!perEvent[r.event_id]) perEvent[r.event_id] = { sum: 0, count: 0 };
      perEvent[r.event_id].sum += r.rating;
      perEvent[r.event_id].count++;
    }
    for (const [eid, stats] of Object.entries(perEvent)) {
      reviewStats[eid] = { avg: stats.sum / stats.count, count: stats.count };
    }
  }

  // Build route existence set
  const routeEventIds = new Set<string>();
  if (routeResult.data) {
    for (const r of routeResult.data) {
      routeEventIds.add(r.event_id);
    }
  }

  return { raceDistances, reviewStats, routeEventIds };
}

/**
 * Map a raw Supabase event row + enrichments → EventCard props.
 */
export function mapEventToCard(
  event: any,
  today: string,
  enrichments: EventEnrichments,
): EventCardData {
  const stats = enrichments.reviewStats[event.id];
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    date: event.date,
    endDate: event.end_date,
    location: event.location,
    price: Number(event.price),
    cover_image_url: cdnUrl(event.cover_image_url) ?? event.cover_image_url,
    max_participants: event.max_participants,
    booking_count: event.bookings?.[0]?.count || 0,
    status: getEventStatus(event.date, today),
    organizer_name: event.clubs?.name,
    club_id: event.club_id ?? undefined,
    club_name: event.clubs?.name ?? undefined,
    club_slug: event.clubs?.slug ?? undefined,
    club_logo_url: event.clubs?.logo_url ?? undefined,
    coordinates: event.coordinates as { lat: number; lng: number } | null,
    avg_rating: stats?.avg,
    review_count: stats?.count,
    difficulty_level: event.difficulty_level,
    race_distances: enrichments.raceDistances[event.id] ?? [],
    hasRoute: enrichments.routeEventIds.has(event.id),
    is_featured: event.is_featured ?? false,
    is_demo: event.is_demo ?? false,
    members_only: event.members_only ?? false,
  };
}
