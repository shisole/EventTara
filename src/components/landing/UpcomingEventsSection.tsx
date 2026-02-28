import Link from "next/link";

import EventCard from "@/components/events/EventCard";
import EventCarousel from "@/components/events/EventCarousel";
import { fetchEventEnrichments, mapEventToCard } from "@/lib/events/map-event-card";
import { createClient } from "@/lib/supabase/server";

export default async function UpcomingEventsSection() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  const [{ count: totalUpcoming }, { data: upcomingEvents }] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .gte("date", now),
    supabase
      .from("events")
      .select("*, bookings(count), organizer_profiles!inner(org_name)")
      .eq("status", "published")
      .gte("date", now)
      .order("date", { ascending: true })
      .limit(5),
  ]);

  if (!upcomingEvents || upcomingEvents.length === 0) return null;

  const enrichments = await fetchEventEnrichments(supabase, upcomingEvents);
  const cards = upcomingEvents.map((event: any) => mapEventToCard(event, today, enrichments));
  const remainingCount = (totalUpcoming || 0) - upcomingEvents.length;

  return (
    <section className="py-12 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white">
            Upcoming Events
          </h2>
          <Link
            href="/events?when=upcoming"
            className="text-lime-600 dark:text-lime-400 font-semibold hover:underline"
          >
            View all
          </Link>
        </div>
        <EventCarousel>
          {cards.map((card) => (
            <div
              key={card.id}
              className="min-w-[280px] max-w-[300px] flex-shrink-0 md:min-w-[320px] md:max-w-[350px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <EventCard {...card} />
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              className="min-w-[240px] flex-shrink-0 md:min-w-[280px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <Link
                href="/events"
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-600 hover:border-lime-500 dark:hover:border-lime-500 transition-colors h-full min-h-[280px]"
              >
                <span className="text-3xl font-heading font-bold text-lime-600 dark:text-lime-400">
                  +{remainingCount}
                </span>
                <span className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  more events
                </span>
              </Link>
            </div>
          )}
        </EventCarousel>
      </div>
    </section>
  );
}
