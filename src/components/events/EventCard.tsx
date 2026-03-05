import Image from "next/image";

import { NavLink } from "@/components/navigation/NavigationContext";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

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
  hasRoute?: boolean;
}

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

const solidTypeBadge: Record<string, string> = {
  hiking: "bg-emerald-500 text-white",
  mtb: "bg-amber-500 text-white",
  road_bike: "bg-blue-500 text-white",
  running: "bg-orange-500 text-white",
  trail_run: "bg-yellow-800 text-white",
};

function solidDifficultyBadge(level: number): string {
  if (level <= 4) return "bg-emerald-500 text-white";
  if (level <= 7) return "bg-amber-500 text-white";
  return "bg-red-500 text-white";
}

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
  hasRoute,
}: EventCardProps) {
  const spotsLeft = max_participants - booking_count;
  const formattedDate = formatEventDate(date, endDate, { short: true });
  const formattedPrice = price === 0 ? "Free" : `\u20B1${price.toLocaleString()}`;

  return (
    <NavLink href={`/events/${id}`}>
      <Card
        className={cn(
          "overflow-hidden cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
          status === "past" && "opacity-60",
        )}
      >
        {/* Image section (~65% of card) */}
        <div className="relative h-52 sm:h-56 bg-gradient-to-br from-lime-100 to-forest-100 dark:from-lime-900 dark:to-forest-900">
          {cover_image_url && (
            <Image
              src={cover_image_url}
              alt={title}
              fill
              sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 300px"
              className="object-cover"
            />
          )}

          {/* Status badge — top left */}
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

          {/* Pills — bottom left */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm",
                solidTypeBadge[type] ?? "bg-gray-500 text-white",
              )}
            >
              {typeLabels[type] || type}
            </span>
            {difficulty_level != null && (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm",
                  solidDifficultyBadge(difficulty_level),
                )}
              >
                {difficulty_level}/9
              </span>
            )}
            {race_distances &&
              race_distances.length > 0 &&
              race_distances.map((km) => (
                <span
                  key={km}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500 text-white shadow-sm"
                >
                  {km} km
                </span>
              ))}
            {hasRoute && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FC4C02] text-white shadow-sm">
                <svg
                  className="h-2.5 w-2.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 17l4-4 4 4 4-4 4 4M3 7l4-4 4 4 4-4 4 4" />
                </svg>
                Route
              </span>
            )}
          </div>
        </div>

        {/* Content section */}
        <div className="p-3 sm:p-4 space-y-2">
          {/* Title + Price */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading font-bold text-base truncate">{title}</h3>
            <span className="shrink-0 text-sm font-bold text-lime-600 dark:text-lime-400">
              {formattedPrice}
            </span>
          </div>

          {/* Organizer */}
          {organizer_name && organizer_id ? (
            <OrganizerLink organizerId={organizer_id} name={organizer_name} />
          ) : organizer_name ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">by {organizer_name}</p>
          ) : null}

          {/* 2-column info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {/* Row 1: Date | Location */}
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 min-w-0">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 min-w-0">
              <svg
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">{location}</span>
              {distance != null && (
                <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                  {distance < 1 ? "<1km" : `~${Math.round(distance)}km`}
                </span>
              )}
            </div>

            {/* Row 2: Rating | Spots */}
            <div className="flex items-center gap-1 min-w-0">
              {avg_rating != null && avg_rating > 0 && review_count != null && review_count > 0 ? (
                <>
                  <span className="text-yellow-400">&#9733;</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {avg_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">({review_count})</span>
                </>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">No reviews</span>
              )}
            </div>
            <div className="flex items-center">
              <span
                className={cn(
                  "text-xs font-medium",
                  spotsLeft <= 0
                    ? "text-red-500"
                    : spotsLeft <= 5
                      ? "text-red-500"
                      : "text-gray-400 dark:text-gray-500",
                )}
              >
                {spotsLeft <= 0 ? "Fully Booked" : `${spotsLeft} spots left`}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
