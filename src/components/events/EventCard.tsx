import Image from "next/image";
import Link from "next/link";

import { Card, UIBadge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

import DifficultyBadge from "./DifficultyBadge";
import OrganizerLink from "./OrganizerLink";

type EventStatus = "upcoming" | "happening_now" | "past";

interface EventCardProps {
  id: string;
  title: string;
  type: string;
  date: string;
  endDate?: string | null;
  location: string;
  price: number;
  cover_image_url: string | null;
  max_participants: number;
  booking_count: number;
  status?: EventStatus;
  organizer_name?: string;
  organizer_id?: string;
  distance?: number;
  avg_rating?: number;
  review_count?: number;
  difficulty_level?: number | null;
  race_distances?: number[];
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
  endDate,
  location,
  price,
  cover_image_url,
  max_participants,
  booking_count,
  status,
  organizer_name,
  organizer_id,
  distance,
  avg_rating,
  review_count,
  difficulty_level,
  race_distances,
}: EventCardProps) {
  const spotsLeft = max_participants - booking_count;
  const formattedDate = formatEventDate(date, endDate, { short: true });

  return (
    <Link href={`/events/${id}`}>
      <Card
        className={cn(
          "overflow-hidden cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
          status === "past" && "opacity-60",
        )}
      >
        <div className="relative h-48 bg-gradient-to-br from-lime-100 to-forest-100 dark:from-lime-900 dark:to-forest-900">
          {cover_image_url && (
            <Image
              src={cover_image_url}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 350px"
              className="object-cover"
            />
          )}
          {status === "happening_now" && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                Happening Now
              </span>
            </div>
          )}
          {status === "upcoming" && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-500 text-gray-900">
                Upcoming
              </span>
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <UIBadge variant={type}>{typeLabels[type] || type}</UIBadge>
            {difficulty_level != null && <DifficultyBadge level={difficulty_level} />}
            {race_distances &&
              race_distances.length > 0 &&
              race_distances.map((km) => (
                <span
                  key={km}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                >
                  {km} km
                </span>
              ))}
          </div>
          <h3 className="font-heading font-bold text-lg line-clamp-1">{title}</h3>
          {organizer_name && organizer_id ? (
            <OrganizerLink organizerId={organizer_id} name={organizer_name} />
          ) : organizer_name ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">by {organizer_name}</p>
          ) : null}
          <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</p>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{location}</p>
            {distance != null && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                {distance < 1 ? "<1km" : `~${Math.round(distance)}km`}
              </span>
            )}
          </div>
          {avg_rating != null && avg_rating > 0 && review_count != null && review_count > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-yellow-400">&#9733;</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {avg_rating.toFixed(1)}
              </span>
              <span className="text-gray-400 dark:text-gray-500">({review_count})</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-lime-600 dark:text-lime-400">
              {price === 0 ? "Free" : `\u20B1${price.toLocaleString()}`}
            </span>
            <span
              className={cn(
                "text-sm",
                spotsLeft <= 5 ? "text-red-500 font-medium" : "text-gray-400 dark:text-gray-500",
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
