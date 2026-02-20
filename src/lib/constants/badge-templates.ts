export interface BadgeTemplate {
  id: string;
  title: string;
  description: string;
  category: 'distance' | 'adventure' | 'location' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  suggestedImage: string | null;
}

export const BADGE_TEMPLATES: BadgeTemplate[] = [
  // Distance — Running
  {
    id: "5km-finisher",
    title: "5KM Finisher",
    description: "Completed a 5KM run. Every journey starts with the first stride!",
    category: "distance",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "10km-finisher",
    title: "10KM Finisher",
    description: "Pushed past 10 kilometers. Double digits, double respect.",
    category: "distance",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "half-marathoner",
    title: "Half Marathoner",
    description: "Conquered the 21KM half marathon distance. Halfway to legend.",
    category: "distance",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "marathoner",
    title: "Marathoner",
    description: "Finished a full 42.195KM marathon. You are relentless.",
    category: "distance",
    rarity: "epic",
    suggestedImage: null,
  },
  {
    id: "ultra-runner",
    title: "Ultra Runner",
    description: "Went beyond the marathon. 50KM+ of pure determination.",
    category: "distance",
    rarity: "legendary",
    suggestedImage: null,
  },
  // Distance — Cycling
  {
    id: "25km-rider",
    title: "25KM Rider",
    description: "Completed a 25KM ride. Wheels spinning, spirits soaring.",
    category: "distance",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "50km-rider",
    title: "50KM Rider",
    description: "Rode 50 kilometers. The road rewards those who keep pedaling.",
    category: "distance",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "century-rider",
    title: "Century Rider",
    description: "Completed a 100KM century ride. Your legs are legendary.",
    category: "distance",
    rarity: "epic",
    suggestedImage: null,
  },
  // Adventure
  {
    id: "first-summit",
    title: "First Summit",
    description: "Reached your first mountain summit. The view from the top changes everything.",
    category: "adventure",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "3-summits",
    title: "3 Summits",
    description: "Conquered three different peaks. The mountains are calling and you keep answering.",
    category: "adventure",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "mountain-conqueror",
    title: "Mountain Conqueror",
    description: "Summited 10 or more peaks. The mountains bow to your determination.",
    category: "adventure",
    rarity: "epic",
    suggestedImage: null,
  },
  {
    id: "trail-blazer",
    title: "Trail Blazer",
    description: "Completed a trail run event. You carve your own path.",
    category: "adventure",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "peak-seeker",
    title: "Peak Seeker",
    description: "Joined 5 hiking events. Always chasing the next horizon.",
    category: "adventure",
    rarity: "rare",
    suggestedImage: null,
  },
  // Location — Philippines
  {
    id: "cebu-trail-seeker",
    title: "Cebu Trail Seeker",
    description: "Joined an adventure event in Cebu. The Queen City of the South awaits.",
    category: "location",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "luzon-explorer",
    title: "Luzon Explorer",
    description: "Adventured across Luzon. From the mountains of Cordillera to the trails of Batangas.",
    category: "location",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "visayas-voyager",
    title: "Visayas Voyager",
    description: "Explored the Visayas islands. Sun, sea, and summits.",
    category: "location",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "mindanao-pathfinder",
    title: "Mindanao Pathfinder",
    description: "Blazed trails in Mindanao. Home of Mt. Apo and untamed adventures.",
    category: "location",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "philippine-adventurer",
    title: "Philippine Adventurer",
    description: "Joined events across 3 major island groups. The whole archipelago is your playground.",
    category: "location",
    rarity: "epic",
    suggestedImage: null,
  },
  // Special
  {
    id: "event-finisher",
    title: "Event Finisher",
    description: "Completed an event from start to finish. You showed up and you conquered.",
    category: "special",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "eventtara-pioneer",
    title: "EventTara Pioneer",
    description: "One of the earliest adventurers on EventTara. A true trailblazer.",
    category: "special",
    rarity: "legendary",
    suggestedImage: null,
  },
];

export const BADGE_CATEGORIES = [
  { value: "distance" as const, label: "Distance", description: "Running & cycling milestones" },
  { value: "adventure" as const, label: "Adventure", description: "Hiking & trail achievements" },
  { value: "location" as const, label: "Location", description: "Region-specific badges" },
  { value: "special" as const, label: "Special", description: "Event-specific & limited edition" },
];

export const BADGE_RARITIES = [
  { value: "common" as const, label: "Common", color: "text-gray-500" },
  { value: "rare" as const, label: "Rare", color: "text-teal-500" },
  { value: "epic" as const, label: "Epic", color: "text-purple-500" },
  { value: "legendary" as const, label: "Legendary", color: "text-golden-500" },
];
