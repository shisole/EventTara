import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import EventFilters from "@/components/events/EventFilters";
import EventsListClient from "@/components/events/EventsListClient";

type EventType = Database["public"]["Tables"]["events"]["Row"]["type"];

const BATCH_SIZE = 9;

export const metadata = {
  title: "Explore Events \u2014 EventTara",
  description:
    "Find your next adventure. Browse hiking, biking, running, and trail events.",
};

function getEventStatus(eventDate: string, today: string): "upcoming" | "happening_now" | "past" {
  const dateOnly = eventDate.split("T")[0];
  if (dateOnly === today) return "happening_now";
  return dateOnly > today ? "upcoming" : "past";
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; search?: string; when?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Count query for total
  let countQuery = supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .in("status", ["published", "completed"]);

  // Data query for first batch
  let dataQuery = supabase
    .from("events")
    .select("*, bookings(count), organizer_profiles!inner(org_name)")
    .in("status", ["published", "completed"])
    .order("date", { ascending: true });

  // Apply filters to both
  if (params.when === "upcoming") {
    countQuery = countQuery.gt("date", today);
    dataQuery = dataQuery.gt("date", today);
  } else if (params.when === "now") {
    countQuery = countQuery.gte("date", today).lte("date", `${today}T23:59:59`);
    dataQuery = dataQuery.gte("date", today).lte("date", `${today}T23:59:59`);
  } else if (params.when === "past") {
    countQuery = countQuery.lt("date", today);
    dataQuery = dataQuery.lt("date", today);
  }

  if (params.type) {
    countQuery = countQuery.eq("type", params.type as EventType);
    dataQuery = dataQuery.eq("type", params.type as EventType);
  }

  if (params.search) {
    const pattern = params.search.trim().replace(/\s+/g, "%");
    const filter = `title.ilike.%${pattern}%,location.ilike.%${pattern}%`;
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  // For "no when filter" we need all events to sort upcoming-first, then slice
  const [{ count }, { data: allEvents }] = await Promise.all([
    countQuery,
    !params.when ? dataQuery : dataQuery.range(0, BATCH_SIZE - 1),
  ]);

  let events = allEvents || [];

  if (!params.when && events.length > 0) {
    const upcoming = events.filter((e) => e.date.split("T")[0] >= today);
    const past = events.filter((e) => e.date.split("T")[0] < today).reverse();
    events = [...upcoming, ...past].slice(0, BATCH_SIZE);
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

  const totalCount = count ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-4">
          Explore Events
        </h1>
        <EventFilters />
      </div>

      <EventsListClient initialEvents={gridEvents} totalCount={totalCount} />
    </div>
  );
}
