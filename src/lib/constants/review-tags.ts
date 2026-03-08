/** Preset tags for club reviews, inspired by Grab-style tag selectors. */

export interface ReviewTag {
  key: string;
  label: string;
  sentiment: "positive" | "negative";
}

export const REVIEW_TAGS: ReviewTag[] = [
  // Positive
  { key: "well_organized", label: "Well Organized", sentiment: "positive" },
  { key: "great_communication", label: "Great Communication", sentiment: "positive" },
  { key: "on_time", label: "On Time", sentiment: "positive" },
  { key: "safety_focused", label: "Safety Focused", sentiment: "positive" },
  { key: "friendly_staff", label: "Friendly Staff", sentiment: "positive" },
  { key: "value_for_money", label: "Value for Money", sentiment: "positive" },
  { key: "great_routes", label: "Great Routes", sentiment: "positive" },
  { key: "would_join_again", label: "Would Join Again", sentiment: "positive" },
  // Negative
  { key: "poorly_organized", label: "Poorly Organized", sentiment: "negative" },
  { key: "poor_communication", label: "Poor Communication", sentiment: "negative" },
  { key: "late_start", label: "Late Start", sentiment: "negative" },
  { key: "safety_concerns", label: "Safety Concerns", sentiment: "negative" },
  { key: "overpriced", label: "Overpriced", sentiment: "negative" },
  { key: "misleading_info", label: "Misleading Info", sentiment: "negative" },
];

/** Set of valid tag keys for server-side validation */
export const VALID_TAG_KEYS = new Set(REVIEW_TAGS.map((t) => t.key));

/** Max number of photos per review */
export const MAX_REVIEW_PHOTOS = 5;

/** Max review text length */
export const MAX_REVIEW_TEXT_LENGTH = 1000;
