export type BorderTier = "common" | "rare" | "epic" | "legendary";

export type BorderSize = "sm" | "md" | "lg" | "xl";

export type CriteriaType =
  | "signup_date"
  | "event_count"
  | "event_type_count"
  | "all_activities"
  | "mountain_region"
  | "organizer_event_count";

export interface AvatarBorder {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tier: BorderTier;
  criteria_type: CriteriaType;
  criteria_value: Record<string, unknown>;
  border_color: string | null;
  sort_order: number;
}

export interface UserAvatarBorder {
  id: string;
  user_id: string;
  border_id: string;
  awarded_at: string;
  avatar_borders: AvatarBorder;
}

/** Default border colors by tier (used when border_color is null) */
export const TIER_COLORS: Record<BorderTier, string> = {
  common: "#22c55e",
  rare: "#6366f1",
  epic: "#ec4899",
  legendary: "#f59e0b",
};

/** Gradient definitions by tier */
export const TIER_GRADIENTS: Record<BorderTier, string> = {
  common: "none",
  rare: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
  epic: "linear-gradient(135deg, #ec4899, #8b5cf6, #6366f1)",
  legendary: "linear-gradient(135deg, #f59e0b, #ef4444, #ec4899, #8b5cf6, #6366f1)",
};

/** Ring thickness in pixels per avatar size */
export const RING_THICKNESS: Record<BorderSize, number> = {
  sm: 2,
  md: 3,
  lg: 3,
  xl: 4,
};

/** Animation class per tier */
export const TIER_ANIMATION: Record<BorderTier, string> = {
  common: "",
  rare: "",
  epic: "animate-border-pulse",
  legendary: "animate-shimmer",
};

/** Tier display labels */
export const TIER_LABELS: Record<BorderTier, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

/** Tier label colors (for badges/chips) */
export const TIER_LABEL_COLORS: Record<BorderTier, string> = {
  common: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30",
  rare: "text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30",
  epic: "text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30",
  legendary: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30",
};
