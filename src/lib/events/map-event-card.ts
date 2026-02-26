import type { SupabaseClient } from "@supabase/supabase-js";

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
  organizer_id?: string;
  coordinates?: { lat: number; lng: number } | null;
  avg_rating?: number;
  review_count?: number;
  difficulty_level?: number | null;
  race_distances: number[];
}

export interface EventEnrichments {
  raceDistances: Record<string, number[]>;
  reviewStats: Record<string, { avg: number; count: number }>;
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
    return { raceDistances: {}, reviewStats: {} };
  }

  // Fetch race distances and review stats in parallel
  const completedIds = events.filter((e) => e.status === "completed").map((e) => e.id);

  const [distResult, reviewResult] = await Promise.all([
    supabase
      .from("event_distances")
      .select("event_id, distance_km")
      .in("event_id", eventIds)
      .order("distance_km", { ascending: true }),
    completedIds.length > 0
      ? supabase.from("event_reviews").select("rating, event_id").in("event_id", completedIds)
      : Promise.resolve({ data: null }),
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

  return { raceDistances, reviewStats };
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
    cover_image_url: event.cover_image_url,
    max_participants: event.max_participants,
    booking_count: event.bookings?.[0]?.count || 0,
    status: getEventStatus(event.date, today),
    organizer_name: event.organizer_profiles?.org_name,
    organizer_id: event.organizer_id,
    coordinates: event.coordinates as { lat: number; lng: number } | null,
    avg_rating: stats?.avg,
    review_count: stats?.count,
    difficulty_level: event.difficulty_level,
    race_distances: enrichments.raceDistances[event.id] ?? [],
  };
}
