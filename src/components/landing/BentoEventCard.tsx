"use client";

import Image from "next/image";

import { DemoBadge } from "@/components/ui";
import { type EventCardData } from "@/lib/events/map-event-card";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

interface BentoEventCardProps {
  event: EventCardData;
  variant: "large" | "small";
}

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

const typeBadgeStyles: Record<string, string> = {
  hiking: "bg-emerald-500 text-white",
  mtb: "bg-amber-500 text-white",
  road_bike: "bg-blue-500 text-white",
  running: "bg-orange-500 text-white",
  trail_run: "bg-yellow-800 text-white",
};

const typeGradientFallback: Record<string, string> = {
  hiking: "from-emerald-600 to-emerald-900",
  mtb: "from-amber-600 to-amber-900",
  road_bike: "from-blue-600 to-blue-900",
  running: "from-orange-600 to-orange-900",
  trail_run: "from-yellow-700 to-yellow-950",
};

export default function BentoEventCard({ event, variant }: BentoEventCardProps) {
  const formattedDate = formatEventDate(event.date, event.endDate, { short: true });
  const formattedPrice = event.price === 0 ? "Free" : `\u20B1${event.price.toLocaleString()}`;

  if (variant === "large") {
    return (
      <a
        href={`/events/${event.id}`}
        className="group relative block h-full overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl dark:shadow-gray-950/30"
      >
        {/* Image or gradient fallback */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            typeGradientFallback[event.type] ?? "from-gray-600 to-gray-900",
          )}
        >
          {event.cover_image_url && (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 92vw, (max-width: 1280px) 33vw, 400px"
              quality={60}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
        </div>

        {/* Type badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide uppercase backdrop-blur-sm",
              typeBadgeStyles[event.type] ?? "bg-gray-500/90 text-white",
            )}
          >
            {typeLabels[event.type] ?? event.type}
          </span>
        </div>

        {/* Featured / Demo badge — top right */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
          {event.is_featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-lime-400/90 text-gray-900 backdrop-blur-sm">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </span>
          )}
          {event.is_demo && <DemoBadge />}
        </div>

        {/* Bottom gradient overlay + info */}
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-5 pb-5 pt-20">
          <h3 className="font-heading text-xl font-bold text-white line-clamp-2 mb-2 lg:text-2xl">
            {event.title}
          </h3>

          {(event.club_name || event.organizer_name) && (
            <p className="text-sm text-gray-200 mb-1.5">
              by {event.club_name || event.organizer_name}
            </p>
          )}

          {event.avg_rating != null &&
            event.avg_rating > 0 &&
            event.review_count != null &&
            event.review_count > 0 && (
              <div className="flex items-center gap-1 text-sm mb-1.5">
                <span className="text-yellow-400">&#9733;</span>
                <span className="font-medium text-white">{event.avg_rating.toFixed(1)}</span>
                <span className="text-gray-300">({event.review_count})</span>
              </div>
            )}

          <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
            <svg
              className="h-4 w-4 shrink-0"
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
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
            <svg
              className="h-4 w-4 shrink-0"
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
            <span className="truncate">{event.location}</span>
          </div>

          <span className="inline-block rounded-lg bg-white/20 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
            {formattedPrice}
          </span>
        </div>
      </a>
    );
  }

  // Small variant
  return (
    <a
      href={`/events/${event.id}`}
      className="group relative block overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl dark:shadow-gray-950/30"
    >
      {/* Image or gradient fallback */}
      <div
        className={cn(
          "relative aspect-[16/10] bg-gradient-to-br",
          typeGradientFallback[event.type] ?? "from-gray-600 to-gray-900",
        )}
      >
        {event.cover_image_url && (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 80vw, (max-width: 1280px) 22vw, 280px"
            quality={60}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Type badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase backdrop-blur-sm",
              typeBadgeStyles[event.type] ?? "bg-gray-500/90 text-white",
            )}
          >
            {typeLabels[event.type] ?? event.type}
          </span>
        </div>

        {event.is_demo && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <DemoBadge />
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-3 pt-8">
          <h3 className="font-heading text-sm font-bold text-white line-clamp-2 mb-1">
            {event.title}
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-300 truncate">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">{formattedDate}</span>
            </div>
            <span className="shrink-0 text-xs font-bold text-white">{formattedPrice}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400 truncate">{event.location}</p>
        </div>
      </div>
    </a>
  );
}
