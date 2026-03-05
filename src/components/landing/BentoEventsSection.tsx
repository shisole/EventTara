import Link from "next/link";

import { fetchEventEnrichments, mapEventToCard } from "@/lib/events/map-event-card";
import { createClient } from "@/lib/supabase/server";

import BentoEventsClient from "./BentoEventsClient";

export default async function BentoEventsSection() {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  // Try featured events first
  const { data: featuredEvents } = await supabase
    .from("events")
    .select("*, bookings(count), organizer_profiles!inner(org_name)")
    .eq("status", "published")
    .eq("is_featured", true)
    .gte("date", now)
    .order("date", { ascending: true })
    .limit(10);

  // Fallback to upcoming if no featured
  let events = featuredEvents;
  let initialTab = "featured";

  if (!featuredEvents || featuredEvents.length === 0) {
    const { data: upcomingEvents } = await supabase
      .from("events")
      .select("*, bookings(count), organizer_profiles!inner(org_name)")
      .eq("status", "published")
      .gte("date", now)
      .order("date", { ascending: true })
      .limit(10);
    events = upcomingEvents;
    initialTab = "upcoming";
  }

  if (!events || events.length === 0) return null;

  const enrichments = await fetchEventEnrichments(supabase, events);
  const cards = events.map((event: any) => mapEventToCard(event, today, enrichments));

  return (
    <section className="py-12 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white">
            Discover Events
          </h2>
          <Link
            href="/events"
            className="text-lime-600 dark:text-lime-400 font-semibold hover:underline"
          >
            View all
          </Link>
        </div>
        <BentoEventsClient initialEvents={cards} initialTab={initialTab} />
      </div>
    </section>
  );
}
