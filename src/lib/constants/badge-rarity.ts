export const RARITY_STYLES = {
  common: {
    ring: "ring-2 ring-gray-200 dark:ring-gray-700",
    glow: "",
    pill: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    label: "Common",
  },
  rare: {
    ring: "ring-2 ring-teal-400 dark:ring-teal-500",
    glow: "shadow-[0_0_12px_rgba(20,184,166,0.3)]",
    pill: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    label: "Rare",
  },
  epic: {
    ring: "ring-2 ring-purple-400 dark:ring-purple-500",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]",
    pill: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    label: "Epic",
  },
  legendary: {
    ring: "ring-2 ring-golden-400 dark:ring-golden-500",
    glow: "shadow-[0_0_16px_rgba(234,179,8,0.4)]",
    pill: "bg-golden-100 text-golden-700 dark:bg-golden-900/50 dark:text-golden-300",
    label: "Legendary",
  },
} as const;

export const CATEGORY_STYLES = {
  distance: {
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    label: "Distance",
  },
  adventure: {
    pill: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
    label: "Adventure",
  },
  location: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    label: "Location",
  },
  special: {
    pill: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    label: "Special",
  },
} as const;

export type BadgeCategory = keyof typeof CATEGORY_STYLES;
export type BadgeRarity = keyof typeof RARITY_STYLES;
