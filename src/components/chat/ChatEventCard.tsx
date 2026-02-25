import Image from "next/image";
import Link from "next/link";

import { UIBadge } from "@/components/ui";
import { formatEventDate } from "@/lib/utils/format-date";

import type { MiniEvent } from "./types";

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

export default function ChatEventCard({
  id,
  title,
  type,
  date,
  location,
  price,
  cover_image_url,
}: MiniEvent) {
  return (
    <Link
      href={`/events/${id}`}
      className="flex gap-3 rounded-lg border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
        {cover_image_url ? (
          <Image src={cover_image_url} alt={title} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            No img
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5">
          <UIBadge variant={type} className="text-[10px] px-1.5 py-0">
            {typeLabels[type] || type}
          </UIBadge>
        </div>
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</p>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {formatEventDate(date, null, { short: true })} &middot; {location}
        </p>
        <p className="text-xs font-medium text-teal-600 dark:text-teal-400">
          {price === 0 ? "Free" : `₱${price.toLocaleString()}`}
        </p>
      </div>
    </Link>
  );
}
