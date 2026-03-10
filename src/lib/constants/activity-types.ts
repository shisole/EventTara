/**
 * Canonical source for activity type constants.
 * All activity type labels, colors, and options should be imported from here.
 */

export type ActivityType = "hiking" | "mtb" | "road_bike" | "running" | "trail_run";

export const ACTIVITY_TYPES: readonly ActivityType[] = [
  "hiking",
  "mtb",
  "road_bike",
  "running",
  "trail_run",
] as const;

/** Full display labels (e.g. "Mountain Biking") */
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

/** Short labels for compact displays (e.g. "MTB", "Road Bike") */
export const ACTIVITY_TYPE_SHORT_LABELS: Record<ActivityType, string> = {
  hiking: "Hiking",
  mtb: "MTB",
  road_bike: "Road Bike",
  running: "Running",
  trail_run: "Trail Run",
};

/** Plural labels for stats displays (e.g. "MTB Rides", "Hikes") */
export const ACTIVITY_TYPE_PLURAL_LABELS: Record<ActivityType, string> = {
  hiking: "Hikes",
  mtb: "MTB Rides",
  road_bike: "Road Rides",
  running: "Runs",
  trail_run: "Trail Runs",
};

/** Options array for forms — includes key, label, and dot color */
export const ACTIVITY_TYPE_OPTIONS: { key: ActivityType; label: string; color: string }[] = [
  { key: "hiking", label: "Hiking", color: "bg-emerald-500" },
  { key: "mtb", label: "Mountain Biking", color: "bg-amber-500" },
  { key: "road_bike", label: "Road Biking", color: "bg-blue-500" },
  { key: "running", label: "Running", color: "bg-orange-500" },
  { key: "trail_run", label: "Trail Running", color: "bg-yellow-700" },
];

/** Solid badge colors (white text on colored bg) — used on event cards */
export const ACTIVITY_TYPE_SOLID_COLORS: Record<ActivityType, string> = {
  hiking: "bg-emerald-500 text-white",
  mtb: "bg-amber-500 text-white",
  road_bike: "bg-blue-500 text-white",
  running: "bg-orange-500 text-white",
  trail_run: "bg-yellow-800 text-white",
};

/** Light badge colors (colored text on light bg) — used on club cards */
export const ACTIVITY_TYPE_BADGE_COLORS: Record<ActivityType, string> = {
  hiking: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  mtb: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  road_bike: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  running: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  trail_run: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
};

/** Stats badge colors — used on profile stats */
export const ACTIVITY_TYPE_STATS_COLORS: Record<ActivityType, string> = {
  hiking: "bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-300",
  mtb: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
  road_bike: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  running: "bg-golden-100 text-golden-700 dark:bg-golden-900/40 dark:text-golden-300",
  trail_run: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

/** Gradient fallback colors — used on bento event cards when no image */
export const ACTIVITY_TYPE_GRADIENT_COLORS: Record<ActivityType, string> = {
  hiking: "from-emerald-600 to-emerald-900",
  mtb: "from-amber-600 to-amber-900",
  road_bike: "from-blue-600 to-blue-900",
  running: "from-orange-600 to-orange-900",
  trail_run: "from-yellow-700 to-yellow-950",
};

/** Activity types that support distance tracking */
export const DISTANCE_ACTIVITY_TYPES: ReadonlySet<string> = new Set([
  "running",
  "trail_run",
  "road_bike",
]);

// ── Typed lookup helpers (safe for use in components without `as` casts) ──

function isActivityType(type: string): type is ActivityType {
  return type in ACTIVITY_TYPE_LABELS;
}

export function getActivityLabel(type: string, fallback?: string): string {
  return isActivityType(type) ? ACTIVITY_TYPE_LABELS[type] : (fallback ?? type);
}

export function getActivityShortLabel(type: string, fallback?: string): string {
  return isActivityType(type) ? ACTIVITY_TYPE_SHORT_LABELS[type] : (fallback ?? type);
}

export function getActivityPluralLabel(type: string, fallback?: string): string {
  return isActivityType(type) ? ACTIVITY_TYPE_PLURAL_LABELS[type] : (fallback ?? type);
}

export function getActivitySolidColor(type: string, fallback = "bg-gray-500 text-white"): string {
  return isActivityType(type) ? ACTIVITY_TYPE_SOLID_COLORS[type] : fallback;
}

export function getActivityBadgeColor(
  type: string,
  fallback = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
): string {
  return isActivityType(type) ? ACTIVITY_TYPE_BADGE_COLORS[type] : fallback;
}

export function getActivityStatsColor(
  type: string,
  fallback = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
): string {
  return isActivityType(type) ? ACTIVITY_TYPE_STATS_COLORS[type] : fallback;
}

export function getActivityGradientColor(
  type: string,
  fallback = "from-gray-600 to-gray-900",
): string {
  return isActivityType(type) ? ACTIVITY_TYPE_GRADIENT_COLORS[type] : fallback;
}
