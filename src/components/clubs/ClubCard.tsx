import Image from "next/image";

import { NavLink } from "@/components/navigation/NavigationContext";
import { Card } from "@/components/ui";
import { getActivityBadgeColor, getActivityShortLabel } from "@/lib/constants/activity-types";
import { cn } from "@/lib/utils";

interface ClubCardProps {
  slug: string;
  name: string;
  logo_url: string | null;
  activity_types: string[];
  member_count: number;
  visibility: "public" | "private";
  description: string | null;
  is_demo?: boolean;
}

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

export default function ClubCard({
  slug,
  name,
  logo_url,
  activity_types,
  member_count,
  visibility,
  description,
}: ClubCardProps) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <NavLink href={`/clubs/${slug}`}>
      <Card className="overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 h-full">
        <div className="p-5 flex flex-col h-full">
          {/* Header: Logo + Name */}
          <div className="flex items-center gap-3 mb-3">
            {logo_url ? (
              <Image
                src={logo_url}
                alt={name}
                width={48}
                height={48}
                className="rounded-xl object-cover w-12 h-12 flex-shrink-0"
              />
            ) : (
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0",
                  getLogoColor(name),
                )}
              >
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-base truncate">{name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <svg
                  className="h-3.5 w-3.5 shrink-0"
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
            </div>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Footer: Activity badges + Visibility */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {activity_types.slice(0, 3).map((type) => (
                <span
                  key={type}
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    getActivityBadgeColor(type),
                  )}
                >
                  {getActivityShortLabel(type)}
                </span>
              ))}
              {activity_types.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  +{activity_types.length - 3}
                </span>
              )}
            </div>
            {visibility === "private" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                <svg
                  className="h-2.5 w-2.5"
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
                Private
              </span>
            )}
          </div>
        </div>
      </Card>
    </NavLink>
  );
}
