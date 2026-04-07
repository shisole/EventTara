import Image from "next/image";

import { NavLink } from "@/components/navigation/NavigationContext";
import { DemoBadge } from "@/components/ui";
import { getActivityLabel, getActivitySolidColor } from "@/lib/constants/activity-types";
import { cn } from "@/lib/utils";
import { formatEventDate } from "@/lib/utils/format-date";

import ClubLink from "./ClubLink";

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
  club_name?: string;
  club_slug?: string;
  club_logo_url?: string | null;
  distance?: number;
  avg_rating?: number;
  review_count?: number;
  difficulty_level?: number | null;
  race_distances?: number[];
  hasRoute?: boolean;
  compact?: boolean;
  is_demo?: boolean;
  members_only?: boolean;
}

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
  club_name,
  club_slug,
  club_logo_url,
  distance,
  avg_rating,
  review_count,
  difficulty_level,
  race_distances,
  hasRoute,
  compact,
  is_demo,
  members_only,
}: EventCardProps) {
  const spotsLeft = max_participants - booking_count;
  const formattedDate = formatEventDate(date, endDate, { short: true });
  const formattedPrice = price === 0 ? "Free" : `\u20B1${price.toLocaleString()}`;
  const hasRating =
    avg_rating != null && avg_rating > 0 && review_count != null && review_count > 0;

  return (
    <NavLink href={`/events/${id}`} className="group block">
      <div className={cn(status === "past" && "opacity-60")}>
        {/* Image */}
        <div
          className={cn(
            "relative aspect-square overflow-hidden rounded-xl",
            "bg-gradient-to-br from-lime-100 to-forest-100 dark:from-lime-900 dark:to-forest-900",
          )}
        >
          {cover_image_url && (
            <Image
              src={cover_image_url}
              alt={title}
              fill
              sizes={
                compact
                  ? "(max-width: 640px) 46vw, (max-width: 1024px) 45vw, 300px"
                  : "(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 300px"
              }
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}

          {/* Top-right badges */}
          {(is_demo || members_only) && (
            <div className="absolute top-2.5 right-2.5 z-10 flex flex-col items-end gap-1.5">
              {members_only && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/90 text-white backdrop-blur-sm shadow-sm">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Members Only
                </span>
              )}
              {is_demo && <DemoBadge />}
            </div>
          )}

          {/* Status badge — top left */}
          {status === "happening_now" && (
            <div className="absolute top-2.5 left-2.5 z-10">
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
            <div className="absolute top-2.5 left-2.5 z-10">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lime-500 text-gray-900">
                Upcoming
              </span>
            </div>
          )}

          {/* Pills — bottom left */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm",
                getActivitySolidColor(type),
              )}
            >
              {getActivityLabel(type)}
            </span>
            {difficulty_level != null && (
              <span
                className={cn(
                  "hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm",
                  solidDifficultyBadge(difficulty_level),
                )}
              >
                {difficulty_level}/9
              </span>
            )}
            {race_distances &&
              race_distances.length > 0 &&
              (() => {
                const maxShow = compact ? 2 : 3;
                const visible = race_distances.slice(0, maxShow);
                const overflow = race_distances.length - maxShow;
                return (
                  <>
                    {visible.map((km) => (
                      <span
                        key={km}
                        className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white shadow-sm"
                      >
                        {km} km
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/70 text-white shadow-sm">
                        +{overflow}
                      </span>
                    )}
                  </>
                );
              })()}
            {hasRoute && (
              <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FC4C02] text-white shadow-sm">
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

        {/* Content */}
        <div className={cn("pt-2.5", compact ? "space-y-0.5" : "space-y-1")}>
          {/* Title + Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "font-heading font-semibold leading-snug line-clamp-1",
                compact ? "text-sm" : "text-[15px]",
              )}
            >
              {title}
            </h3>
            {hasRating && (
              <span
                className={cn(
                  "shrink-0 flex items-center gap-0.5 font-medium text-gray-800 dark:text-gray-200",
                  compact ? "text-xs" : "text-sm",
                )}
              >
                <span className="text-yellow-400">&#9733;</span>
                {avg_rating?.toFixed(1)}
              </span>
            )}
          </div>

          {/* Club */}
          {club_name && club_slug ? (
            <ClubLink clubSlug={club_slug} clubName={club_name} clubLogoUrl={club_logo_url} />
          ) : club_name ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{club_name}</p>
          ) : null}

          {/* Date + Location */}
          <p
            className={cn(
              "text-gray-500 dark:text-gray-400 truncate",
              compact ? "text-xs" : "text-sm",
            )}
          >
            <span>{formattedDate}</span>
            <span className={cn("mx-1.5", compact && "hidden sm:inline")}>&middot;</span>
            <span className={cn(compact && "hidden sm:inline")}>{location}</span>
            {distance != null && (
              <span className="hidden sm:inline text-teal-600 dark:text-teal-400 ml-1">
                ({distance < 1 ? "<1km" : `~${Math.round(distance)}km`})
              </span>
            )}
          </p>

          {/* Price + Spots */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "font-semibold text-gray-900 dark:text-gray-100",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {formattedPrice}
            </span>
            <span
              className={cn(
                "text-xs",
                spotsLeft <= 0
                  ? "font-medium text-red-500"
                  : spotsLeft <= 5
                    ? "font-medium text-red-500"
                    : "text-gray-400 dark:text-gray-500",
              )}
            >
              {spotsLeft <= 0 ? "Fully Booked" : `${spotsLeft} spots left`}
            </span>
          </div>
        </div>
      </div>
    </NavLink>
  );
}
