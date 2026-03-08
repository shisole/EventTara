import Image from "next/image";

import ClubRoleBadge from "@/components/clubs/ClubRoleBadge";
import JoinClubButton from "@/components/clubs/JoinClubButton";
import { type ClubRole } from "@/lib/clubs/types";
import { cn } from "@/lib/utils";

interface ClubProfileHeaderProps {
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  activity_types: string[];
  visibility: "public" | "private";
  location: string | null;
  member_count: number;
  event_count: number;
  currentUserId: string | null;
  currentMembership: { role: ClubRole; userId: string } | null;
}

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

const typeBadgeColors: Record<string, string> = {
  hiking: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  mtb: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  road_bike: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  running: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  trail_run: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
};

const logoColors: string[] = [
  "bg-teal-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-lime-500",
  "bg-forest-500",
];

function getLogoColor(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (char.codePointAt(0) ?? 0) + ((hash << 5) - hash);
  }
  return logoColors[Math.abs(hash) % logoColors.length];
}

export default function ClubProfileHeader({
  name,
  slug,
  description,
  logo_url,
  cover_url,
  activity_types,
  visibility,
  location,
  member_count,
  event_count,
  currentUserId,
  currentMembership,
}: ClubProfileHeaderProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden">
      {/* Cover image */}
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-teal-400 to-forest-500 dark:from-teal-700 dark:to-forest-800">
        {cover_url && (
          <Image
            src={cover_url}
            alt={`${name} cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1100px"
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Content below cover */}
      <div className="px-5 pb-6 sm:px-8">
        {/* Logo + Name row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
          {/* Logo */}
          <div className="shrink-0">
            {logo_url ? (
              <Image
                src={logo_url}
                alt={name}
                width={96}
                height={96}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-900 shadow-md"
              />
            ) : (
              <div
                className={cn(
                  "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl sm:text-4xl border-4 border-white dark:border-gray-900 shadow-md",
                  getLogoColor(name),
                )}
              >
                {initial}
              </div>
            )}
          </div>

          {/* Name + Join button */}
          <div className="flex-1 min-w-0 sm:pb-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold truncate">{name}</h1>
                  {currentMembership && <ClubRoleBadge role={currentMembership.role} />}
                </div>
              </div>
              <div className="shrink-0">
                <JoinClubButton
                  clubSlug={slug}
                  visibility={visibility}
                  initialMembership={currentMembership}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta info row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
          {/* Location */}
          {location && (
            <div className="flex items-center gap-1.5">
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
              <span>{location}</span>
            </div>
          )}

          {/* Members */}
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
            </svg>
            <span>
              {member_count} {member_count === 1 ? "member" : "members"}
            </span>
          </div>

          {/* Events */}
          <div className="flex items-center gap-1.5">
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
            <span>
              {event_count} {event_count === 1 ? "event" : "events"}
            </span>
          </div>

          {/* Visibility */}
          {visibility === "private" && (
            <div className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Private</span>
            </div>
          )}
        </div>

        {/* Activity type badges */}
        {activity_types.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activity_types.map((type) => (
              <span
                key={type}
                className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                  typeBadgeColors[type] ??
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                )}
              >
                {typeLabels[type] ?? type}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
