/** Row shape from the `activity_types` table. */
export interface ActivityTypeRow {
  id: string;
  slug: string;
  label: string;
  short_label: string;
  plural_label: string;
  icon: string;
  color_preset: string;
  supports_distance: boolean;
  category: ActivityTypeCategory;
  sort_order: number;
  enabled: boolean;
  created_at: string;
}

export type ActivityTypeCategory = "outdoor" | "indoor" | "fitness";

export const ACTIVITY_TYPE_CATEGORIES: readonly ActivityTypeCategory[] = [
  "outdoor",
  "indoor",
  "fitness",
] as const;
