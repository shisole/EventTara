import { NavLink } from "@/components/navigation/NavigationContext";

import NextEventCard from "./NextEventCard";

export interface UpcomingEventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  cover_image_url: string | null;
  type: string;
  booking: { id: string; status: string; payment_status: string };
}

interface UpcomingEventsSectionProps {
  events: UpcomingEventItem[];
}

export default function UpcomingEventsSection({ events }: UpcomingEventsSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Upcoming</h2>
        {events.length > 0 && (
          <NavLink
            href="/my-events"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            See all &rarr;
          </NavLink>
        )}
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events.</p>
          <NavLink
            href="/events"
            className="mt-2 inline-block text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            Explore events &rarr;
          </NavLink>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <NextEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
