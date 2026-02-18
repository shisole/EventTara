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

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("*, bookings(count)")
    .eq("status", "published")
    .order("date", { ascending: true });

  if (params.type) {
    query = query.eq("type", params.type as EventType);
  }

  const { data: events } = await query;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-4">
          Explore Events
        </h1>
        <EventFilters />
      </div>

      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event: any) => (
            <EventCard
              key={event.id}
              id={event.id}
              title={event.title}
              type={event.type}
              date={event.date}
              location={event.location}
              price={Number(event.price)}
              cover_image_url={event.cover_image_url}
              max_participants={event.max_participants}
              booking_count={event.bookings?.[0]?.count || 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">&#x1F3D4;&#xFE0F;</p>
          <h2 className="text-xl font-heading font-bold text-gray-700 mb-2">
            No events found
          </h2>
          <p className="text-gray-500">
            Check back soon — new adventures are being planned!
          </p>
        </div>
      )}
    </div>
  );
}
