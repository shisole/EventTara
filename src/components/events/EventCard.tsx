import Link from "next/link";
import Image from "next/image";
import { Card, UIBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import OrganizerLink from "./OrganizerLink";

interface EventCardProps {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  price: number;
  cover_image_url: string | null;
  max_participants: number;
  booking_count: number;
  upcoming?: boolean;
  organizer_name?: string;
  organizer_id?: string;
}

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

export default function EventCard({
  id,
  title,
  type,
  date,
  location,
  price,
  cover_image_url,
  max_participants,
  booking_count,
  upcoming,
  organizer_name,
  organizer_id,
}: EventCardProps) {
  const spotsLeft = max_participants - booking_count;
  const formattedDate = new Date(date).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/events/${id}`}>
      <Card className="overflow-hidden cursor-pointer">
        <div className="relative h-48 bg-gradient-to-br from-lime-100 to-forest-100 dark:from-lime-900 dark:to-forest-900">
          {cover_image_url && (
            <Image
              src={cover_image_url}
              alt={title}
              fill
              className="object-cover"
            />
          )}
          {upcoming && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-500 text-gray-900">
                Upcoming
              </span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <UIBadge variant={type as any}>
            {typeLabels[type] || type}
          </UIBadge>
          <h3 className="font-heading font-bold text-lg line-clamp-1">
            {title}
          </h3>
          {organizer_name && organizer_id ? (
            <OrganizerLink organizerId={organizer_id} name={organizer_name} />
          ) : organizer_name ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">by {organizer_name}</p>
          ) : null}
          <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{location}</p>
          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-lime-600 dark:text-lime-400">
              {price === 0 ? "Free" : `\u20B1${price.toLocaleString()}`}
            </span>
            <span
              className={cn(
                "text-sm",
                spotsLeft <= 5 ? "text-red-500 font-medium" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {spotsLeft <= 0 ? "Fully Booked" : `${spotsLeft} spots left`}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
