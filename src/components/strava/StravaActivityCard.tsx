"use client";

import { cn } from "@/lib/utils";

/** Activity data shape returned by /api/strava/activities */
export interface StravaActivityData {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  summary_polyline: string | null;
}

interface StravaActivityCardProps {
  activity: StravaActivityData;
  /** If provided, the card becomes clickable and calls this on click */
  onSelect?: (activity: StravaActivityData) => void;
  /** Whether this card is in a loading/linking state */
  linking?: boolean;
}

/** Maps Strava activity type strings to short display labels and emoji-like SVG icons */
function getActivityIcon(type: string): { label: string; icon: string } {
  const normalized = type.toLowerCase();
  if (normalized.includes("ride") || normalized.includes("cycling")) {
    return {
      label: "Ride",
      icon: "M12 2a7 7 0 110 14 7 7 0 010-14zm0 2a5 5 0 100 10 5 5 0 000-10z",
    };
  }
  if (normalized.includes("hike")) {
    return {
      label: "Hike",
      icon: "M13.5 5.5a2 2 0 11-4 0 2 2 0 014 0zM9.8 8.2L7 22h2l2-7 2 3v4h2v-5.5l-2-3 .7-3.5A5.5 5.5 0 0018 12v-2a7.5 7.5 0 01-5-2l-1.5-1.5-1.7 1.7z",
    };
  }
  if (normalized.includes("trail")) {
    return {
      label: "Trail Run",
      icon: "M13.5 5.5a2 2 0 11-4 0 2 2 0 014 0zM9.8 8.2L7 22h2l2-7 2 3v4h2v-5.5l-2-3 .7-3.5A5.5 5.5 0 0018 12v-2a7.5 7.5 0 01-5-2l-1.5-1.5-1.7 1.7z",
    };
  }
  if (normalized.includes("run")) {
    return {
      label: "Run",
      icon: "M13.5 5.5a2 2 0 11-4 0 2 2 0 014 0zM9.8 8.2L7 22h2l2-7 2 3v4h2v-5.5l-2-3 .7-3.5A5.5 5.5 0 0018 12v-2a7.5 7.5 0 01-5-2l-1.5-1.5-1.7 1.7z",
    };
  }
  if (normalized.includes("swim")) {
    return {
      label: "Swim",
      icon: "M2 18c1.5 0 3-1 3-1s1.5 1 3 1 3-1 3-1 1.5 1 3 1 3-1 3-1 1.5 1 3 1M2 14c1.5 0 3-1 3-1s1.5 1 3 1 3-1 3-1 1.5 1 3 1 3-1 3-1 1.5 1 3 1M12 2a3 3 0 100 6 3 3 0 000-6z",
    };
  }
  // Default: generic activity
  return { label: type, icon: "M13 10V3L4 14h7v7l9-11h-7z" };
}

/** Format meters to km (e.g., 12345 -> "12.35 km") */
function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

/** Format seconds to Xh Ym (e.g., 3723 -> "1h 2m") */
function formatMovingTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${String(hours)}h ${String(minutes)}m`;
  }
  return `${String(minutes)}m`;
}

/** Format a date string to a short display date */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StravaActivityCard({
  activity,
  onSelect,
  linking = false,
}: StravaActivityCardProps) {
  const { label, icon } = getActivityIcon(activity.sport_type || activity.type);
  const isClickable = !!onSelect && !linking;

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={isClickable ? () => onSelect(activity) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(activity);
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors",
        isClickable &&
          "cursor-pointer hover:border-[#FC4C02]/50 hover:bg-orange-50/50 dark:hover:bg-orange-950/10",
        linking && "opacity-60 pointer-events-none",
      )}
    >
      {/* Header: icon + name + date */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#FC4C02]/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-[#FC4C02]"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d={icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">{activity.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {label} &middot; {formatDate(activity.start_date_local)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Distance</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatDistance(activity.distance)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Time</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatMovingTime(activity.moving_time)}
          </p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Elevation</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {Math.round(activity.total_elevation_gain)}m
          </p>
        </div>
      </div>

      {/* Linking spinner */}
      {linking && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#FC4C02]">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M12 2a10 10 0 0110 10h-3a7 7 0 00-7-7V2z"
            />
          </svg>
          Linking activity...
        </div>
      )}
    </div>
  );
}
