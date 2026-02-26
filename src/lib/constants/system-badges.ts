import type { BadgeCategory, BadgeRarity } from "./badge-rarity";

export interface SystemBadge {
  criteriaKey: string;
  title: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  imageUrl: string;
}

/**
 * All 11 system badges that are automatically awarded on check-in.
 * These are seeded into the `badges` table with `type = 'system'`
 * and evaluated by the badge engine after every check-in.
 */
export const SYSTEM_BADGES: SystemBadge[] = [
  // First activity per type
  {
    criteriaKey: "first_hike",
    title: "First Hike",
    description: "Checked in to your first hiking event",
    category: "adventure",
    rarity: "common",
    imageUrl: "🥾",
  },
  {
    criteriaKey: "first_run",
    title: "First Run",
    description: "Checked in to your first running event",
    category: "distance",
    rarity: "common",
    imageUrl: "🏃",
  },
  {
    criteriaKey: "first_road_ride",
    title: "First Road Ride",
    description: "Checked in to your first road biking event",
    category: "distance",
    rarity: "common",
    imageUrl: "🚴",
  },
  {
    criteriaKey: "first_mtb",
    title: "First MTB Ride",
    description: "Checked in to your first mountain biking event",
    category: "distance",
    rarity: "common",
    imageUrl: "🚵",
  },
  {
    criteriaKey: "first_trail_run",
    title: "First Trail Run",
    description: "Checked in to your first trail running event",
    category: "adventure",
    rarity: "common",
    imageUrl: "🌲",
  },
  // All-rounder
  {
    criteriaKey: "all_rounder",
    title: "All-Rounder",
    description: "Checked in to at least one event of every activity type",
    category: "special",
    rarity: "epic",
    imageUrl: "🌟",
  },
  // Volume milestones
  {
    criteriaKey: "events_5",
    title: "5 Events",
    description: "Checked in to 5 events",
    category: "special",
    rarity: "common",
    imageUrl: "🏅",
  },
  {
    criteriaKey: "events_10",
    title: "10 Events",
    description: "Checked in to 10 events",
    category: "special",
    rarity: "rare",
    imageUrl: "🎖️",
  },
  {
    criteriaKey: "events_25",
    title: "25 Events",
    description: "Checked in to 25 events",
    category: "special",
    rarity: "epic",
    imageUrl: "🏆",
  },
  {
    criteriaKey: "events_50",
    title: "50 Events",
    description: "Checked in to 50 events",
    category: "special",
    rarity: "legendary",
    imageUrl: "👑",
  },
  // Pioneer
  {
    criteriaKey: "pioneer",
    title: "EventTara Pioneer",
    description: "Among the first 100 users to check in on EventTara",
    category: "special",
    rarity: "legendary",
    imageUrl: "🚀",
  },
];

/** Set of all system badge criteria keys, for fast lookups. */
export const SYSTEM_BADGE_KEYS = new Set<string>(SYSTEM_BADGES.map((b) => b.criteriaKey));

/**
 * User-facing hints shown when a badge is locked on the achievements page.
 * Maps each `criteria_key` to a short actionable hint.
 */
export const SYSTEM_BADGE_CRITERIA_HINTS: Record<string, string> = {
  first_hike: "Check in to your first hiking event",
  first_run: "Check in to your first running event",
  first_road_ride: "Check in to your first road biking event",
  first_mtb: "Check in to your first mountain biking event",
  first_trail_run: "Check in to your first trail running event",
  all_rounder: "Check in to at least one event of every activity type",
  events_5: "Check in to 5 events total",
  events_10: "Check in to 10 events total",
  events_25: "Check in to 25 events total",
  events_50: "Check in to 50 events total",
  pioneer: "Be among the first 100 users to check in on EventTara",
};
