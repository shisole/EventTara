import { CalendarIcon } from "@/components/icons";
import { isBentoComingSoon } from "@/lib/cms/cached";
import { fetchEventEnrichments, mapEventToCard } from "@/lib/events/map-event-card";
import { createClient } from "@/lib/supabase/server";

import BentoEventsClient from "./BentoEventsClient";

function ComingSoonPlaceholder() {
  return (
    <section className="py-12 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-6">
          Discover Events
        </h2>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16">
          <CalendarIcon className="h-10 w-10 text-lime-500 mb-4" />
          <p className="font-heading text-xl font-bold text-gray-900 dark:text-white">
            Coming Soon
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Events from our clubs are on the way
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function BentoEventsSection() {
  const comingSoon = await isBentoComingSoon();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  // Try featured events first (only from public clubs)
  const { data: featuredEvents } = await supabase
    .from("events")
    .select("*, bookings(count), clubs!inner(name)")
    .eq("status", "published")
    .eq("is_featured", true)
    .eq("clubs.visibility", "public")
    .gte("date", now)
    .order("date", { ascending: true })
    .limit(10);

  // Fallback to upcoming if no featured
  let events = featuredEvents;
  let initialTab = "featured";

  if (!featuredEvents || featuredEvents.length === 0) {
    const { data: upcomingEvents } = await supabase
      .from("events")
      .select("*, bookings(count), clubs!inner(name)")
      .eq("status", "published")
      .eq("clubs.visibility", "public")
      .gte("date", now)
      .order("date", { ascending: true })
      .limit(10);
    events = upcomingEvents;
    initialTab = "upcoming";
  }

  if (!events || events.length === 0) return <ComingSoonPlaceholder />;

  // Count total upcoming for mobile "+N more" card (only public clubs)
  const { count: totalUpcoming } = await supabase
    .from("events")
    .select("id, clubs!inner(id)", { count: "exact", head: true })
    .eq("status", "published")
    .eq("clubs.visibility", "public")
    .gte("date", now);

  const enrichments = await fetchEventEnrichments(supabase, events);
  const cards = events.map((event: any) => mapEventToCard(event, today, enrichments));

  return (
    <section className="relative py-12 bg-white dark:bg-slate-800">
      <div className={comingSoon ? "pointer-events-none select-none blur-[6px]" : undefined}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white">
              Discover Events
            </h2>
            <span className="text-lime-600 dark:text-lime-400 font-semibold">View all</span>
          </div>
          <BentoEventsClient
            initialEvents={cards}
            initialTab={initialTab}
            totalUpcoming={totalUpcoming ?? 0}
          />
        </div>
      </div>

      {comingSoon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl bg-white/90 px-8 py-5 shadow-lg backdrop-blur-sm dark:bg-gray-900/90">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-6 w-6 text-lime-500" />
              <div>
                <p className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                  Coming Soon
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Events from our clubs are on the way
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
