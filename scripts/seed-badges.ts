/**
 * EventTara - Badge Seed Script
 *
 * Seeds event badges, system badges, and badge awards.
 * Assumes events and users already exist in the database.
 *
 * Usage: pnpm seed:badges --yes
 */

import { loadEnvConfig } from "@next/env";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvConfig(projectRoot);

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Environment & Safety Checks
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Make sure your .env.local file contains both variables.",
  );
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error(
    `\n  WARNING: You are about to SEED BADGES in the database at:\n  ${SUPABASE_URL}\n\n` +
      "  This will create badges and award them to users.\n" +
      "  Run with --yes to confirm:\n\n" +
      "    pnpm seed:badges --yes\n",
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(emoji: string, message: string) {
  console.log(`${emoji}  ${message}`);
}

// ---------------------------------------------------------------------------
// Event Badge Definitions
// ---------------------------------------------------------------------------

interface BadgeDef {
  eventTitle: string;
  title: string;
  description: string;
  image_url: string;
  category: "distance" | "adventure" | "location" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
}

const BADGE_DEFS: BadgeDef[] = [
  {
    eventTitle: "Mt. Madja-as Summit Trek",
    title: "Madja-as Summiteer",
    description:
      "Conquered the highest peak on Panay Island — Mt. Madja-as at 2,117m. You earned this above the clouds.",
    image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "epic",
  },
  {
    eventTitle: "Bucari Pine Forest Trail Run",
    title: "Bucari Trailblazer",
    description:
      "Ran through the highland pine forests of Bucari at 900m elevation. A unique Visayan trail experience!",
    image_url: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "rare",
  },
  {
    eventTitle: "Iloilo Esplanade Night Run 10K",
    title: "Esplanade Night Runner",
    description:
      "Finished the Iloilo Esplanade Night Run 10K under the city lights. You owned the riverside!",
    image_url: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=200&h=200&fit=crop",
    category: "distance",
    rarity: "common",
  },
  {
    eventTitle: "Iloilo-Antique Coastal Road Ride",
    title: "Coastal Road Warrior",
    description:
      "Completed the 120km coastal ride from Iloilo to Antique. Your legs earned this one!",
    image_url: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=200&h=200&fit=crop",
    category: "distance",
    rarity: "rare",
  },
  {
    eventTitle: "Tubungan Highlands MTB",
    title: "Tubungan MTB Crusher",
    description:
      "Conquered the highland trails and river crossings of Tubungan on two wheels. Mountain biker certified!",
    image_url: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "epic",
  },
  {
    eventTitle: "Mt. Napulak Sunrise Hike",
    title: "Napulak Sunrise Chaser",
    description:
      "Caught the sunrise from Mt. Napulak's summit. The early morning trek was worth every step!",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "rare",
  },
  {
    eventTitle: "Igbaras Mountain Day Hike",
    title: "Igbaras Hiker",
    description:
      "Explored the lush mountains of Igbaras, the hiking capital of Iloilo. A true Panay adventurer!",
    image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "common",
  },
  {
    eventTitle: "Nadsadan Falls Day Hike",
    title: "Nadsadan Falls Explorer",
    description:
      "Trekked through bamboo groves to reach the stunning Nadsadan Falls. You earned a river dip!",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "common",
  },
  {
    eventTitle: "Miag-ao Heritage Trail Run",
    title: "Miag-ao Heritage Runner",
    description:
      "Ran 21K from the UNESCO Heritage Miag-ao Church through rice paddies and coastal paths. History meets endurance!",
    image_url: "https://images.unsplash.com/photo-1510227272981-87123e259b17?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "rare",
  },
  {
    eventTitle: "Mt. Malinao Summit Hike",
    title: "Mt. Malinao Summiteer",
    description:
      "Stood on the sacred summit of Mt. Malinao in Aklan with views of Boracay and the Sibuyan Sea. Legendary!",
    image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "legendary",
  },
  {
    eventTitle: "Panay Circumferential Road Ride",
    title: "Panay Circuit Finisher",
    description:
      "Pedaled 300km around the entire island of Panay in 2 days. Your legs are legends.",
    image_url: "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=200&h=200&fit=crop",
    category: "distance",
    rarity: "epic",
  },
  {
    eventTitle: "Malalison Island Trail Ride",
    title: "Malalison Island Rider",
    description:
      "Rode through coastal cliffs and white sand coves on the remote Malalison Island. Island MTB at its finest!",
    image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
    category: "location",
    rarity: "rare",
  },
  {
    eventTitle: "Iloilo City Fun Run 5K",
    title: "Iloilo Fun Runner",
    description:
      "Crossed the finish line at the Iloilo City 5K. Every adventure starts with the first stride — and a bowl of La Paz batchoy!",
    image_url: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=200&h=200&fit=crop",
    category: "distance",
    rarity: "common",
  },
];

// ---------------------------------------------------------------------------
// Mountain Location Badge Definitions
// ---------------------------------------------------------------------------

interface MountainBadgeDef {
  mountain: string;
  title: string;
  description: string;
  image_url: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  eventTitles: string[];
}

const MOUNTAIN_BADGE_DEFS: MountainBadgeDef[] = [
  {
    mountain: "Mt. Madja-as",
    title: "Mt. Madja-as",
    description:
      "Stood atop the highest peak on Panay Island at 2,117m. The clouds were below you.",
    image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
    rarity: "legendary",
    eventTitles: ["Mt. Madja-as Summit Trek"],
  },
  {
    mountain: "Mt. Nangtud",
    title: "Mt. Nangtud",
    description:
      "Reached the summit of Panay's second highest peak at 2,073m in the remote mountains of Antique.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    rarity: "legendary",
    eventTitles: ["Mt. Nangtud Expedition"],
  },
  {
    mountain: "Mt. Malinao",
    title: "Mt. Malinao",
    description:
      "Summited the sacred mountain of the Ati people in Aklan at 1,610m with views of Boracay.",
    image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
    rarity: "epic",
    eventTitles: ["Mt. Malinao Summit Hike"],
  },
  {
    mountain: "Mt. Napulak",
    title: "Mt. Napulak",
    description:
      "Conquered Mt. Napulak in Igbaras — one of Iloilo's most accessible and rewarding peaks.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    rarity: "common",
    eventTitles: ["Mt. Napulak Sunrise Hike"],
  },
  {
    mountain: "Mt. Opao",
    title: "Mt. Opao",
    description:
      "Hiked Mt. Opao in Igbaras with panoramic views of the Iloilo coastline from the summit.",
    image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
    rarity: "common",
    eventTitles: ["Mt. Opao Day Hike", "Mt. Opao Sunrise Trek", "Mt. Opao Trail Run 8K"],
  },
  {
    mountain: "Mt. Lingguhob",
    title: "Mt. Lingguhob",
    description:
      "Reached the summit of Mt. Lingguhob in Leon — sweeping views of the Panay highlands await.",
    image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
    rarity: "rare",
    eventTitles: [
      "Mt. Lingguhob Summit Hike",
      "Mt. Lingguhob Ridge Trail",
      "Mt. Lingguhob Night Hike",
      "Mt. Lingguhob Waterfall Loop",
      "Mt. Lingguhob Sunrise Assault",
      "Mt. Lingguhob Trail Cleanup Hike",
      "Mt. Lingguhob Full Moon Hike",
      "Mt. Lingguhob Beginner Day Hike",
    ],
  },
  {
    mountain: "Mt. Baloy",
    title: "Mt. Baloy",
    description:
      "Traversed the exposed ridgeline of Mt. Baloy in San Joaquin with views of the Panay Gulf.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    rarity: "rare",
    eventTitles: ["Mt. Baloy Ridge Traverse", "Baloy Falls Adventure Hike"],
  },
  {
    mountain: "Mt. Igatmon",
    title: "Mt. Igatmon",
    description:
      "Conquered Mt. Igatmon in Barbaza, Antique — remote trails through old-growth forest to a 900m summit.",
    image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
    rarity: "epic",
    eventTitles: ["Mt. Igatmon Expedition", "Mt. Igatmon Summit Day Hike", "Mt. Igatmon Traverse"],
  },
  {
    mountain: "Mt. Taripis",
    title: "Mt. Taripis",
    description:
      "Summited Mt. Taripis in Igbaras at 1,320m — one of the Igbaras mountain group's crown jewels.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    rarity: "rare",
    eventTitles: [],
  },
  {
    mountain: "Bato Igmatindog",
    title: "Bato Igmatindog",
    description:
      "Conquered the standing rock of Igbaras — Bato Igmatindog at 1,000m, a dramatic rock formation summit.",
    image_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
    rarity: "rare",
    eventTitles: [],
  },
  {
    mountain: "Mt. Loboc",
    title: "Mt. Loboc",
    description:
      "Reached the summit of Mt. Loboc in Igbaras at 1,000m — dense forest trails and rewarding ridgeline views.",
    image_url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
    rarity: "rare",
    eventTitles: [],
  },
  {
    mountain: "Mt. Pulang Lupa",
    title: "Mt. Pulang Lupa",
    description:
      "Stood on the red earth summit of Mt. Pulang Lupa in Igbaras at 1,260m — named for its distinctive reddish soil.",
    image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    rarity: "rare",
    eventTitles: [],
  },
];

// ---------------------------------------------------------------------------
// Badge Awards (event badges → users by email)
// ---------------------------------------------------------------------------

interface BadgeAwardDef {
  badgeTitle: string;
  userEmails: string[];
}

const TEST_EMAIL_DOMAIN = "@test.eventtara.com";

const BADGE_AWARDS: BadgeAwardDef[] = [
  {
    badgeTitle: "Igbaras Hiker",
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`],
  },
  {
    badgeTitle: "Nadsadan Falls Explorer",
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`],
  },
  {
    badgeTitle: "Miag-ao Heritage Runner",
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`],
  },
  {
    badgeTitle: "Mt. Malinao Summiteer",
    userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`],
  },
  {
    badgeTitle: "Panay Circuit Finisher",
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`],
  },
  {
    badgeTitle: "Malalison Island Rider",
    userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant1${TEST_EMAIL_DOMAIN}`],
  },
  {
    badgeTitle: "Iloilo Fun Runner",
    userEmails: [`participant2${TEST_EMAIL_DOMAIN}`, `guest${TEST_EMAIL_DOMAIN}`],
  },
];

// ---------------------------------------------------------------------------
// System Badge Definitions
// ---------------------------------------------------------------------------

interface SystemBadgeDef {
  criteriaKey: string;
  title: string;
  description: string;
  category: "distance" | "adventure" | "location" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  imageUrl: string;
}

const SYSTEM_BADGE_DEFS: SystemBadgeDef[] = [
  {
    criteriaKey: "first_hike",
    title: "First Hike",
    description: "Checked in to your first hiking event",
    category: "adventure",
    rarity: "common",
    imageUrl: "\u{1F97E}",
  },
  {
    criteriaKey: "first_run",
    title: "First Run",
    description: "Checked in to your first running event",
    category: "distance",
    rarity: "common",
    imageUrl: "\u{1F3C3}",
  },
  {
    criteriaKey: "first_road_ride",
    title: "First Road Ride",
    description: "Checked in to your first road biking event",
    category: "distance",
    rarity: "common",
    imageUrl: "\u{1F6B4}",
  },
  {
    criteriaKey: "first_mtb",
    title: "First MTB Ride",
    description: "Checked in to your first mountain biking event",
    category: "distance",
    rarity: "common",
    imageUrl: "\u{1F6B5}",
  },
  {
    criteriaKey: "first_trail_run",
    title: "First Trail Run",
    description: "Checked in to your first trail running event",
    category: "adventure",
    rarity: "common",
    imageUrl: "\u{1F332}",
  },
  {
    criteriaKey: "all_rounder",
    title: "All-Rounder",
    description: "Checked in to at least one event of every activity type",
    category: "special",
    rarity: "epic",
    imageUrl: "\u{1F31F}",
  },
  {
    criteriaKey: "events_5",
    title: "5 Events",
    description: "Checked in to 5 events",
    category: "special",
    rarity: "common",
    imageUrl: "\u{1F3C5}",
  },
  {
    criteriaKey: "events_10",
    title: "10 Events",
    description: "Checked in to 10 events",
    category: "special",
    rarity: "rare",
    imageUrl: "\u{1F396}\uFE0F",
  },
  {
    criteriaKey: "events_25",
    title: "25 Events",
    description: "Checked in to 25 events",
    category: "special",
    rarity: "epic",
    imageUrl: "\u{1F3C6}",
  },
  {
    criteriaKey: "events_50",
    title: "50 Events",
    description: "Checked in to 50 events",
    category: "special",
    rarity: "legendary",
    imageUrl: "\u{1F451}",
  },
  {
    criteriaKey: "pioneer",
    title: "Check-in Pioneer",
    description: "Among the first 100 users to check in on EventTara",
    category: "special",
    rarity: "legendary",
    imageUrl: "\u{1F680}",
  },
  {
    criteriaKey: "pioneer_participant",
    title: "Pioneer Participant",
    description: "Among the first 250 users to join EventTara",
    category: "special",
    rarity: "legendary",
    imageUrl: "\u{1F31F}",
  },
  {
    criteriaKey: "pioneer_organizer",
    title: "Pioneer Organizer",
    description: "Among the first 50 organizers on EventTara",
    category: "special",
    rarity: "legendary",
    imageUrl: "\u{1F3D4}\uFE0F",
  },
  {
    criteriaKey: "first_review",
    title: "First Review",
    description: "Wrote your first organizer review on EventTara",
    category: "special",
    rarity: "rare",
    imageUrl: "\u270D\uFE0F",
  },
  {
    criteriaKey: "distance_5k",
    title: "5K Finisher",
    description: "Completed a 5K event",
    category: "distance",
    rarity: "common",
    imageUrl: "\u{1F3C3}",
  },
  {
    criteriaKey: "distance_10k",
    title: "10K Finisher",
    description: "Completed a 10K event",
    category: "distance",
    rarity: "common",
    imageUrl: "\u{1F3C3}\u200D\u2642\uFE0F",
  },
  {
    criteriaKey: "distance_21k",
    title: "Half Marathoner",
    description: "Completed a half marathon event",
    category: "distance",
    rarity: "rare",
    imageUrl: "\u{1F3C5}",
  },
  {
    criteriaKey: "distance_42k",
    title: "Marathoner",
    description: "Completed a marathon event",
    category: "distance",
    rarity: "epic",
    imageUrl: "\u{1F396}\uFE0F",
  },
  {
    criteriaKey: "distance_100k",
    title: "Ultra Marathoner",
    description: "Completed an ultra marathon event",
    category: "distance",
    rarity: "legendary",
    imageUrl: "\u{1F451}",
  },
  {
    criteriaKey: "strava_connected",
    title: "Connected Athlete",
    description: "Connected your Strava account to EventTara",
    category: "special",
    rarity: "rare",
    imageUrl: "\u{1F4AA}",
  },
  // Summit milestones
  {
    criteriaKey: "summits_1",
    title: "First Summit",
    description: "Reached your first mountain summit on EventTara",
    category: "location",
    rarity: "common",
    imageUrl: "\u{1F3D4}\uFE0F",
  },
  {
    criteriaKey: "summits_3",
    title: "3 Summits",
    description: "Conquered 3 different mountain summits",
    category: "location",
    rarity: "rare",
    imageUrl: "\u26F0\uFE0F",
  },
  {
    criteriaKey: "summits_5",
    title: "5 Summits",
    description: "Conquered 5 different mountain summits — a true peak bagger",
    category: "location",
    rarity: "epic",
    imageUrl: "\u{1F3D4}\uFE0F",
  },
  {
    criteriaKey: "summits_all",
    title: "Panay Mountaineer",
    description: "Summited every mountain on EventTara — you've conquered Panay's peaks",
    category: "location",
    rarity: "legendary",
    imageUrl: "\u{1F451}",
  },
  {
    criteriaKey: "igbaras_graduate",
    title: "Igbaras Graduate",
    description:
      "Conquered all 7 peaks of the Igbaras mountain group: Mt. Igatmon, Mt. Napulak, Mt. Opao, Mt. Taripis, Bato Igmatindog, Mt. Loboc, and Mt. Pulang Lupa",
    category: "location",
    rarity: "legendary",
    imageUrl: "\u{1F393}",
  },
];

// ---------------------------------------------------------------------------
// Lookup Helpers
// ---------------------------------------------------------------------------

/** Build event title → id map by looking up existing events. */
async function lookupEvents(): Promise<Map<string, string>> {
  const eventBadgeTitles = BADGE_DEFS.map((b) => b.eventTitle);
  const mountainEventTitles = MOUNTAIN_BADGE_DEFS.flatMap((b) => b.eventTitles);
  const titles = [...new Set([...eventBadgeTitles, ...mountainEventTitles])];
  const { data, error } = await supabase.from("events").select("id, title").in("title", titles);

  if (error) {
    console.error("Failed to look up events:", error.message);
    return new Map();
  }

  const map = new Map<string, string>();
  for (const event of data ?? []) {
    map.set(event.title, event.id);
  }
  return map;
}

/** Build email → user id map by looking up existing users via auth. */
async function lookupUsers(): Promise<Map<string, string>> {
  const emails = new Set<string>();
  for (const award of BADGE_AWARDS) {
    for (const email of award.userEmails) {
      emails.add(email);
    }
  }

  const map = new Map<string, string>();
  for (const email of emails) {
    const { data } = await supabase.from("users").select("id").eq("email", email).single();
    if (data) {
      map.set(email, data.id);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Badge Creation
// ---------------------------------------------------------------------------

/** Create event badges (upsert by title). */
async function createEventBadges(eventMap: Map<string, string>): Promise<Map<string, string>> {
  log("\u{1F3C5}", "Creating event badges...");

  const badgeMap = new Map<string, string>();

  for (const badge of BADGE_DEFS) {
    const eventId = eventMap.get(badge.eventTitle);
    if (!eventId) {
      console.error(`  Event not found for badge "${badge.title}", skipping.`);
      continue;
    }

    const { data: existing } = await supabase
      .from("badges")
      .select("id")
      .eq("title", badge.title)
      .single();

    if (existing) {
      await supabase.from("badges").update({ event_id: eventId }).eq("id", existing.id);
      badgeMap.set(badge.title, existing.id);
      log("  \u2705", `${badge.title} (${badge.eventTitle}) [existing]`);
      continue;
    }

    const { data, error } = await supabase
      .from("badges")
      .insert({
        event_id: eventId,
        title: badge.title,
        description: badge.description,
        image_url: badge.image_url,
        category: badge.category,
        rarity: badge.rarity,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to create badge "${badge.title}": ${error.message}`);
    } else {
      badgeMap.set(badge.title, data.id);
      log("  \u2705", `${badge.title} (${badge.eventTitle})`);
    }
  }

  return badgeMap;
}

/** Create mountain location badges (upsert by title). */
async function createMountainBadges(eventMap: Map<string, string>): Promise<Map<string, string>> {
  log("\u{1F3D4}\uFE0F", "Creating mountain location badges...");

  const mountainBadgeMap = new Map<string, string>();

  for (const badge of MOUNTAIN_BADGE_DEFS) {
    // Find any matching event for this mountain
    const matchingEventId = badge.eventTitles.map((t) => eventMap.get(t)).find((id) => id != null);

    const { data: existing } = await supabase
      .from("badges")
      .select("id")
      .eq("title", badge.title)
      .eq("category", "location")
      .single();

    if (existing) {
      mountainBadgeMap.set(badge.title, existing.id);
      log("  \u2705", `${badge.title} [existing]`);
      continue;
    }

    const { data, error } = await supabase
      .from("badges")
      .insert({
        event_id: matchingEventId ?? null,
        title: badge.title,
        description: badge.description,
        image_url: badge.image_url,
        category: "location" as const,
        rarity: badge.rarity,
        type: "system" as const,
        criteria_key: `mountain_${badge.mountain.toLowerCase().replace(/[.\s]+/g, "_")}`,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to create mountain badge "${badge.title}": ${error.message}`);
    } else {
      mountainBadgeMap.set(badge.title, data.id);
      log("  \u2705", `${badge.title}`);
    }
  }

  return mountainBadgeMap;
}

/** Create system badges (upsert by criteria_key). */
async function createSystemBadges(): Promise<Map<string, string>> {
  log("\u{1F396}\uFE0F", "Creating system badges...");

  const criteriaKeyToId = new Map<string, string>();

  for (const badge of SYSTEM_BADGE_DEFS) {
    const { data: existing } = await supabase
      .from("badges")
      .select("id")
      .eq("criteria_key", badge.criteriaKey)
      .single();

    if (existing) {
      criteriaKeyToId.set(badge.criteriaKey, existing.id);
      log("  \u2705", `${badge.title} (${badge.criteriaKey}) [existing]`);
      continue;
    }

    const { data, error } = await supabase
      .from("badges")
      .insert({
        title: badge.title,
        description: badge.description,
        image_url: badge.imageUrl,
        category: badge.category,
        rarity: badge.rarity,
        type: "system",
        criteria_key: badge.criteriaKey,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to create system badge "${badge.title}": ${error.message}`);
    } else {
      criteriaKeyToId.set(badge.criteriaKey, data.id);
      log("  \u2705", `${badge.title} (${badge.criteriaKey})`);
    }
  }

  return criteriaKeyToId;
}

// ---------------------------------------------------------------------------
// Badge Awards
// ---------------------------------------------------------------------------

/** Award event badges to users. */
async function awardEventBadges(userMap: Map<string, string>, badgeMap: Map<string, string>) {
  log("\u{1F396}\uFE0F", "Awarding event badges...");

  for (const award of BADGE_AWARDS) {
    const badgeId = badgeMap.get(award.badgeTitle);
    if (!badgeId) {
      console.error(`  Badge "${award.badgeTitle}" not found, skipping.`);
      continue;
    }

    for (const email of award.userEmails) {
      const userId = userMap.get(email);
      if (!userId) {
        console.error(`  User "${email}" not found, skipping.`);
        continue;
      }

      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badgeId,
      });

      if (error) {
        if (error.message.includes("duplicate")) {
          log("  \u2705", `${email} already has "${award.badgeTitle}"`);
        } else {
          console.error(`  Failed to award "${award.badgeTitle}" to ${email}: ${error.message}`);
        }
      } else {
        log("  \u2705", `${email} received "${award.badgeTitle}"`);
      }
    }
  }
}

/** Award system badges retroactively based on check-in data. */
async function awardSystemBadges(systemBadgeMap: Map<string, string>) {
  log("\u{1F31F}", "Awarding system badges retroactively...");

  const ALL_EVENT_TYPES = ["hiking", "running", "road_bike", "mtb", "trail_run"];

  // Get all users who have check-ins
  const { data: allCheckins } = await supabase.from("event_checkins").select("user_id").limit(1000);

  if (!allCheckins || allCheckins.length === 0) {
    log("  \u26A0\uFE0F", "No check-ins found, skipping system badge awards.");
    return;
  }

  const userIds = [...new Set(allCheckins.map((c) => c.user_id))];

  for (const userId of userIds) {
    // Fetch this user's check-ins with event types
    const { data: checkins } = await supabase
      .from("event_checkins")
      .select("event_id, events:event_id(type)")
      .eq("user_id", userId);

    if (!checkins || checkins.length === 0) continue;

    // Build stats
    const eventCountByType: Record<string, number> = {};
    let totalCheckins = 0;
    for (const checkin of checkins) {
      totalCheckins++;
      const event = checkin.events as unknown as { type: string } | null;
      const eventType = event?.type;
      if (eventType) {
        eventCountByType[eventType] = (eventCountByType[eventType] ?? 0) + 1;
      }
    }

    // Pioneer rank
    const { data: firstCheckin } = await supabase
      .from("event_checkins")
      .select("checked_in_at")
      .eq("user_id", userId)
      .order("checked_in_at", { ascending: true })
      .limit(1)
      .single();

    let pioneerRank: number | null = null;
    if (firstCheckin) {
      const { data: earlierUsers } = await supabase
        .from("event_checkins")
        .select("user_id")
        .lt("checked_in_at", firstCheckin.checked_in_at);

      const distinctEarlierUsers = new Set((earlierUsers ?? []).map((r) => r.user_id));
      pioneerRank = distinctEarlierUsers.size + 1;
    }

    // Evaluate criteria
    const typeCount = (t: string) => eventCountByType[t] ?? 0;
    const criteria: Record<string, boolean> = {
      first_hike: typeCount("hiking") >= 1,
      first_run: typeCount("running") >= 1,
      first_road_ride: typeCount("road_bike") >= 1,
      first_mtb: typeCount("mtb") >= 1,
      first_trail_run: typeCount("trail_run") >= 1,
      all_rounder: ALL_EVENT_TYPES.every((type) => typeCount(type) >= 1),
      events_5: totalCheckins >= 5,
      events_10: totalCheckins >= 10,
      events_25: totalCheckins >= 25,
      events_50: totalCheckins >= 50,
      pioneer: pioneerRank !== null && pioneerRank <= 100,
    };

    // Get user info for logging
    const { data: userData } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", userId)
      .single();
    const userName = userData?.full_name ?? userData?.email ?? userId;

    // Award matching badges
    const earned: string[] = [];
    for (const [criteriaKey, passes] of Object.entries(criteria)) {
      if (!passes) continue;

      const badgeId = systemBadgeMap.get(criteriaKey);
      if (!badgeId) continue;

      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badgeId,
      });

      if (error) {
        if (!error.message.includes("duplicate")) {
          console.error(`  Failed to award "${criteriaKey}" to ${userName}: ${error.message}`);
        }
      } else {
        earned.push(criteriaKey);
      }
    }

    if (earned.length > 0) {
      log("  \u2705", `${userName}: ${earned.join(", ")}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  EventTara - Badge Seed Script");
  console.log("  Target: " + SUPABASE_URL);
  console.log("=".repeat(60));
  console.log();

  const startTime = Date.now();

  try {
    // Step 1: Look up existing events and users
    log("\u{1F50D}", "Looking up existing events...");
    const eventMap = await lookupEvents();
    log("  \u{1F4CA}", `Found ${eventMap.size} matching events`);
    console.log();

    log("\u{1F50D}", "Looking up existing users...");
    const userMap = await lookupUsers();
    log("  \u{1F4CA}", `Found ${userMap.size} matching users`);
    console.log();

    // Step 2: Create event badges
    const badgeMap = await createEventBadges(eventMap);
    console.log();

    // Step 3: Create mountain location badges
    const mountainBadgeMap = await createMountainBadges(eventMap);
    console.log();

    // Step 4: Award event badges to users
    await awardEventBadges(userMap, badgeMap);
    console.log();

    // Step 5: Create system badges
    const systemBadgeMap = await createSystemBadges();
    console.log();

    // Step 6: Award system badges retroactively
    await awardSystemBadges(systemBadgeMap);
    console.log();

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("=".repeat(60));
    log("\u{1F389}", `Badge seed completed in ${elapsed}s`);
    log("  \u{1F3C5}", `${badgeMap.size} event badges`);
    log("  \u{1F3D4}\uFE0F", `${mountainBadgeMap.size} mountain badges`);
    log("  \u{1F396}\uFE0F", `${systemBadgeMap.size} system badges`);
    console.log("=".repeat(60));
  } catch (err) {
    console.error("\nBadge seed failed with an unexpected error:");
    console.error(err);
    process.exit(1);
  }
}

main();
