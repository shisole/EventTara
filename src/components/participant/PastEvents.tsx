import Link from "next/link";
import { Card, UIBadge } from "@/components/ui";

interface PastEvent {
  eventId: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  eventPrice: number;
  badgeTitle: string | null;
  badgeImageUrl: string | null;
  checkedIn: boolean;
}

const typeLabels: Record<string, string> = {
  hiking: "Hiking", mtb: "Mountain Biking", road_bike: "Road Biking",
  running: "Running", trail_run: "Trail Running",
};

export default function PastEvents({ events }: { events: PastEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🏔️</p>
        <p className="text-gray-500 dark:text-gray-400">No past events yet. Your adventures will show up here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((e) => (
        <Card key={e.eventId} className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <UIBadge variant={e.eventType as any}>{typeLabels[e.eventType] || e.eventType}</UIBadge>
              <Link href={`/events/${e.eventId}`}>
                <h3 className="font-heading font-bold hover:text-lime-600 dark:hover:text-lime-400">{e.eventTitle}</h3>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(e.eventDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {e.eventPrice > 0 ? `₱${e.eventPrice.toLocaleString()}` : "Free"}
              </p>
            </div>
            <div className="text-right">
              {e.badgeTitle ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <span className="text-sm font-medium text-golden-600">{e.badgeTitle}</span>
                </div>
              ) : e.checkedIn ? (
                <span className="text-sm text-forest-500 font-medium">Checked In</span>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">Attended</span>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
