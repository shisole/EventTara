import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import EventCard from "@/components/events/EventCard";
import EventFilters from "@/components/events/EventFilters";

type EventType = Database["public"]["Tables"]["events"]["Row"]["type"];

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

  let query = supabase
    .from("events")
    .select("*, bookings(count), organizer_profiles!inner(org_name)")
    .in("status", ["published", "completed"])
    .order("date", { ascending: true });

  if (params.when === "upcoming") {
    query = query.gt("date", today);
  } else if (params.when === "now") {
    query = query.gte("date", today).lte("date", `${today}T23:59:59`);
  } else if (params.when === "past") {
    query = query.lt("date", today);
  }

  if (params.type) {
    query = query.eq("type", params.type as EventType);
  }

  if (params.search) {
    const pattern = params.search.trim().replace(/\s+/g, "%");
    query = query.or(
      `title.ilike.%${pattern}%,location.ilike.%${pattern}%`
    );
  }

  const { data: events } = await query;

  // Fetch review stats for completed events
  const completedIds = (events || []).filter((e) => e.status === "completed").map((e) => e.id);
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

  // When showing all events (no "when" filter), put upcoming first then past
  const sortedEvents = !params.when && events
    ? (() => {
        const upcoming = events.filter((e) => e.date.split("T")[0] >= today);
        const past = events.filter((e) => e.date.split("T")[0] < today).reverse();
        return [...upcoming, ...past];
      })()
    : events;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-4">
          Explore Events
        </h1>
        <EventFilters />
      </div>

      {sortedEvents && sortedEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event: any, i: number) => {
            const stats = reviewStats[event.id];
            return (
              <div
                key={event.id}
                className="opacity-0 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <EventCard
                  id={event.id}
                  title={event.title}
                  type={event.type}
                  date={event.date}
                  location={event.location}
                  price={Number(event.price)}
                  cover_image_url={event.cover_image_url}
                  max_participants={event.max_participants}
                  booking_count={event.bookings?.[0]?.count || 0}
                  status={getEventStatus(event.date, today)}
                  organizer_name={event.organizer_profiles?.org_name}
                  organizer_id={event.organizer_id}
                  avg_rating={stats?.avg}
                  review_count={stats?.count}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 opacity-0 animate-fade-up">
          <p className="text-5xl mb-4">&#x1F3D4;&#xFE0F;</p>
          <h2 className="text-xl font-heading font-bold text-gray-700 dark:text-gray-300 mb-2">
            No events found
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Check back soon — new adventures are being planned!
          </p>
        </div>
      )}
    </div>
  );
}
