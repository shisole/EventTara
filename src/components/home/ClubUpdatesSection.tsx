import { NavLink } from "@/components/navigation/NavigationContext";
import { getActivityLabel, getActivitySolidColor } from "@/lib/constants/activity-types";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

export interface ClubUpdateEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  club_id: string;
}

interface ClubUpdatesSectionProps {
  events: ClubUpdateEvent[];
  clubMap: Map<string, { name: string; slug: string; logo_url: string | null }>;
}

export default function ClubUpdatesSection({ events, clubMap }: ClubUpdatesSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">From Your Clubs</h2>
        <NavLink
          href="/events"
          className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
        >
          Explore &rarr;
        </NavLink>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No upcoming events from your clubs yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const club = clubMap.get(event.club_id);
            return (
              <NavLink key={event.id} href={`/events/${event.id}`}>
                <div className="rounded-xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        getActivitySolidColor(event.type),
                      )}
                    >
                      {getActivityLabel(event.type)}
                    </span>
                    <span className="truncate text-sm font-medium">{event.title}</span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatEventDate(event.date, null, { short: true })}</span>
                    <span className="truncate">{event.location}</span>
                  </div>

                  {club && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{club.name}</p>
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </section>
  );
}
