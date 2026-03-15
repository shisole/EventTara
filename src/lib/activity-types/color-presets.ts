/**
 * Color presets for activity types.
 *
 * The DB stores a preset key (e.g. "emerald"). This module maps keys to
 * Tailwind class strings that are written as literals so the CSS scanner
 * picks them up — solving the dynamic class purging problem.
 */

export interface ColorPreset {
  /** Small colored dot (e.g. filter pills) */
  dot: string;
  /** Solid badge — white text on colored bg (event cards) */
  solid: string;
  /** Light badge — colored text on light bg (club cards) */
  badge: string;
  /** Stats badge (profile stats) */
  stats: string;
  /** Gradient fallback (bento cards without image) */
  gradient: string;
}

export const COLOR_PRESETS: Record<string, ColorPreset> = {
  emerald: {
    dot: "bg-emerald-500",
    solid: "bg-emerald-500 text-white",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    stats: "bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-300",
    gradient: "from-emerald-600 to-emerald-900",
  },
  amber: {
    dot: "bg-amber-500",
    solid: "bg-amber-500 text-white",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    stats: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
    gradient: "from-amber-600 to-amber-900",
  },
  blue: {
    dot: "bg-blue-500",
    solid: "bg-blue-500 text-white",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    stats: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    gradient: "from-blue-600 to-blue-900",
  },
  orange: {
    dot: "bg-orange-500",
    solid: "bg-orange-500 text-white",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    stats: "bg-golden-100 text-golden-700 dark:bg-golden-900/40 dark:text-golden-300",
    gradient: "from-orange-600 to-orange-900",
  },
  yellow: {
    dot: "bg-yellow-700",
    solid: "bg-yellow-800 text-white",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    stats: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    gradient: "from-yellow-700 to-yellow-950",
  },
  red: {
    dot: "bg-red-500",
    solid: "bg-red-500 text-white",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    stats: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    gradient: "from-red-600 to-red-900",
  },
  purple: {
    dot: "bg-purple-500",
    solid: "bg-purple-500 text-white",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    stats: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    gradient: "from-purple-600 to-purple-900",
  },
  pink: {
    dot: "bg-pink-500",
    solid: "bg-pink-500 text-white",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    stats: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    gradient: "from-pink-600 to-pink-900",
  },
  teal: {
    dot: "bg-teal-500",
    solid: "bg-teal-500 text-white",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    stats: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    gradient: "from-teal-600 to-teal-900",
  },
  lime: {
    dot: "bg-lime-500",
    solid: "bg-lime-600 text-white",
    badge: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
    stats: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300",
    gradient: "from-lime-600 to-lime-900",
  },
  gray: {
    dot: "bg-gray-500",
    solid: "bg-gray-500 text-white",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    stats: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    gradient: "from-gray-600 to-gray-900",
  },
} as const;

/** All valid preset keys. */
export const COLOR_PRESET_KEYS = Object.keys(COLOR_PRESETS);

/** Look up a preset by key, falling back to gray. */
export function getColorPreset(key: string): ColorPreset {
  return COLOR_PRESETS[key] ?? COLOR_PRESETS.gray;
}
