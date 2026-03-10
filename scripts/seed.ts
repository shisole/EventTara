/**
 * EventTara - Database Seed Script
 *
 * Creates test accounts and events for local development.
 * Uses the Supabase Admin client (service_role key) to bypass RLS.
 *
 * Usage: npm run seed
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { loadEnvironment } from "./load-env";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvironment(projectRoot);

import polyline from "@mapbox/polyline";
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

// Safety: require explicit confirmation via --yes flag
if (!process.argv.includes("--yes")) {
  console.error(
    `\n  WARNING: You are about to SEED the database at:\n  ${SUPABASE_URL}\n\n` +
      "  This will create test accounts and data.\n" +
      "  Run with --yes to confirm:\n\n" +
      "    pnpm seed --yes\n",
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

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(6, 0, 0, 0); // 6 AM start time
  return d.toISOString();
}

function log(emoji: string, message: string) {
  console.log(`${emoji}  ${message}`);
}

// ---------------------------------------------------------------------------
// Test Data Definitions
// ---------------------------------------------------------------------------

const TEST_EMAIL_DOMAIN = "@test.eventtara.com";
const DEFAULT_PASSWORD = "TestPass123!";

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  username: string;
  role: "user" | "guest";
  is_guest?: boolean;
  avatar_url?: string | null;
}

const TEST_USERS: TestUser[] = [
  {
    email: `organizer1${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Marco Santos",
    username: "marco_trails",
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `organizer2${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Ana Reyes",
    username: "ana_pedal",
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `participant1${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Jake Mendoza",
    username: "jake_adventure",
    role: "user",
  },
  {
    email: `participant2${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Maria Cruz",
    username: "maria_explorer",
    role: "user",
  },
  {
    email: `participant3${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Carlos Rivera",
    username: "carlos_hiker",
    role: "user",
  },
  {
    email: `guest${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Mountain Goat",
    username: "guest_adventurer",
    role: "guest",
    is_guest: true,
    avatar_url: "preset:mountain-goat",
  },
  {
    email: `organizer3${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Jay Tablatin",
    username: "jtt_trails",
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `organizer4${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Teri Magbanua",
    username: "ftt_treks",
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `organizer5${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Yen Casimiro",
    username: "yenergy_out",
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `organizer6${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Ruben Torres",
    username: "ruborubo",
    role: "user",
    avatar_url:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
  },
];

interface ClubDef {
  ownerEmail: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  visibility: "public";
}

const CLUBS: ClubDef[] = [
  {
    ownerEmail: `organizer1${TEST_EMAIL_DOMAIN}`,
    name: "Panay Trail Collective",
    slug: "panay-trail-collective",
    description:
      "Exploring the mountains and trails of Panay Island — from the highlands of Igbaras and Tubungan to the summit of Mt. Madja-as. We organize hiking, trail running, and outdoor adventures across Iloilo, Antique, and beyond.",
    logo_url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
    visibility: "public",
  },
  {
    ownerEmail: `organizer2${TEST_EMAIL_DOMAIN}`,
    name: "Iloilo Pedal Club",
    slug: "iloilo-pedal-club",
    description:
      "Road cycling and mountain biking events across Panay Island. From the coastal roads of Iloilo-Antique to the highland trails of Tubungan and Guimaras, we bring the Western Visayas cycling community together.",
    logo_url: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=200&h=200&fit=crop",
    visibility: "public",
  },
  {
    ownerEmail: `organizer3${TEST_EMAIL_DOMAIN}`,
    name: "JTT (Journey Through Trails)",
    slug: "jtt-journey-through-trails",
    description:
      "Journey Through Trails — discovering the hidden paths of Panay Island one trail at a time. We organize weekend hikes, multi-day treks, and trail exploration events across Iloilo, Antique, and Capiz.",
    logo_url: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=200&h=200&fit=crop",
    visibility: "public",
  },
  {
    ownerEmail: `organizer4${TEST_EMAIL_DOMAIN}`,
    name: "Five Tersty Trekkers",
    slug: "five-tersty-trekkers",
    description:
      "Five friends turned trail community — Five Tersty Trekkers brings the fun to every mountain adventure. From Igbaras to Antique, we hike with energy, laughter, and lots of water (we're always thirsty!).",
    logo_url: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=200&h=200&fit=crop",
    visibility: "public",
  },
  {
    ownerEmail: `organizer5${TEST_EMAIL_DOMAIN}`,
    name: "Yenergy Outdoors",
    slug: "yenergy-outdoors",
    description:
      "Fueled by positive energy! Yenergy Outdoors organizes hiking, trail running, and outdoor fitness events across Western Visayas. We believe every mountain is a chance to recharge your soul.",
    logo_url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop",
    visibility: "public",
  },
  {
    ownerEmail: `organizer6${TEST_EMAIL_DOMAIN}`,
    name: "Rubo-rubo Lang",
    slug: "rubo-rubo-lang",
    description:
      "Rubo-rubo lang — just wandering! A laid-back hiking community that explores the trails of Panay at our own pace. No pressure, no rush. Just good vibes, good views, and good company.",
    logo_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop",
    visibility: "public",
  },
];

// Unsplash cover images for different event types
const COVER_IMAGES = {
  hiking: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=630&fit=crop",
  trail_run: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&h=630&fit=crop",
  road_bike: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1200&h=630&fit=crop",
  mtb: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1200&h=630&fit=crop",
  running: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&h=630&fit=crop",
  hiking_alt: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=630&fit=crop",
  trail_run_alt:
    "https://images.unsplash.com/photo-1510227272981-87123e259b17?w=1200&h=630&fit=crop",
  mtb_alt: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=630&fit=crop",
  hiking_alt2: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop",
  road_bike_alt:
    "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=1200&h=630&fit=crop",
  running_alt: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=1200&h=630&fit=crop",
};

// ---------------------------------------------------------------------------
// Mountains Data
// ---------------------------------------------------------------------------

const PANAY_MOUNTAINS = [
  // Panay Trilogy (Antique)
  { name: "Mt. Madja-as", province: "Antique", difficulty_level: 8, elevation_masl: 2117 },
  { name: "Mt. Nangtud", province: "Antique", difficulty_level: 8, elevation_masl: 2073 },
  { name: "Mt. Baloy", province: "Antique", difficulty_level: 9, elevation_masl: 1981 },
  // Antique
  { name: "Mt. Balabag", province: "Antique", difficulty_level: 6, elevation_masl: 1713 },
  { name: "Mt. Agbalanti", province: "Antique", difficulty_level: 6, elevation_masl: 1579 },
  // Iloilo — Igbaras group
  { name: "Mt. Opao", province: "Iloilo", difficulty_level: 6, elevation_masl: 1296 },
  { name: "Mt. Taripis", province: "Iloilo", difficulty_level: 4, elevation_masl: 1320 },
  { name: "Mt. Pulang Lupa", province: "Iloilo", difficulty_level: 3, elevation_masl: 1260 },
  { name: "Mt. Napulak", province: "Iloilo", difficulty_level: 4, elevation_masl: 1239 },
  { name: "Tambara Ridge", province: "Iloilo", difficulty_level: 2, elevation_masl: 1193 },
  { name: "Mt. Igatmon", province: "Iloilo", difficulty_level: 6, elevation_masl: 1120 },
  { name: "Bato Igmatindog", province: "Iloilo", difficulty_level: 4, elevation_masl: 1000 },
  { name: "Mt. Loboc", province: "Iloilo", difficulty_level: 4, elevation_masl: 1000 },
  // Iloilo — other
  { name: "Mt. Inaman", province: "Iloilo", difficulty_level: 5, elevation_masl: 1396 },
  { name: "Mt. Igdalig", province: "Iloilo", difficulty_level: 5, elevation_masl: 1377 },
  { name: "Mt. Lingguhob", province: "Iloilo", difficulty_level: 6, elevation_masl: 1226 },
  // Iloilo — Miag-ao Trilogy
  { name: "Mt. Kongkong", province: "Iloilo", difficulty_level: 3, elevation_masl: 1046 },
  { name: "Bato Sampaw", province: "Iloilo", difficulty_level: 2, elevation_masl: 794 },
  { name: "Mt. Panay", province: "Iloilo", difficulty_level: 3, elevation_masl: 800 },
];

/** Map of hiking event title -> mountain names to link */
const HIKING_EVENT_MOUNTAINS: Record<string, string[]> = {
  "Mt. Madja-as Summit Trek": ["Mt. Madja-as"],
  "Igbaras Mountain Day Hike": ["Mt. Napulak", "Mt. Igdalig"],
  "Mt. Napulak Sunrise Hike": ["Mt. Napulak"],
  "Mt. Baloy Ridge Traverse": ["Mt. Baloy"],
  "Igbaras-Tubungan Traverse": ["Mt. Napulak", "Mt. Inaman"],
  "Baloy Falls Adventure Hike": ["Mt. Baloy"],
  "Lambunao Waterfall Trek": ["Mt. Inaman", "Mt. Igdalig"],
  "Janiuay Highlands Day Hike": ["Mt. Inaman"],
  "Nadsadan Falls Day Hike": ["Mt. Napulak"],
  "Hamtic River Gorge Trek": ["Mt. Balabag", "Mt. Agbalanti"],
  "Sibalom Natural Park Wander": ["Mt. Agbalanti"],
  "Mt. Opao Day Hike": ["Mt. Opao"],
  "Mt. Opao Sunrise Trek": ["Mt. Opao"],
  "Mt. Opao Trail Run 8K": ["Mt. Opao"],
  "Mt. Lingguhob Summit Hike": ["Mt. Lingguhob"],
  "Mt. Lingguhob Ridge Trail": ["Mt. Lingguhob"],
  "Mt. Lingguhob Night Hike": ["Mt. Lingguhob"],
  "Mt. Lingguhob Waterfall Loop": ["Mt. Lingguhob"],
  "Mt. Lingguhob Sunrise Assault": ["Mt. Lingguhob"],
  "Mt. Lingguhob Trail Cleanup Hike": ["Mt. Lingguhob"],
  "Mt. Lingguhob Full Moon Hike": ["Mt. Lingguhob"],
  "Mt. Lingguhob Beginner Day Hike": ["Mt. Lingguhob"],
  "Mt. Igatmon Expedition": ["Mt. Igatmon"],
  "Mt. Igatmon Summit Day Hike": ["Mt. Igatmon"],
  "Mt. Igatmon Traverse": ["Mt. Igatmon"],
};

interface TestEvent {
  clubName: string;
  title: string;
  description: string;
  type: "hiking" | "mtb" | "road_bike" | "running" | "trail_run";
  date: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  max_participants: number;
  price: number;
  status: "draft" | "published" | "completed" | "cancelled";
  cover_image_url: string;
  distances?: { distance_km: number; label?: string; price: number; max_participants: number }[];
}

const TEST_EVENTS: TestEvent[] = [
  // ---- Club 1: Panay Trail Collective ----
  {
    clubName: "Panay Trail Collective",
    title: "Mt. Madja-as Summit Trek",
    description:
      "Conquer the highest peak on Panay Island! This 2-day guided trek to the summit of Mt. Madja-as (2,117m) in Antique takes you through mossy forest, cloud forest, and exposed ridgelines with panoramic views of the Visayan Sea. Includes guide, porter, campsite fee, and meals. Bring cold-weather gear — summit temperatures can drop to single digits!",
    type: "hiking",
    date: daysFromNow(14),
    location: "Mt. Madja-as, Culasi, Antique",
    coordinates: { lat: 11.385, lng: 122.06 },
    max_participants: 20,
    price: 2500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Bucari Pine Forest Trail Run",
    description:
      "Run through the pine-covered highlands of Bucari in Leon, Iloilo. This scenic 15K trail run winds through rolling hills of Benguet pine trees at 900m elevation — a cool escape from the Iloilo heat. Includes hydration stations, finisher medal, and a post-run bonfire. One of the most unique trail running experiences in the Visayas.",
    type: "trail_run",
    date: daysFromNow(21),
    location: "Bucari, Leon, Iloilo",
    coordinates: { lat: 10.7833, lng: 122.3667 },
    max_participants: 40,
    price: 600,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run,
    distances: [
      { distance_km: 10, price: 500, max_participants: 25 },
      { distance_km: 15, price: 600, max_participants: 15 },
    ],
  },
  {
    clubName: "Panay Trail Collective",
    title: "Igbaras Mountain Day Hike",
    description:
      "Explore the lush mountains of Igbaras, the hiking capital of Iloilo. This beginner-friendly day hike takes you past Nadsadan Falls and through dense tropical forest to a scenic ridge overlooking the town and the Panay Gulf. Perfect for first-timers. Includes guide, lunch, and river dip at the falls.",
    type: "hiking",
    date: daysFromNow(-14),
    location: "Igbaras, Iloilo",
    coordinates: { lat: 10.72, lng: 122.27 },
    max_participants: 35,
    price: 350,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Mt. Nangtud Expedition",
    description:
      "Attempt the second highest peak in Panay — Mt. Nangtud (2,073m) in the deep mountains of Antique. This 3-day expedition through virgin forest and steep ridges is strictly for experienced mountaineers. All-inclusive: guides, porters, camping gear, and all meals from basecamp to summit.",
    type: "trail_run",
    date: daysFromNow(45),
    location: "Mt. Nangtud, Sebaste, Antique",
    coordinates: { lat: 11.35, lng: 122.02 },
    max_participants: 15,
    price: 3500,
    status: "draft",
    cover_image_url: COVER_IMAGES.trail_run_alt,
  },
  // ---- Club 2: Iloilo Pedal Club ----
  {
    clubName: "Iloilo Pedal Club",
    title: "Iloilo-Antique Coastal Road Ride",
    description:
      "Ride the stunning coastal road from Iloilo City to San Jose de Buenavista, Antique. This 120km road cycling event hugs the coastline through Miag-ao, San Joaquin, and the scenic mountain passes of southern Iloilo. Includes SAG support vehicle, hydration stops every 25km, and a seafood feast in Antique. Road bikes recommended.",
    type: "road_bike",
    date: daysFromNow(28),
    location: "Iloilo City to San Jose, Antique",
    coordinates: { lat: 10.7202, lng: 122.5621 },
    max_participants: 35,
    price: 800,
    status: "published",
    cover_image_url: COVER_IMAGES.road_bike,
    distances: [
      { distance_km: 50, price: 600, max_participants: 20 },
      { distance_km: 120, price: 800, max_participants: 15 },
    ],
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Tubungan Highlands MTB",
    description:
      "Take on the highland trails of Tubungan, Iloilo on a mountain bike. Rolling single tracks through farmlands, river crossings, and steep climbs with rewarding views of the surrounding mountains. This intermediate-level MTB event includes mechanical support, local lunch, and a cold spring dip. Hardtail or full-suspension recommended.",
    type: "mtb",
    date: daysFromNow(14),
    location: "Tubungan, Iloilo",
    coordinates: { lat: 10.75, lng: 122.3 },
    max_participants: 25,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Iloilo Esplanade Night Run 10K",
    description:
      "Run the iconic Iloilo Esplanade at night! This 10K night run takes you along the beautifully lit riverside boardwalk, through the streets of Mandurriao, and past the Iloilo Business Park. Open to all fitness levels. Includes race kit, LED armband, finisher medal, and post-run street food festival. The best way to experience Iloilo City after dark.",
    type: "running",
    date: daysFromNow(7),
    location: "Esplanade, Iloilo City",
    coordinates: { lat: 10.713, lng: 122.565 },
    max_participants: 100,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
    distances: [
      { distance_km: 3, price: 200, max_participants: 50 },
      { distance_km: 5, price: 300, max_participants: 40 },
      { distance_km: 10, price: 400, max_participants: 60 },
    ],
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Guimaras Island MTB Adventure",
    description:
      "Cross the Iloilo Strait by boat and explore Guimaras Island on mountain bikes. Scenic coastal trails, mango plantation roads, and rolling hills make this a unique island MTB experience. Includes boat transfer, park entrance, lunch, and mechanical support. Don't miss the fresh mangoes at the finish!",
    type: "mtb",
    date: daysFromNow(35),
    location: "Guimaras Island",
    coordinates: { lat: 10.588, lng: 122.628 },
    max_participants: 20,
    price: 900,
    status: "cancelled",
    cover_image_url: COVER_IMAGES.mtb_alt,
  },
  // ---- Past / Completed Events ----
  // Panay Trail Collective
  {
    clubName: "Panay Trail Collective",
    title: "Nadsadan Falls Day Hike",
    description:
      "A refreshing day hike to the multi-tiered Nadsadan Falls in Igbaras, Iloilo. Trek through bamboo groves and river trails to reach the stunning cascade. Includes guide, packed lunch, and plenty of time for swimming in the crystal-clear pools. A perfect weekend escape from the city.",
    type: "hiking",
    date: daysFromNow(-21),
    location: "Nadsadan Falls, Igbaras, Iloilo",
    coordinates: { lat: 10.715, lng: 122.265 },
    max_participants: 30,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Miag-ao Heritage Trail Run",
    description:
      "A scenic 21K trail run starting from the UNESCO World Heritage Miag-ao Church, through coastal paths, rice paddies, and the rolling hills of southern Iloilo. Experience history and nature combined. Includes finisher medal, hydration stations, and a heritage town tour post-race.",
    type: "trail_run",
    date: daysFromNow(-45),
    location: "Miag-ao, Iloilo",
    coordinates: { lat: 10.644, lng: 122.234 },
    max_participants: 50,
    price: 650,
    status: "completed",
    cover_image_url: COVER_IMAGES.trail_run_alt,
    distances: [
      { distance_km: 10, price: 500, max_participants: 30 },
      { distance_km: 21, label: "Half Marathon", price: 650, max_participants: 20 },
    ],
  },
  {
    clubName: "Panay Trail Collective",
    title: "Mt. Malinao Summit Hike",
    description:
      "Trek to the summit of Mt. Malinao (1,610m) in Aklan, the sacred mountain of the Ati people. This challenging day hike passes through old-growth forest and mossy trails. On a clear day, the summit offers views of Boracay Island, the Sibuyan Sea, and the Antique mountain range. Guide and packed meals included.",
    type: "hiking",
    date: daysFromNow(-75),
    location: "Mt. Malinao, Malinao, Aklan",
    coordinates: { lat: 11.69, lng: 122.18 },
    max_participants: 20,
    price: 1200,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  // Iloilo Pedal Club
  {
    clubName: "Iloilo Pedal Club",
    title: "Panay Circumferential Road Ride",
    description:
      "The ultimate Panay cycling challenge — a 2-day 300km road ride around the entire island. Day 1: Iloilo to Roxas City via Capiz coast. Day 2: Roxas to Kalibo to Antique and back to Iloilo. Fully supported with SAG wagons, aid stations, overnight accommodation, and meals. For serious cyclists only.",
    type: "road_bike",
    date: daysFromNow(-30),
    location: "Panay Island Circumferential",
    coordinates: { lat: 11.0, lng: 122.5 },
    max_participants: 30,
    price: 2500,
    status: "completed",
    cover_image_url: COVER_IMAGES.road_bike_alt,
    distances: [
      { distance_km: 100, price: 1500, max_participants: 15 },
      { distance_km: 300, label: "Full Circumferential", price: 2500, max_participants: 15 },
    ],
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Malalison Island Trail Ride",
    description:
      "Take a boat to the remote Malalison Island off the coast of Culasi, Antique, and explore its rugged trails on mountain bikes. Coastal cliffs, white sand coves, and challenging rocky terrain make this a one-of-a-kind MTB experience. Includes boat transfer, island guide, lunch, and beach time.",
    type: "mtb",
    date: daysFromNow(-60),
    location: "Malalison Island, Culasi, Antique",
    coordinates: { lat: 11.44, lng: 121.96 },
    max_participants: 15,
    price: 1500,
    status: "completed",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Iloilo City Fun Run 5K",
    description:
      "A beginner-friendly 5K fun run through the streets of Iloilo City. Starting at the Iloilo Esplanade, the route passes by the iconic Molo Church, through the tree-lined streets of Jaro, and finishes at SM City Iloilo. Perfect for first-time runners and families. Includes race bib, finisher medal, and free La Paz batchoy at the finish!",
    type: "running",
    date: daysFromNow(-90),
    location: "Iloilo City",
    coordinates: { lat: 10.692, lng: 122.564 },
    max_participants: 200,
    price: 250,
    status: "completed",
    cover_image_url: COVER_IMAGES.running_alt,
    distances: [
      { distance_km: 3, price: 200, max_participants: 100 },
      { distance_km: 5, price: 250, max_participants: 100 },
    ],
  },
  // ---- Club 3: JTT (Journey Through Trails) ----
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Igbaras-Tubungan Traverse",
    description:
      "A challenging day traverse connecting the mountain trails of Igbaras and Tubungan. Start from Brgy. Passi in Igbaras, cross the ridgeline, and descend into the highlands of Tubungan. Roughly 18km of trail through farmland, forest, and river valleys. For experienced hikers. Guide and lunch included.",
    type: "hiking",
    date: daysFromNow(10),
    location: "Igbaras to Tubungan, Iloilo",
    coordinates: { lat: 10.735, lng: 122.285 },
    max_participants: 25,
    price: 450,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Bacolod de Tubungan Heritage Hike",
    description:
      "Discover the old Spanish-era ruins and mountain trails around Bacolod de Tubungan. This easy-to-moderate hike explores the historical sites and natural springs of one of Iloilo's hidden gems. Guide, snacks, and local history briefing included.",
    type: "hiking",
    date: daysFromNow(-35),
    location: "Tubungan, Iloilo",
    coordinates: { lat: 10.748, lng: 122.31 },
    max_participants: 30,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  // ---- Club 4: Five Tersty Trekkers ----
  {
    clubName: "Five Tersty Trekkers",
    title: "Pan de Azucar Island Day Trek",
    description:
      "Trek to the summit of Pan de Azucar (Sugar Loaf) island off the coast of Concepcion, Iloilo. A boat ride across turquoise waters leads to a steep but rewarding climb with 360-degree views of the Visayan Sea. Includes boat transfer, guide, and island picnic lunch.",
    type: "hiking",
    date: daysFromNow(18),
    location: "Pan de Azucar Island, Concepcion, Iloilo",
    coordinates: { lat: 11.27, lng: 123.08 },
    max_participants: 20,
    price: 700,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Five Tersty Trekkers",
    title: "Baloy Falls Adventure Hike",
    description:
      "Trek through the jungles of San Joaquin to reach the stunning Baloy Falls — a multi-tiered cascade hidden deep in the mountains of southern Iloilo. River crossings, rope sections, and jungle trails make this an exciting adventure for intermediate hikers. Guide and packed lunch included.",
    type: "hiking",
    date: daysFromNow(-50),
    location: "San Joaquin, Iloilo",
    coordinates: { lat: 10.59, lng: 122.21 },
    max_participants: 20,
    price: 400,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  // ---- Club 5: Yenergy Outdoors ----
  {
    clubName: "Yenergy Outdoors",
    title: "Mt. Napulak Sunrise Hike",
    description:
      "Catch the sunrise from the summit of Mt. Napulak in Igbaras, one of the most accessible peaks in Iloilo. Start the pre-dawn hike at 3 AM and reach the summit just in time for golden hour. Includes guide, headlamps, and breakfast at the summit. Perfect for all fitness levels.",
    type: "hiking",
    date: daysFromNow(5),
    location: "Mt. Napulak, Igbaras, Iloilo",
    coordinates: { lat: 10.71, lng: 122.28 },
    max_participants: 30,
    price: 350,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "Yenergy Outdoors",
    title: "Calinog Highland Trail Run 15K",
    description:
      "A 15K trail run through the rolling highlands of Calinog, Iloilo. Pass through coffee plantations, river crossings, and open grasslands with views of the central Panay mountain range. Includes finisher medal, hydration stations, and a post-run recovery meal. Moderate difficulty.",
    type: "trail_run",
    date: daysFromNow(-25),
    location: "Calinog, Iloilo",
    coordinates: { lat: 10.85, lng: 122.35 },
    max_participants: 40,
    price: 500,
    status: "completed",
    cover_image_url: COVER_IMAGES.trail_run,
    distances: [
      { distance_km: 5, price: 350, max_participants: 15 },
      { distance_km: 15, price: 500, max_participants: 25 },
    ],
  },
  // ---- Club 6: Rubo-rubo Lang ----
  {
    clubName: "Rubo-rubo Lang",
    title: "Garin Farm Hilltop Hike",
    description:
      "A relaxed day hike to the famous Garin Farm hilltop in San Joaquin, Iloilo. Climb the 456 steps to the heavenly garden replica with views of the coastline and surrounding mountains. Perfect for families and casual hikers. Includes farm entrance, guide, and organic lunch.",
    type: "hiking",
    date: daysFromNow(12),
    location: "Garin Farm, San Joaquin, Iloilo",
    coordinates: { lat: 10.595, lng: 122.195 },
    max_participants: 40,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Rubo-rubo Lang",
    title: "Anini-y Coastal Trail Walk",
    description:
      "A chill coastal trail walk along the cliffs and beaches of Anini-y, Antique. No rush, no pressure — just a relaxing 8km walk with ocean views, tide pools, and a seafood lunch by the beach. The rubo-rubo (wandering) way of hiking.",
    type: "hiking",
    date: daysFromNow(-40),
    location: "Anini-y, Antique",
    coordinates: { lat: 10.46, lng: 121.95 },
    max_participants: 25,
    price: 350,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  // ====================================================================
  // Additional events to reach 50+ total
  // ====================================================================
  // ---- Panay Trail Collective ----
  {
    clubName: "Panay Trail Collective",
    title: "Mt. Baloy Ridge Traverse",
    description:
      "A full-day ridge traverse across Mt. Baloy in San Joaquin, Iloilo. Exposed ridgeline hiking with views of the Panay Gulf and surrounding farmlands. Intermediate difficulty.",
    type: "hiking",
    date: daysFromNow(8),
    location: "San Joaquin, Iloilo",
    coordinates: { lat: 10.595, lng: 122.2 },
    max_participants: 25,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Cabatuan River Trail Run 10K",
    description:
      "A scenic 10K trail run following the river systems of Cabatuan, Iloilo. Flat-to-rolling terrain through rice paddies and riverside paths. Beginner-friendly.",
    type: "trail_run",
    date: daysFromNow(16),
    location: "Cabatuan, Iloilo",
    coordinates: { lat: 10.86, lng: 122.49 },
    max_participants: 50,
    price: 350,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run,
    distances: [
      { distance_km: 5, price: 250, max_participants: 25 },
      { distance_km: 10, price: 350, max_participants: 25 },
    ],
  },
  {
    clubName: "Panay Trail Collective",
    title: "Janiuay Highlands Day Hike",
    description:
      "Explore the rolling highlands of Janiuay with panoramic views of central Panay. Easy-to-moderate day hike through farmlands and forest patches.",
    type: "hiking",
    date: daysFromNow(-10),
    location: "Janiuay, Iloilo",
    coordinates: { lat: 10.95, lng: 122.5 },
    max_participants: 30,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Lambunao Waterfall Trek",
    description:
      "Trek to the hidden waterfalls of Lambunao in the interior mountains of Iloilo. Multiple cascades, jungle trails, and natural swimming pools.",
    type: "hiking",
    date: daysFromNow(25),
    location: "Lambunao, Iloilo",
    coordinates: { lat: 10.94, lng: 122.37 },
    max_participants: 20,
    price: 450,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Passi City River Run 5K",
    description:
      "A quick 5K fun run through the streets and riverbanks of Passi City. Great for beginners and families. Post-run pancit molo feast included!",
    type: "running",
    date: daysFromNow(-55),
    location: "Passi City, Iloilo",
    coordinates: { lat: 11.11, lng: 122.64 },
    max_participants: 80,
    price: 200,
    status: "completed",
    cover_image_url: COVER_IMAGES.running,
  },
  // ---- Iloilo Pedal Club ----
  {
    clubName: "Iloilo Pedal Club",
    title: "Oton-Tigbauan Coastal Ride",
    description:
      "A beginner-friendly 40km coastal road ride from Oton to Tigbauan and back. Flat terrain, ocean views, and a seafood lunch stop in Tigbauan.",
    type: "road_bike",
    date: daysFromNow(6),
    location: "Oton to Tigbauan, Iloilo",
    coordinates: { lat: 10.69, lng: 122.48 },
    max_participants: 40,
    price: 300,
    status: "published",
    cover_image_url: COVER_IMAGES.road_bike,
    distances: [
      { distance_km: 20, price: 200, max_participants: 20 },
      { distance_km: 40, price: 300, max_participants: 20 },
    ],
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Santa Barbara Farm MTB",
    description:
      "Mountain biking through the agricultural flatlands and gentle hills of Santa Barbara. Easy trails perfect for MTB beginners. Includes farm tour and fresh produce snacks.",
    type: "mtb",
    date: daysFromNow(20),
    location: "Santa Barbara, Iloilo",
    coordinates: { lat: 10.82, lng: 122.53 },
    max_participants: 30,
    price: 350,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Dumangas Century Ride",
    description:
      "A 100km endurance road ride from Iloilo City to Dumangas and back via the national highway. For intermediate to advanced riders. SAG support provided.",
    type: "road_bike",
    date: daysFromNow(-20),
    location: "Iloilo City to Dumangas",
    coordinates: { lat: 10.83, lng: 122.71 },
    max_participants: 30,
    price: 600,
    status: "completed",
    cover_image_url: COVER_IMAGES.road_bike_alt,
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Jaro Heritage Night Ride",
    description:
      "An evening bike ride through the heritage district of Jaro, Iloilo. Visit the Jaro Cathedral, old mansions, and the Jaro belfry illuminated at night. Casual pace, all bike types welcome.",
    type: "road_bike",
    date: daysFromNow(32),
    location: "Jaro, Iloilo City",
    coordinates: { lat: 10.72, lng: 122.57 },
    max_participants: 50,
    price: 150,
    status: "published",
    cover_image_url: COVER_IMAGES.road_bike,
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Pavia Sprint Duathlon",
    description:
      "Run 5K, bike 20K, run 2.5K! A beginner-friendly sprint duathlon in the flat roads of Pavia, Iloilo. Transition area and timing chip provided.",
    type: "running",
    date: daysFromNow(-65),
    location: "Pavia, Iloilo",
    coordinates: { lat: 10.77, lng: 122.55 },
    max_participants: 60,
    price: 500,
    status: "completed",
    cover_image_url: COVER_IMAGES.running_alt,
  },
  // ---- JTT (Journey Through Trails) ----
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Capiz River Valley Trail",
    description:
      "Explore the lush river valleys of Capiz province. A moderate day hike following the Panay River through dense forest and traditional farming communities.",
    type: "hiking",
    date: daysFromNow(22),
    location: "Tapaz, Capiz",
    coordinates: { lat: 11.26, lng: 122.52 },
    max_participants: 20,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Maasin Watershed Trail Hike",
    description:
      "Hike through the protected Maasin Watershed in Iloilo. Dense canopy, bird-watching, and pristine streams in one of the last remaining lowland forests of Panay.",
    type: "hiking",
    date: daysFromNow(-8),
    location: "Maasin, Iloilo",
    coordinates: { lat: 10.83, lng: 122.43 },
    max_participants: 20,
    price: 350,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Aklan Mountain Loop Trail Run",
    description:
      "A challenging 25K trail loop through the mountains of Aklan. River crossings, steep ascents, and jungle trails through Ati ancestral lands.",
    type: "trail_run",
    date: daysFromNow(40),
    location: "Malinao, Aklan",
    coordinates: { lat: 11.69, lng: 122.18 },
    max_participants: 30,
    price: 700,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run_alt,
    distances: [
      { distance_km: 10, price: 500, max_participants: 15 },
      { distance_km: 25, price: 700, max_participants: 15 },
    ],
  },
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Leon River Trail Walk",
    description:
      "A relaxed river trail walk through Leon, Iloilo. Follow the cool mountain streams past small waterfalls and swimming holes. Perfect for families.",
    type: "hiking",
    date: daysFromNow(-70),
    location: "Leon, Iloilo",
    coordinates: { lat: 10.78, lng: 122.37 },
    max_participants: 35,
    price: 250,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  // ---- Five Tersty Trekkers ----
  {
    clubName: "Five Tersty Trekkers",
    title: "Concepcion Island Hop & Hike",
    description:
      "Island hop across the Concepcion archipelago and hike the island peaks. Visit Agho, Malangaban, and Bulubadiangan islands. Snorkeling, hiking, and beach camping combo.",
    type: "hiking",
    date: daysFromNow(30),
    location: "Concepcion, Iloilo",
    coordinates: { lat: 11.25, lng: 123.09 },
    max_participants: 15,
    price: 1200,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Five Tersty Trekkers",
    title: "Sicogon Island Beach Run",
    description:
      "A barefoot 10K beach run on the white sands of Sicogon Island, Concepcion. Run along pristine coastline with turquoise waters. Includes boat transfer and beach lunch.",
    type: "running",
    date: daysFromNow(15),
    location: "Sicogon Island, Concepcion, Iloilo",
    coordinates: { lat: 11.34, lng: 123.17 },
    max_participants: 30,
    price: 800,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
    distances: [
      { distance_km: 5, price: 600, max_participants: 15 },
      { distance_km: 10, price: 800, max_participants: 15 },
    ],
  },
  {
    clubName: "Five Tersty Trekkers",
    title: "Dingle Forest Trail Hike",
    description:
      "A shaded forest hike through the hills of Dingle, Iloilo. Cool temperatures, bird sounds, and a hidden spring at the turnaround point.",
    type: "hiking",
    date: daysFromNow(-28),
    location: "Dingle, Iloilo",
    coordinates: { lat: 10.99, lng: 122.66 },
    max_participants: 25,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Five Tersty Trekkers",
    title: "Tigbauan Coastal Trail Run 12K",
    description:
      "A 12K coastal trail run from Tigbauan to Guimbal along rocky shoreline paths and fishing village trails. Ocean spray and sea breeze included!",
    type: "trail_run",
    date: daysFromNow(38),
    location: "Tigbauan, Iloilo",
    coordinates: { lat: 10.67, lng: 122.38 },
    max_participants: 35,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run,
  },
  // ---- Yenergy Outdoors ----
  {
    clubName: "Yenergy Outdoors",
    title: "Alimodian Sunrise Trail Run",
    description:
      "Chase the sunrise on the trails of Alimodian! A 10K morning trail run through rolling hills and open grasslands with views of Mt. Napulak.",
    type: "trail_run",
    date: daysFromNow(9),
    location: "Alimodian, Iloilo",
    coordinates: { lat: 10.82, lng: 122.4 },
    max_participants: 35,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run,
    distances: [
      { distance_km: 5, price: 300, max_participants: 15 },
      { distance_km: 10, price: 400, max_participants: 20 },
    ],
  },
  {
    clubName: "Yenergy Outdoors",
    title: "SM City to Esplanade Fun Run",
    description:
      "A feel-good 5K fun run from SM City Iloilo to the Esplanade and back. Music, energy drinks, and good vibes. Open to all ages and fitness levels.",
    type: "running",
    date: daysFromNow(3),
    location: "Iloilo City",
    coordinates: { lat: 10.713, lng: 122.565 },
    max_participants: 150,
    price: 250,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
    distances: [
      { distance_km: 3, price: 200, max_participants: 80 },
      { distance_km: 5, price: 250, max_participants: 70 },
    ],
  },
  {
    clubName: "Yenergy Outdoors",
    title: "Pototan Highland Hike",
    description:
      "Discover the hidden highlands of Pototan, Iloilo. A moderate day hike through sugarcane fields and forest patches to a scenic overlook.",
    type: "hiking",
    date: daysFromNow(-15),
    location: "Pototan, Iloilo",
    coordinates: { lat: 10.94, lng: 122.63 },
    max_participants: 25,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "Yenergy Outdoors",
    title: "Barotac Viejo Mountain Bike Tour",
    description:
      "A scenic MTB tour through the mountains of Barotac Viejo. Intermediate trails through bamboo forest, river crossings, and hillside farmlands.",
    type: "mtb",
    date: daysFromNow(27),
    location: "Barotac Viejo, Iloilo",
    coordinates: { lat: 10.99, lng: 122.77 },
    max_participants: 20,
    price: 450,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    clubName: "Yenergy Outdoors",
    title: "Mandurriao Fitness Run 5K",
    description:
      "A high-energy 5K run through Mandurriao district and Iloilo Business Park. DJ at the finish line, free energy drinks, and fun activities.",
    type: "running",
    date: daysFromNow(-85),
    location: "Mandurriao, Iloilo City",
    coordinates: { lat: 10.72, lng: 122.56 },
    max_participants: 100,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.running_alt,
  },
  // ---- Rubo-rubo Lang ----
  {
    clubName: "Rubo-rubo Lang",
    title: "Guimbal Lighthouse Walk",
    description:
      "A chill coastal walk from Guimbal town proper to the old lighthouse ruins. Scenic cliffs, tide pools, and a seafood lunch at a local carinderia. Zero rush.",
    type: "hiking",
    date: daysFromNow(11),
    location: "Guimbal, Iloilo",
    coordinates: { lat: 10.66, lng: 122.32 },
    max_participants: 30,
    price: 250,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Rubo-rubo Lang",
    title: "Miag-ao River & Rice Paddy Walk",
    description:
      "Wander through the iconic rice terraces and river trails of Miag-ao. A slow-paced community walk with stops for local snacks and storytelling.",
    type: "hiking",
    date: daysFromNow(19),
    location: "Miag-ao, Iloilo",
    coordinates: { lat: 10.644, lng: 122.234 },
    max_participants: 25,
    price: 200,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "Rubo-rubo Lang",
    title: "San Joaquin Sunset Beach Walk",
    description:
      "A leisurely 5km sunset beach walk along the shores of San Joaquin. Watch the sun set over the Panay Gulf with good company and cold drinks.",
    type: "hiking",
    date: daysFromNow(-5),
    location: "San Joaquin, Iloilo",
    coordinates: { lat: 10.58, lng: 122.18 },
    max_participants: 30,
    price: 150,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Rubo-rubo Lang",
    title: "Cabugao Islet Snorkel & Walk",
    description:
      "Boat to Cabugao Islet near Carles and combine a short island walk with snorkeling in the marine sanctuary. Pure island vibes, no agenda.",
    type: "hiking",
    date: daysFromNow(42),
    location: "Carles, Iloilo",
    coordinates: { lat: 11.57, lng: 123.15 },
    max_participants: 15,
    price: 900,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Rubo-rubo Lang",
    title: "Iloilo Riverside Morning Walk",
    description:
      "A peaceful morning walk along the Iloilo River esplanade. Stop for coffee, watch the boats, and enjoy the sunrise over the city. The most chill event on the calendar.",
    type: "running",
    date: daysFromNow(-32),
    location: "Iloilo City Esplanade",
    coordinates: { lat: 10.695, lng: 122.565 },
    max_participants: 40,
    price: 0,
    status: "completed",
    cover_image_url: COVER_IMAGES.running,
  },
  // ---- More variety across clubs ----
  {
    clubName: "Panay Trail Collective",
    title: "Dumarao Caves Exploration",
    description:
      "Explore the cave systems of Dumarao, Capiz. A unique spelunking and hiking combo through limestone formations and underground rivers.",
    type: "hiking",
    date: daysFromNow(50),
    location: "Dumarao, Capiz",
    coordinates: { lat: 11.27, lng: 122.67 },
    max_participants: 15,
    price: 800,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Roxas City Coastal Ride",
    description:
      "A scenic 60km road ride exploring the coastal roads of Roxas City, Capiz. Flat terrain, fresh seafood stops, and views of the Sibuyan Sea.",
    type: "road_bike",
    date: daysFromNow(35),
    location: "Roxas City, Capiz",
    coordinates: { lat: 11.585, lng: 122.751 },
    max_participants: 35,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.road_bike_alt,
    distances: [
      { distance_km: 30, price: 350, max_participants: 20 },
      { distance_km: 60, price: 500, max_participants: 15 },
    ],
  },
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Hamtic River Gorge Trek",
    description:
      "A thrilling gorge trek through the narrow river valleys of Hamtic, Antique. Waist-deep river crossings, rock scrambling, and jungle canopy. For adventurous hikers only.",
    type: "hiking",
    date: daysFromNow(17),
    location: "Hamtic, Antique",
    coordinates: { lat: 10.7, lng: 121.98 },
    max_participants: 15,
    price: 550,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Five Tersty Trekkers",
    title: "Badiangan Sunrise MTB",
    description:
      "An early morning MTB ride through the quiet roads and trails of Badiangan at sunrise. Gentle terrain, misty mornings, and local coffee at the turnaround.",
    type: "mtb",
    date: daysFromNow(24),
    location: "Badiangan, Iloilo",
    coordinates: { lat: 10.92, lng: 122.55 },
    max_participants: 20,
    price: 300,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb_alt,
  },
  {
    clubName: "Yenergy Outdoors",
    title: "Iloilo Marathon Relay",
    description:
      "Form a team of 4 and relay a full marathon distance across Iloilo City! Each runner covers ~10.5km. Fun, fast, and team-spirited.",
    type: "running",
    date: daysFromNow(48),
    location: "Iloilo City",
    coordinates: { lat: 10.7, lng: 122.56 },
    max_participants: 120,
    price: 600,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
    distances: [
      { distance_km: 10, price: 400, max_participants: 60 },
      { distance_km: 21, label: "Half Marathon", price: 600, max_participants: 40 },
      { distance_km: 42, label: "Marathon", price: 1000, max_participants: 20 },
    ],
  },
  {
    clubName: "Rubo-rubo Lang",
    title: "Sibalom Natural Park Wander",
    description:
      "A leisurely walk through Sibalom Natural Park in Antique. Old-growth forest, rare bird species, and the gentle pace of a rubo-rubo walk.",
    type: "hiking",
    date: daysFromNow(55),
    location: "Sibalom, Antique",
    coordinates: { lat: 10.77, lng: 121.99 },
    max_participants: 20,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  // ---- Mt. Opao events ----
  {
    clubName: "Iloilo Pedal Club",
    title: "Mt. Opao Day Hike",
    description:
      "A scenic day hike up Mt. Opao in Igbaras, Iloilo. Enjoy lush tropical forest, river crossings, and panoramic views of the Iloilo coastline from the summit. Beginner-friendly with local guide included.",
    type: "hiking",
    date: daysFromNow(12),
    location: "Igbaras, Iloilo",
    coordinates: { lat: 10.68, lng: 122.27 },
    max_participants: 30,
    price: 350,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Yenergy Outdoors",
    title: "Mt. Opao Sunrise Trek",
    description:
      "Start before dawn and catch the sunrise from the Mt. Opao summit. The pre-dawn trail through fog-covered forest adds a magical atmosphere. Headlamp required — hot coffee at the top!",
    type: "hiking",
    date: daysFromNow(20),
    location: "Miag-ao, Iloilo",
    coordinates: { lat: 10.67, lng: 122.25 },
    max_participants: 25,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Mt. Opao Trail Run 8K",
    description:
      "A fast 8K trail run from the Igbaras trailhead up Mt. Opao and back. Technical single-track, roots, rocks, and a 400m elevation gain make this a challenging but rewarding race.",
    type: "hiking",
    date: daysFromNow(-20),
    location: "Igbaras, Iloilo",
    coordinates: { lat: 10.68, lng: 122.27 },
    max_participants: 40,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.trail_run,
  },
  // ---- Mt. Lingguhob events ----
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Mt. Lingguhob Summit Hike",
    description:
      "Tackle Mt. Lingguhob in Leon, one of Iloilo's most rewarding mid-altitude hikes. Dense forest gives way to exposed ridgelines with sweeping views of the Panay highlands. Moderate difficulty.",
    type: "hiking",
    date: daysFromNow(18),
    location: "Leon, Iloilo",
    coordinates: { lat: 10.78, lng: 122.35 },
    max_participants: 20,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "Five Tersty Trekkers",
    title: "Mt. Lingguhob Ridge Trail",
    description:
      "A ridge-to-ridge traverse of Mt. Lingguhob's dramatic ridgeline. Exposed sections with 360-degree views, bamboo forest, and a lunch stop at a local spring. For experienced hikers.",
    type: "hiking",
    date: daysFromNow(30),
    location: "Tubungan, Iloilo",
    coordinates: { lat: 10.77, lng: 122.34 },
    max_participants: 15,
    price: 600,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Rubo-rubo Lang",
    title: "Mt. Lingguhob Night Hike",
    description:
      "An after-dark ascent of Mt. Lingguhob under the stars. Headlamps light the trail as you climb through the quiet forest. Summit arrival timed for moonrise — a unique mountain experience.",
    type: "hiking",
    date: daysFromNow(-40),
    location: "Leon, Iloilo",
    coordinates: { lat: 10.78, lng: 122.35 },
    max_participants: 20,
    price: 450,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Mt. Lingguhob Waterfall Loop",
    description:
      "A loop trail combining Mt. Lingguhob's lower slopes with a hidden waterfall in Tubungan. Swim at the falls, then ascend through bamboo groves to a viewpoint overlooking the Jalaur River valley.",
    type: "hiking",
    date: daysFromNow(15),
    location: "Tubungan, Iloilo",
    coordinates: { lat: 10.77, lng: 122.34 },
    max_participants: 25,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Mt. Lingguhob Sunrise Assault",
    description:
      "A pre-dawn push to catch sunrise from the Mt. Lingguhob summit. Depart Leon at 3 AM with headlamps blazing. The reward: golden light spilling over the Panay highlands as far as Guimaras Strait.",
    type: "hiking",
    date: daysFromNow(22),
    location: "Leon, Iloilo",
    coordinates: { lat: 10.78, lng: 122.35 },
    max_participants: 20,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Yenergy Outdoors",
    title: "Mt. Lingguhob Trail Cleanup Hike",
    description:
      "Hike with a purpose! Join a combined summit hike and trail cleanup on Mt. Lingguhob. Bring gloves and a trash bag — we climb, we clean, we protect. Free eco-bag and lunch included.",
    type: "hiking",
    date: daysFromNow(35),
    location: "Leon, Iloilo",
    coordinates: { lat: 10.78, lng: 122.35 },
    max_participants: 30,
    price: 250,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    clubName: "Panay Trail Collective",
    title: "Mt. Lingguhob Full Moon Hike",
    description:
      "A special full-moon edition of the Lingguhob night hike. No headlamps needed — the moonlit trail through open ridgelines is surreal. Hot champorado at the summit. Limited slots.",
    type: "hiking",
    date: daysFromNow(-10),
    location: "Leon, Iloilo",
    coordinates: { lat: 10.78, lng: 122.35 },
    max_participants: 15,
    price: 500,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "Iloilo Pedal Club",
    title: "Mt. Lingguhob Beginner Day Hike",
    description:
      "A beginner-friendly day hike on Mt. Lingguhob's easiest route. Gentle grades, shaded forest, and a scenic lunch spot at the halfway viewpoint. Perfect first mountain for new hikers.",
    type: "hiking",
    date: daysFromNow(-30),
    location: "Tubungan, Iloilo",
    coordinates: { lat: 10.77, lng: 122.34 },
    max_participants: 35,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  // ---- Mt. Igatmon events ----
  {
    clubName: "Panay Trail Collective",
    title: "Mt. Igatmon Expedition",
    description:
      "A challenging expedition to Mt. Igatmon in Barbaza, Antique. Remote trails through old-growth forest, river valley crossings, and a demanding final push to the 900m summit. Two-day itinerary with overnight camp.",
    type: "hiking",
    date: daysFromNow(25),
    location: "Barbaza, Antique",
    coordinates: { lat: 11.2, lng: 122.05 },
    max_participants: 15,
    price: 1800,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    clubName: "JTT (Journey Through Trails)",
    title: "Mt. Igatmon Summit Day Hike",
    description:
      "A single-day push to the summit of Mt. Igatmon for fit hikers. Early start, fast pace, and a stunning payoff — views stretching from Antique's coast to the Panay central range.",
    type: "hiking",
    date: daysFromNow(40),
    location: "Barbaza, Antique",
    coordinates: { lat: 11.2, lng: 122.05 },
    max_participants: 12,
    price: 1200,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    clubName: "Five Tersty Trekkers",
    title: "Mt. Igatmon Traverse",
    description:
      "A point-to-point traverse of Mt. Igatmon, descending via the lesser-known eastern trail into the Barbaza river valley. Technical terrain, river crossings, and jungle bushwhacking.",
    type: "hiking",
    date: daysFromNow(-55),
    location: "Barbaza, Antique",
    coordinates: { lat: 11.2, lng: 122.05 },
    max_participants: 10,
    price: 2000,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  // ---- Free events ----
  {
    clubName: "Panay Trail Collective",
    title: "Iloilo River Esplanade Community Walk",
    description:
      "A free community walk along the Iloilo River Esplanade open to everyone — families, solo walkers, and dogs welcome. Meet new people, enjoy the morning breeze, and kick off your weekend with good vibes. No registration fee, just show up and walk!",
    type: "running",
    date: daysFromNow(7),
    location: "Iloilo River Esplanade, Iloilo City",
    coordinates: { lat: 10.695, lng: 122.565 },
    max_participants: 100,
    price: 0,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
  },
  {
    clubName: "Yenergy Outdoors",
    title: "Jaro Plaza Yoga & Stretch Session",
    description:
      "Start your Sunday right with a free outdoor yoga and stretching session at Jaro Plaza. Suitable for all fitness levels — bring a mat or towel and join the community for an hour of mindful movement under the trees.",
    type: "running",
    date: daysFromNow(10),
    location: "Jaro Plaza, Iloilo City",
    coordinates: { lat: 10.72, lng: 122.57 },
    max_participants: 50,
    price: 0,
    status: "published",
    cover_image_url: COVER_IMAGES.running_alt,
  },
];

// ---------------------------------------------------------------------------
// Event Route Definitions — real routes based on famous Iloilo/Panay routes
// Waypoints follow actual roads and trails for realistic map display.
// ---------------------------------------------------------------------------

interface EventRouteDef {
  eventTitle: string;
  name: string;
  distanceKm: number;
  elevationGain: number; // meters
  /** Pre-computed polyline from OSRM routing (road routes). Takes priority over waypoints. */
  osrmPolyline?: string;
  waypoints: [number, number][]; // [lat, lng] tuples — fallback for trail routes
}

const EVENT_ROUTE_DEFS: EventRouteDef[] = [
  // 1. Iloilo Esplanade Loop — the iconic riverside boardwalk + city loop (~11km)
  //    Famous running route along the Iloilo River Esplanade through Molo and Mandurriao
  //    OSRM polyline follows actual road network
  {
    eventTitle: "Iloilo Esplanade Night Run 10K",
    name: "Iloilo Esplanade Loop",
    distanceKm: 11,
    elevationGain: 25,
    osrmPolyline:
      "ckg`AogbkVgAAa@@aB?[A@JNbFY?}@?AM?OA}@@lA@LkA@{A@yB@]?wA@K?KA[@y@?@L?@L|@^bB@@@?bA@R@@?`@jBY?qA?eHEY??F?DJdBDn@Fp@G?m@?aG@nHAF?@DHlABVQ?a@?}GCkAAkA?mCAU?Y@C[AIGy@AOF?DAPADBBHB^BBD@jCQDr@@J@PmCAU?Y@I@K@D^B`@Fx@Fz@@BF`A?LFdADh@VpCFp@Dd@?@JhAcALc@FgHjAA@k@XQWQUmAkBu@sASYs@o@UWy@q@aBmAGEICA?iA]i@U}BqAkAq@y@|Ag@t@WPq@b@kCtAkFnCL^L\\[SGAE?ABKRKRKRKVKHKDa@JqBf@MFULQJEBMDMF_BjAUZOXWZWT[TQDMXMVe@x@OXGZKf@G\\Kf@GVMZUZQLIBq@y@p@s@PUZ_@[^QTq@r@p@x@QDO?y@@u@@k@?KBWBQDSHe@Vk@d@BBBBf@j@FD|@x@NPXZv@r@JNNZDLLb@n@JfBX`@oBb@sCf@sCDQ\\qB^wBDQDIFAXK^\\d@TJBJ?N?H?H@l@n@JBJAr@]??s@\\K@KCm@o@IAI?O?K?KCe@U_@]YJG@EHEP_@vB]pBEPg@rCc@rCa@nBGb@WtAMr@UtAc@~BE@C?YF[GeAMEZUhAIh@I`@CNERiBWkBWyAMsAGq@AK?i@@e@@{@@K?YB@ZZCH?\\AnA?tAA@?lAFB@z@Dd@DnBZxATn@JtAV`C`@LBlAR~AXr@JjANVBBR@JC`@Gb@GJa@v@KXGROhA?J@NBJDL^~@HTd@lAXl@Zh@`@h@DFiCvBMRiAtAc@d@}@~@YLXM`BeBhAuALShCwBVZ^`@TPJFNFPDRDR@L?LAVKl@[p@a@xAw@xAy@FHJDJ@JAJCHEVVXVTT`@\\vAlA`@^HNr@rAj@x@b@n@Z`@LPDFNRNRV^FHv@dARVNRBBV^^f@r@z@jBvBBF?FAB[Re@TWNk@V_Ad@kBr@e@Ps@VIDI@_BXYDaAPg@JI@QDGGCCUMk@[k@WuAg@aAYIC_@I_@IAS?KAKMg@Oi@SYOMWIe@Ii@M{Bs@eBk@MGHK^c@FExAh@jGzBvEbBt@VRFPFNDL@`B@PB\\Ln@TTJh@v@DJFRHAHEr@Wd@QjBs@~@e@j@WVOd@UZS@C?GCGFK^{@b@w@^u@LU~A~@RN`@Ba@CSOYQeAm@MT_@t@c@v@_@z@GJBF?FXDN@F@VBTBPBv@Nd@HfBf@|@Xn@ZHDPHXNHDB@FDv@b@BBTLLFLJJJHLJJJFHBF@tERR?NALCRMHEzDkAtCwATMNIXQVOJIh@YBEJG`@Uh@]TQTWJM{@yAe@eAAEg@eAO]s@}Ay@gBIQKSSg@O[]q@cAn@??bAo@CGy@aBIOaBeDo@kAGKEKQe@GQr@i@|Aw@zAs@nB{@z@i@rAq@rAi@DdADh@Bd@?L@JRvEVjFbA@HAZa@^w@l@SHAPBNEvAm@t@dAf@n@d@^l@l@TT`@^p@p@b@b@LM\\e@b@s@Zy@JUVw@DMBM?Q?OC_@Kk@bAE`@?RBHBjAXj@NlFpAzA_C`@k@@E?EAEGEi@_@s@e@??r@d@h@^FD@D?DADa@j@{A~BmFqAk@OkAYICSCa@?cADEWYeBIg@Gi@Au@?kDAk@AWCo@OeFCmACu@GcBE_@Ia@AE]qAO]EGKSGKJErCmAd@SDCd@URK\\MFAj@AP?jB?FAFADCN?Z?B?hAAd@?AvA@jA?f@BNLDzB?LApAC??qABAO@}BCy@CGKGKCOA@k@?OBaG\\c@f@AXoD@a@??CYGIIGSCG?oB?sA@}@CO@?|AAxA?V@vA?r@?jD?|AC?[?O?ECE?IA_CAo@?E?G@[L]N_@P{DbBKD}AoBYa@QQESAI@MTkAL}@??XoBBYHq@Fk@@OBSDSDS@UFWrBuN@MDWHg@b@iCPyAjBRvALVaCl@oF{@IAAC?qBSDU@W?MCs@?QAc@J?L?LAPIFAXET@l@D??m@EUAYDG@QHM@M?K?I}A?YASGaBEiAG_B?IKsDAMCMCM@A@C@A?C?CAA?CCAAAC?C?C?A@A?AB_@Lg@?",
    waypoints: [
      [10.6925, 122.569],
      [10.6925, 122.569],
    ],
  },

  // 2. Iloilo–Miag-ao Coastal Road — the most popular cycling route in Iloilo (~55km one way)
  //    Follows the national highway along the scenic southern Iloilo coast
  //    OSRM polyline follows actual road network (one-way, displayed as 110km out-and-back)
  {
    eventTitle: "Iloilo-Antique Coastal Road Ride",
    name: "Iloilo–Miag-ao Coastal Road",
    distanceKm: 110,
    elevationGain: 650,
    osrmPolyline:
      "ggh`AqiakVuB?H|A@B?HHfA@P@FHbA@J@LVbDBb@@\\Db@XhEB\\FbBFpAD~@@\\@H@n@FdA@`@Bf@@L?@T`F@LFpA@J?PHtA?P@L@RDjA@RM@aERG?kEXU@IBSD]Jk@NYHSD[DI@G@SBB\\?HDn@J|A@JBZFz@Db@@DBFB^@VHfADz@@J@VF|@L`C@FTbDDz@BP?R@P^~DBPBXHt@DZDf@@P@BFn@Hx@DT@DLz@VbBBL\\fAj@zA^z@d@hAFJ\\t@R`@N\\JTHRRb@FRBDFLDLHPj@tAZj@NXFLbAjBd@z@^r@~AfD~AzCbA~ApDhG`@r@r@jAh@|@v@rAWNSRqBhAOFUJQHaAjAc@Vn@dAHPDHDDFBBH?H@JBVBNFNDHHLDJMXGPEd@@LBJ@HF@JFp@r@oB|AA@?B?Bj@bA^x@??DBB?B?hCqB{@_Au@w@q@s@KGGAAICKAMDe@FQLYEKIMEIGOCOCWAK?ICIGCEEEIIQo@eAb@W`AkAPITKNGpBiAVKXOJPPXT\\\\h@v@nAr@xAdA`Cz@pB`AjD\\hAl@nBNb@J`@v@pBTl@DH@BFPh@rAZt@L`@JVn@pBHXJb@Nx@D\\TpBF~@?FATAHEf@LBPLv@dGDt@PnAt@hFBPh@bEJxAB`@Bd@?@Fx@XdFDj@Fx@Bn@@VB^`@`HPtDLFbGo@l@EtCMh@CF?dAEdBIdDOb@Cj@Ad@CH?xCS~@E`BI|@E@`@DlC@l@?Z@rD@p@@rAHjFJzE?zA@tC?TDdBB`AHrBHfEBrA@f@@jA?\\?LBfCDfC?z@@jBAfAAPCjAARI`CAJEd@Kz@MpAI`AKfAMpAE`@W~BO~@YdC?F_@jBK`@GRUn@Up@O^i@rA_@~@Ul@_ArB]x@S`@_@z@w@pBGRe@tAu@tBUh@}@vBYr@ADuAnDaA|BOGeFyAi@SeA_@_Cy@KG_@]}AkAgBzD}AjFn@\\h@X`@Tj@\\_AdBi@~@k@[c@WYOIGDI~A}Co@]iBfGOd@Kb@CFW|@]dAcBzFW|@a@xAoB|FeB`GaE~NSp@Qh@IVyAtEfAd@hAf@HH?XOv@Mj@IXCNARDDJFJFTHh@R~Al@\\LTFNHFL@N?XAn@AHE`AAZIfFChAA\\GlBCnF?~@?VB`CAnA?x@BdA?B@\\@z@Bn@@JD`A@\\Bf@@ZBfBB^@PBv@HhAHbDBf@DjBB^@`@Br@FhADf@?VBfAHnA?fABj@PrH@l@FxE@Z?~A@r@CdBAVCv@AhA?h@?\\D\\BRL|@DXN`Ab@tDVnC^zEFXFVFXFLnAfEFTZ`B@LBN@\\FlBDpBDr@LbATdAb@bBFR@DLf@R`AJv@ZtCt@Kz@QnA]PCr@Cp@C??q@Bs@BQBoA\\{@Pu@JD\\DXr@vGPnAZvAJl@b@lCXzA|@xEZnBj@hD`@xBNf@XdA^rA~DvNV`ARr@tBvHT`AJ~@BfA@vD?vB?~@@^@jB@rB?p@BhADz@PbA`BbHTx@Vz@`CpIFPDPFh@@R?`@AfI?tA@`H?f@AhDAx@@|JJxAbBbOh@rED`@T~AZjAHTf@xAlA~BdCtEdA`Cl@bB@BZbBRbAt@pEPdAd@lBh@bBx@dBbApBJRjBtDrBsBhEqC??iEpCsBrBt@vAj@dAZj@rB~DXj@hBlDhA~BZh@h@vAnA|Cp@fBZfAv@bDNz@Hb@l@hD|@fGD^P|BDt@DnAFrAHzBDv@@b@LbC@~@@P?F@fD?^?fA@l@@dABbA?PAdEA|CAdCGlBIfAEtAAZA^?LA\\GlAC`@Ip@AJm@jGaAbKKhA]~CIh@ABMt@{@`Fk@bDj@p@tA`BjBpBXZDD|@Id@Cb@@L@bAHTBz@FP@T?VCzAYrASDd@Fb@AF??CD]PIF}CvC]_@g@k@IH{@x@cAaAmC{CEEY[eEjE|@~@b@h@JLHPFPDTBRLdAFbAJbCDhB@fHBrAAV@P@PBNDNDNFRTh@|AhE^|@^|@LXFRd@zAZ`A@BTp@bAvDH\\DRLl@Hh@Jh@t@dHLlA?@Dd@B`@B\\?l@AnAk@`LU~FAj@@b@@f@@v@@VFt@HlADx@@N@FDr@Bd@@x@?R?^CdAIpBALYzFq@rPE`@G^G^wA~Ek@jBM`@GVCNCXAd@CfBGfAGvACpB@n@?D?n@RlLFtDB`@B^F`@H^H`@l@zB@Hj@rBFVDHL^L`@L\\L^|ArFdArEF\\H\\HZFZJ\\HZLZLXNVLVNVV`@~DpGP\\PXRVpCtD|@jALRTZJRJTFRDRBHFZD\\@Nj@lF?^RbBNfAVpA\\|APx@n@xCLr@FRRj@NTpC`CvAjAf@`@JJtApAtBhBdA|@v@l@f@d@~@fAZ\\DHBHNJPNz@jAlCnDBD@?b@p@r@hAz@[nDoAl@UtAi@fEaBHCt@YxB}@jAc@Qk@EO??DNPj@kAb@yB|@u@XIBgE`BuAh@m@ToDnA{@ZeD~@aFrAe@LSFODFTjGtPVd@R`@TT@DTl@HPN`@Jd@Bf@Ch@G`@IRCHUZMJqC|Au@d@cC|AUXKXA^BPDRj@rBDT^vAFTHPJRNNLPNNjHlH`A`A@BJH|@`AJJhAlA|DtERTNTNVLVJXJVJXHXHZF\\FZDZDXBXD\\B`@Bd@Bd@@f@@~@CpA]`GGf@Gf@If@g@pDgA~HE^E\\E^AZAZCv@InAC`@C`@u@zJC`@A`@C`@?^??Ad@Ab@AjAGhCCb@Eb@Ed@?@E`@Gd@CLCTuA`L?JAJCVATCREd@CNEb@Eb@APCb@?\\G~AAd@AZOfCCvB?BCp@AZ?\\AZFtF?`@?`@A`@?`@?`@?^?^?\\@Z@ZBPTtD?n@Id@Kf@eAzEEPMj@Ox@Cl@BnA?v@@nC@j@Ej@[~B_@fCSv@CTCV?Z?`@?^BLH`@hA|CL^L`@N\\Nd@Tp@Xz@^fANd@Tr@Vt@HTHRDRFZBZ@d@@PBXBVD\\FXHVFRJRNZNXV`@V`@RTLPVVXTXRdDdC`@VPRh@n@Rj@Tr@VhBV|BNhBV`BvAfHNl@Ld@Ld@Lb@JZP`@PZP^PXHTj@hAx@rAt@rA|BjEL^JVFPDNL^bA|C~@nCNb@NXT^PXRVTZVX^XZXRPZTVRXPVNd@Pd@NpEbAZFd@LnCl@v@RRF\\Jl@T|DtAh@Tf@Pb@PZLTLXPRLTRPXNXN`@NVNXP\\PZNZNVRPTPTLPHNFHBJDP@ZBXDLBH?XBTBVBXDPFNDB@TJPLRPNNLXHPHJDRHTFLFPLZJZL\\RbA\\fDF^D\\FXFZFVDXD`@BXB^?\\E`@C\\CHANEPGXGRGRKTKTOTQXSZyAxBcA~Ao@`Ay@nAoAnBg@Ga@MWEWBSH_@RWNSFWAWGoA]sBs@EAo@Sa@U[SWWmBwBoAwAZe@zA{Ah@i@l@m@t@y@j@s@j@e@^?RNx@?jAIb@Ix@Ub@eC[aA^gBo@eDPBLIH]Pk@NUd@q@Z_@NMP?LF\\Rf@ZDDJLQ`@[^YX??XYZ_@Pa@KMEEg@[]SMGQ?OL[^e@p@OTQj@I\\MHQCn@dD_@fBZ`Ac@dCy@Tc@HkAHy@?SO_@?k@d@k@r@u@x@m@l@i@h@{AzA[d@nAvAlBvBVVZR`@Tn@RD@rBr@nA\\VFV@RGVO^SRIVCVD`@LT^OT}@vAOVq@~@o@bA[f@QZORORMRENIREPCNEVANTA^@R@XDVHXFTBFLXNV\\h@xBdDBNp@hAr@fAjAhBv@lAhAhB|@vAz@pAFRV\\v@dAJPJLRVHLJPFTDJ?J@`@@l@Bj@LxDBj@BT@PJp@D^ZzAV`AiAXc@LYFa@H_@Hu@NUBW?_@?_@CK?[A_@@g@Fo@JWD_B\\OB",
    waypoints: [
      [10.697, 122.564],
      [10.644, 122.234],
    ],
  },

  // 3. Bucari Pine Forest Trail — highland trail in Leon at ~900m elevation (~12km)
  //    Famous trail running route through Benguet pine forests, cool climate
  {
    eventTitle: "Bucari Pine Forest Trail Run",
    name: "Bucari Pine Forest Trail",
    distanceKm: 12,
    elevationGain: 450,
    waypoints: [
      [10.783, 122.367], // Start: Bucari tourism area
      [10.786, 122.365], // Trail heads north
      [10.789, 122.362], // Into pine forest
      [10.792, 122.358], // Climbing through pines
      [10.795, 122.354], // Ridge section
      [10.798, 122.351], // Highland viewpoint
      [10.8, 122.347], // North end of pine forest
      [10.802, 122.344], // Turning east along ridge
      [10.8, 122.34], // Eastern ridge
      [10.797, 122.338], // Descending
      [10.794, 122.34], // Through farmland
      [10.791, 122.343], // Cutting south
      [10.788, 122.346], // Through lower pine area
      [10.785, 122.35], // Trail curves back west
      [10.783, 122.354], // Crossing stream
      [10.781, 122.358], // South section
      [10.78, 122.362], // Heading back to start
      [10.781, 122.365], // Final approach
      [10.783, 122.367], // Back to Bucari
    ],
  },

  // 4. Mt. Napulak Trail via Igbaras — famous day hike, "hiking capital of Iloilo" (~9km)
  //    Out-and-back trail to Mt. Napulak summit (1,200m) through tropical forest
  {
    eventTitle: "Igbaras Mountain Day Hike",
    name: "Mt. Napulak Trail via Igbaras",
    distanceKm: 9,
    elevationGain: 750,
    waypoints: [
      [10.72, 122.27], // Start: Igbaras trailhead
      [10.718, 122.268], // Initial trail through barangay
      [10.716, 122.265], // Entering forest
      [10.714, 122.262], // Climbing through canopy
      [10.712, 122.258], // Steep section
      [10.71, 122.255], // Ridge approach
      [10.708, 122.252], // Along ridge
      [10.706, 122.25], // Near summit area
      [10.705, 122.248], // Summit viewpoint — turnaround
      [10.706, 122.25], // Return: descending ridge
      [10.708, 122.252], // Along ridge
      [10.71, 122.255], // Steep descent
      [10.712, 122.258], // Through forest
      [10.714, 122.262], // Lower forest
      [10.716, 122.265], // Exiting forest
      [10.718, 122.268], // Through barangay
      [10.72, 122.27], // Back to trailhead
    ],
  },

  // 5. Guimaras Island Loop — popular weekend cycling loop across the strait (~40km)
  //    Riders take the pump boat from Iloilo to Jordan wharf, then loop the island
  //    OSRM polyline follows actual road network
  {
    eventTitle: "Guimaras Island MTB Adventure",
    name: "Guimaras Island Loop",
    distanceKm: 40,
    elevationGain: 380,
    osrmPolyline:
      "k_r_A}kekVq@l@O@q@Ww@Ya@BqB_AOIs@VkAj@_@Zc@`Am@[oA|B_EnHu@qA}@{AKKQSQOiDuAe@SgDaB_@WyFmCwE{BmAe@wAi@mDqAm@Uo@UuCgAy@Ua@I?C?CCACAJo@`@oAr@w@LO`@c@n@e@|CwBrDgCjBsAlA{@JIfBsAtBmB|@{@~@nAjBfCv@dAtDiD??uDhDw@eAkBgC_AoAwBoCg@OkC?XqAdBsEpAgDT}AZ{EAi@ASUm@oDiE_@wAq@qDiJcB_KiDM[CYCkBBjBBXLZ~JhDrGjAtAVm@kDwBsJy@sCyCsG{@wCg@sCMs@Q]k@[iAq@sAsBi@{@CQ@_@JYw@cBAK@ENCOB??AD@Jv@bBKXA^eAt@cA\\c@@s@Ii@U[g@g@_@qAsAq@w@m@So@MY?q@NY?YIiAc@eA{@cCeByAeAES@UFc@RmAZgBF}@Aw@Yy@]qACKQq@M_@IKMGcA_@]YGWGgB@qABa@PQDIDUBW?]?S@YL]DQFYAc@Lc@VYVw@Ng@BWHkB?YAm@@sA[k@]SWKs@w@r@v@VJ\\RZj@ArA@fAIjBCVOf@Wv@WXMb@@b@GXEPM\\AX?R?\\CVETEHQPC`@ApAFfBFV\\XbA^LFHJL^Pp@BJ\\pAXx@@v@G|@[fBSlAGb@ATDRxAdAbCdBdAz@hAb@XHX?p@OX?n@Ll@Rp@v@pArAf@^Zf@h@Tr@Hb@AbA]dAu@@_@JYl@kBTq@JkAFSHMjAu@d@Un@IXQPc@VyAXwBBi@Qo@sCqDeCqCSiAU}BFYPWn@q@\\s@Be@C_@S]KM]GYG]EaAGe@W_@m@?e@Ha@t@cBX}@Fk@DkBNg@NMpAW`Be@|AgAZ]vB{Dn@}A?k@@m@@aOC_DMi@YaA]W{AeCm@q@{@_@wA[cAOuAG_BK}@QSCUDg@`@[Du@IiBc@ICQ@kAX}Ad@U@w@OiAQeCOaBOIAwAi@{CkBaDuBiAu@kBgA_@UkE{CuAeAa@u@Wo@o@}Ao@mAYe@OKi@I_@U{@a@_@GWI_AiA[a@{@NaAPkAPg@NUb@S`@c@d@q@h@k@h@[Zc@h@[h@]l@e@b@ODQTK^Ed@I~@Mr@Dn@Fv@Gr@?`@HXPZNd@?b@Ij@?`@?`@CTOBM?_@GKFEPDZJR\\XRVBN]Z]`@[NU\\Qp@?f@Wb@]`@EHc@KCICE_@k@c@c@_@[c@w@[Wa@U]a@m@]c@Ua@W_@YSe@Yc@QYEYDUFUAO@NGTETDXPXXb@Rd@^X`@Vb@Tl@\\\\`@`@TZVb@v@^Zb@b@^j@BDBHb@JDI\\a@Vc@?g@Pq@T]ZO\\a@\\[COSW]YKSE[DQJG^FL?NCBU?a@?a@Hk@?c@Oe@Q[IY?a@Fs@Gw@Eo@Ls@H{@?CDe@J_@PUNEd@c@\\m@Zi@b@i@Z[j@i@p@i@b@e@Ra@Tc@f@OjAQ`AQz@Oe@o@c@g@k@c@c@Oo@Ho@Jm@Ho@HIP]d@]d@e@d@]b@_@d@]`@]b@c@l@W\\EJQXKPMJUFWBYJq@Ve@Na@Lc@H[H]NYPu@Du@Dg@Bc@Cg@Oq@Wg@O]G_@Em@Es@As@De@De@DOH??MHQZKZEd@Af@?ZETWRUNMLGDa@XQDOLETA`@EZ?XJf@^f@^r@HLSZk@Fi@YMSiADk@PSLUP]l@@jANdAQV}@HiBD{@BQm@Ok@i@y@]c@Ws@gBqAgBs@mAWo@Mg@My@_@wA_@iBGWHm@n@c@t@s@hAo@nAg@\\qAVeALu@b@sB|@s@HeAfDgCvDkDdGeEhC}BF{@B}IhA_Dl@_D~Ai@`@[p@Wf@[r@o@l@yCtBcB~BkCoBmBiAlBhAjCnBbB_CxCuBn@m@Zs@Vg@Zq@h@a@~C_B~Cm@|IiAz@C|BGdEiCjDeGfCwDdAgDr@IrB}@t@c@dAMpAWf@]n@oAr@iAb@u@l@o@VIhBFvA^??x@^f@Ln@LlAVfBr@fBpAVr@\\b@h@x@Nj@Pl@Dd@?p@Af@y@TWpAMdCAr@Ev@@h@`@pBLx@Lj@Bv@Ap@On@EPKj@g@lBW|@YjA?h@AJCn@UfA[r@YdAUt@G\\U`AY`AQd@]x@K^Kf@Id@K\\MZMXiAzBKPcAnBqExIoA|BOz@E~@Il@Od@Wf@i@p@]b@m@rAM`@Un@[l@GN{@fAqAxAmAx@aAR]b@a@xA[fBe@rA[l@g@v@UbAQ^_@h@c@z@W\\Q~FF~@lD~GPx@B`MF`@b@x@tLdLv@ThHxBjDpBdCxAhB}En@c@~BgB`BmArAgALi@TmC~@}C|@gCH_@?SQa@Eq@n@kDvAwDxAsBzAqB`Am@`@]^]pAuA^SNGbAc@r@IbACpAM`@Of@q@Tw@LaAHk@Zo@xAcBRg@Lq@EeA@s@NYZa@vAgB~BeDT}@r@oE\\oB?q@Ms@F_A@u@?i@Fo@XaBDg@GWUQk@IIK??JIf@MXEZDf@RVDd@KRWj@oA^_ABw@@_@Fc@AgA@m@Jc@BM~AcDPULEL@JF`@`@zKtFrHbOBh@nDfC|@i@jFc@VMRQ^c@TMVCh@H\\XbA^LFHJL^Pp@BJ\\pAXx@@v@G|@[fBSlAGb@ATDRxAdAbCdBdAz@hAb@XHX?p@OX?n@Ll@Rp@v@pArAf@^Zf@h@Tr@Hb@AbA]dAu@BPh@z@rArBhAp@j@ZP\\Lr@f@rCz@vCxCrGx@rCvBrJl@jDp@pD^vAnDhETl@@R@h@[zEU|AqAfDeBrEYpA@~AL|HKHmAz@kBrAsDfC}CvBo@d@a@b@MNs@v@a@nAKn@C?A@cCOQ?uAEwBCm@?_@Ao@AwCEcCCkDCyC?iFMm@DcBAmAAm@C{@C]Aw@Ce@CqMa@eBM}BUyA_@iDeBiCqA{A{@{BoAmCuAqCoAjCqKbAuDd@}@NeAF]J[`@y@\\e@\\o@To@FcAEsALeBFW?c@AWGQwAoBWWg@_AGSAOB{@GSc@[UW]Y]G_AIMGUSK[E]Oe@CO@S^yAh@uAZoA\\s@RCNOHo@X{@DaAFi@n@{AJi@D_AHe@R]nCiCl@aA??m@`AoChCS\\Id@E~@Kh@o@zAGh@E`AYz@In@ONSB]r@[nAi@tA_@xAARBNNd@D\\JZTRLF~@H\\F\\XTVb@ZFRCz@@NFRf@~@VVvAnBFP@V?b@GVMdBDrAGbAUn@]n@]d@a@x@KZG\\OdAe@|@cAtDkCpKpCnAlCtAzBnAzAz@hCpAhDdBxA^|BTdBLpM`@d@Bv@B\\@z@Bl@BlA@bB@r@FjBHfBDN?vCB~B@j@@n@@fA@lABtABlABn@?|A?pBBv@@xAD@BBBB?B?@A@C?C?CCACAJo@`@oAr@w@LO`@c@n@e@|CwBrDgCjBsAlA{@JIM}HA_BXqAdBsEpAgDT}AZ{EAi@ASUm@oDiE_@wAq@qDiJcB_KiDM[kBSKD[jAKNyFo@sB[??GIB]C\\FHrBZxFn@JOZkAJEjBRLZ~JhDhJbBp@pD^vAnDhETl@@R@h@[zEU|AqAfDeBrEYpA@~AxBENF`BxBvF|Hx@bA_A|@}@v@yAxASS_DbCq@EcAhCaAzCgAfDlAd@vEzBxFlC^VfD`Bd@RhDtAPNPRJJ|@zAt@pAzDnHR^|B`EnA|Bf@|@|@z@`Af@hD~@nAXj@LfDt@~BPl@Bb@wARkAViBLgAEu@L{@bAs@jAWnAeA`Ag@p@e@bBPjAL??PgAn@a@~@j@tB|@z@`@Jp@\\r@dAxDeAyD]s@Kq@{@a@uB}@_Ak@o@`@QfAkAMcBQq@d@aAf@oAdAkAVcAr@Mz@Dt@MfAWhBSjAc@vAtG`@RDnCb@tKdDl@P`@PxD|AlMzF|Ar@bAb@hBv@p@XZ@`@Ev@IxB_@~HyAhKSt@Dv@PrCnA`Ad@x@j@b@v@j@pFv@tHl@pDnEpQd@lBXt@`AdAdBzArAn@v@PlCVjAJzAb@lGhEdCrA`A`@JDvQvHZm@|BwBt@q@^oA|AiDd@}@XwALs@d@gCVkBh@cAz@kATm@aAoA{@y@z@x@`AnAUl@{@jAi@bAWjBe@fCg@jCe@|@}AhD_@nAu@p@}BvB[l@wQwHKEmApEwAnCeGvJm@t@Sj@YpB?@Ox@S\\OROV?XFRPXXHRAj@MR@NZHfAEfA?r@Er@Lh@Zj@ThAHxAb@bCMr@If@[r@[X_@XMVEVRf@XfA@z@R\\VF\\Kl@M^@PLHP@XAz@h@v@V\\h@f@r@f@Xx@^\\yA?sBYoA@gDo@oGRoAMuAf@iBi@cDiBQi@[q@u@qAQk@cBgC_@cA}AeAyAi@u@q@kByBmBSsD[gAw@]Y{@u@xAnAfAv@rDZlBRjBxBt@p@xAh@|AdA^bAbBfCPj@t@pAZp@Ph@bDhBhBh@tAg@nALnGSfDn@nAArBXxA?n@f@Zv@d@RpD|@Vx@P|AHd@n@`D`@jDJ`BAjBG`BGd@KJqAJ_ADWCq@]g@]}@IiAo@a@_@aAUq@CcB@YHeAf@m@b@Ob@QrAYV]?cAIy@C{AJoBVg@N_@^eAjAw@r@c@NmBAcCHiBEu@Pa@TYh@o@pB_@b@}AgAkDkBqDcB}@m@y@i@kBm@yCu@_Dq@mDwA{EoAyEwAmFeB}DeBsAq@k@i@k@}@g@o@m@g@g@a@cB{@aAo@aA}@gAcB_@{@s@}BO_@KU}BmCyB{BwAgCu@yAq@}Ba@sAcAwA}AaBVIz@Mn@]j@]\\Cj@Hb@T~@PzAJ|@Et@WZ_@Km@AUPWPLn@l@f@MRSd@y@HaA?a@@Y@yAHc@Vk@hAGdAAf@]Lk@Dc@?c@?aAKe@Y_@We@KUOc@I[?KAm@Ag@@YE_@OOGIxBH`@Jl@b@LRBHN~@Nl@^hA\\pAB\\CtAGfA?`@Fn@fAjBr@l@VZFNTbARh@JNLFMGKOSi@UcAGOW[s@m@gAkBGo@?a@FgABuAC]]qACI[_AOm@O_ACIMSm@c@a@KyBIGIoAm@m@_@Qa@ESQ}@Q[KIu@_@_@Ss@e@YM{@cBGe@ZiBNqCxAgEMmB`@oA|Ai@d@e@|@{AQ{@Dy@??\\S`@VPz@rAr@~@p@`AAv@Sb@[Dg@Y{@]mA?cA|AgEbAsArAoAr@cA`DcGdCsF~CyF}As@mM{FyD}Aa@Qm@QuKeDoCc@SEuGa@m@C_CQgDu@AHKZ?HMFSBOECMVu@oAYiD_AaAg@}@{@g@}@oA}B}BaES_@{DoH~DoHnA}B`CkEnBdANHpB~@`@Cv@Xp@VNAp@m@",
    waypoints: [
      [10.583, 122.585],
      [10.583, 122.585],
    ],
  },

  // 6. Mt. Opao Trail — day hike through tropical forest near Igbaras (~6km, 400m gain)
  {
    eventTitle: "Mt. Opao Day Hike",
    name: "Mt. Opao Trail",
    distanceKm: 6,
    elevationGain: 400,
    waypoints: [
      [10.685, 122.275], // Start: Igbaras jump-off
      [10.683, 122.273], // Trail enters forest
      [10.681, 122.27], // River crossing
      [10.679, 122.267], // Climbing through canopy
      [10.677, 122.264], // Steep ascent
      [10.675, 122.261], // Ridge approach
      [10.673, 122.258], // Exposed ridge
      [10.671, 122.256], // Near summit
      [10.67, 122.254], // Mt. Opao summit — turnaround
      [10.671, 122.256], // Return: descending ridge
      [10.673, 122.258], // Along ridge
      [10.675, 122.261], // Steep descent
      [10.677, 122.264], // Through forest
      [10.679, 122.267], // Lower forest
      [10.681, 122.27], // River crossing
      [10.683, 122.273], // Exiting forest
      [10.685, 122.275], // Back to jump-off
    ],
  },

  // 7. Mt. Lingguhob Trail — ridge hike in Leon/Tubungan (~8km, 500m gain)
  {
    eventTitle: "Mt. Lingguhob Summit Hike",
    name: "Mt. Lingguhob Trail",
    distanceKm: 8,
    elevationGain: 500,
    waypoints: [
      [10.785, 122.355], // Start: Leon trailhead
      [10.783, 122.352], // Through farmland
      [10.781, 122.349], // Entering bamboo forest
      [10.779, 122.346], // Climbing through forest
      [10.777, 122.343], // Steep section
      [10.775, 122.34], // Ridge start
      [10.773, 122.337], // Along ridgeline
      [10.771, 122.334], // Exposed ridge with views
      [10.769, 122.331], // Final push
      [10.768, 122.329], // Mt. Lingguhob summit — turnaround
      [10.769, 122.331], // Return: descending
      [10.771, 122.334], // Along ridge
      [10.773, 122.337], // Ridge descent
      [10.775, 122.34], // Through forest
      [10.777, 122.343], // Lower forest
      [10.779, 122.346], // Farmland
      [10.781, 122.349], // Exiting trail
      [10.783, 122.352], // Final stretch
      [10.785, 122.355], // Back to trailhead
    ],
  },

  // 8. Mt. Igatmon Trail — expedition route in Barbaza, Antique (~10km, 650m gain)
  {
    eventTitle: "Mt. Igatmon Expedition",
    name: "Mt. Igatmon Trail",
    distanceKm: 10,
    elevationGain: 650,
    waypoints: [
      [11.205, 122.055], // Start: Barbaza jump-off
      [11.203, 122.052], // Trail enters river valley
      [11.201, 122.049], // River crossing
      [11.199, 122.046], // Through old-growth forest
      [11.197, 122.043], // Climbing steeply
      [11.195, 122.04], // Rocky section
      [11.193, 122.037], // Forest canopy thickens
      [11.191, 122.034], // Ridge approach
      [11.189, 122.031], // Exposed ridge
      [11.187, 122.028], // Final ascent
      [11.186, 122.026], // Mt. Igatmon summit — turnaround
      [11.187, 122.028], // Return: descending
      [11.189, 122.031], // Along ridge
      [11.191, 122.034], // Back into forest
      [11.193, 122.037], // Rocky descent
      [11.195, 122.04], // Through forest
      [11.197, 122.043], // Lower canopy
      [11.199, 122.046], // River valley
      [11.201, 122.049], // River crossing
      [11.203, 122.052], // Final stretch
      [11.205, 122.055], // Back to jump-off
    ],
  },
];

// ---------------------------------------------------------------------------
// Test Guides
// ---------------------------------------------------------------------------

interface TestGuide {
  full_name: string;
  bio: string;
  contact_number: string;
  createdByEmail: string;
}

const TEST_GUIDES: TestGuide[] = [
  {
    full_name: "Rodrigo 'Tatay Rod' Espinosa",
    bio: "Local mountain guide from Culasi, Antique. 20+ years leading treks to Mt. Madja-as summit. Knows every trail, every plant, every bird call in the Madja-as range.",
    contact_number: "09171234567",
    createdByEmail: `organizer1${TEST_EMAIL_DOMAIN}`,
  },
  {
    full_name: "Lorna 'Nanay Lorna' Delos Santos",
    bio: "Community guide from Igbaras, Iloilo. Born and raised in Brgy. Passi at the foot of the mountains. Leads day hikes and waterfall treks across the hiking capital of Iloilo.",
    contact_number: "09181234568",
    createdByEmail: `organizer1${TEST_EMAIL_DOMAIN}`,
  },
  {
    full_name: "Benito Salazar Jr.",
    bio: "Certified mountaineer and trail runner from Leon, Iloilo. Summited all major Panay peaks including Madja-as, Nangtud, and Malinao. Specializes in multi-day expeditions.",
    contact_number: "09191234569",
    createdByEmail: `organizer3${TEST_EMAIL_DOMAIN}`,
  },
  {
    full_name: "Maricel 'Cel' Aguirre",
    bio: "Environmental science graduate turned mountain guide. Passionate about flora and fauna identification along Panay trails. Leads educational eco-hikes through watersheds and forests.",
    contact_number: "09201234570",
    createdByEmail: `organizer3${TEST_EMAIL_DOMAIN}`,
  },
  {
    full_name: "Romeo 'Kuya Romy' Bautista",
    bio: "Former barangay captain of a mountain village in Tubungan. Knows every river crossing, every shortcut, and every kaon-kaon (food stop) in the Tubungan-Igbaras trail network.",
    contact_number: "09211234571",
    createdByEmail: `organizer4${TEST_EMAIL_DOMAIN}`,
  },
  {
    full_name: "Josefina 'Joy' Panganiban",
    bio: "Island trekking specialist from Concepcion, Iloilo. Expert on the Concepcion archipelago and Pan de Azucar trails. Also a licensed boat captain for island crossings.",
    contact_number: "09221234572",
    createdByEmail: `organizer4${TEST_EMAIL_DOMAIN}`,
  },
  {
    full_name: "Eduardo 'Edong' Magtibay",
    bio: "Retired PNP officer turned hiking guide. Calm, safety-first approach on the trail. Specializes in sunrise hikes and highland treks around Igbaras and Alimodian.",
    contact_number: "09231234573",
    createdByEmail: `organizer5${TEST_EMAIL_DOMAIN}`,
  },
  {
    full_name: "Arlene 'Leng' Flores",
    bio: "Chill trail guide from Anini-y, Antique. Believes hiking should be slow, joyful, and full of storytelling. Knows every coastal path and hidden beach in southern Antique.",
    contact_number: "09241234574",
    createdByEmail: `organizer6${TEST_EMAIL_DOMAIN}`,
  },
];

interface TestEventGuide {
  guideName: string;
  eventTitle: string;
}

const TEST_EVENT_GUIDES: TestEventGuide[] = [
  // Tatay Rod — Panay Trail Collective's Antique/Madja-as guide
  { guideName: "Rodrigo 'Tatay Rod' Espinosa", eventTitle: "Mt. Madja-as Summit Trek" },
  { guideName: "Rodrigo 'Tatay Rod' Espinosa", eventTitle: "Mt. Malinao Summit Hike" },
  // Nanay Lorna — Panay Trail Collective's Igbaras guide
  { guideName: "Lorna 'Nanay Lorna' Delos Santos", eventTitle: "Igbaras Mountain Day Hike" },
  { guideName: "Lorna 'Nanay Lorna' Delos Santos", eventTitle: "Nadsadan Falls Day Hike" },
  { guideName: "Lorna 'Nanay Lorna' Delos Santos", eventTitle: "Janiuay Highlands Day Hike" },
  { guideName: "Lorna 'Nanay Lorna' Delos Santos", eventTitle: "Mt. Baloy Ridge Traverse" },
  // Benito — JTT's expedition guide
  { guideName: "Benito Salazar Jr.", eventTitle: "Igbaras-Tubungan Traverse" },
  { guideName: "Benito Salazar Jr.", eventTitle: "Bacolod de Tubungan Heritage Hike" },
  { guideName: "Benito Salazar Jr.", eventTitle: "Hamtic River Gorge Trek" },
  // Cel — JTT's eco-hike guide
  { guideName: "Maricel 'Cel' Aguirre", eventTitle: "Maasin Watershed Trail Hike" },
  { guideName: "Maricel 'Cel' Aguirre", eventTitle: "Capiz River Valley Trail" },
  { guideName: "Maricel 'Cel' Aguirre", eventTitle: "Leon River Trail Walk" },
  { guideName: "Maricel 'Cel' Aguirre", eventTitle: "Nadsadan Falls Day Hike" },
  // Kuya Romy — Five Tersty Trekkers' local guide
  { guideName: "Romeo 'Kuya Romy' Bautista", eventTitle: "Baloy Falls Adventure Hike" },
  { guideName: "Romeo 'Kuya Romy' Bautista", eventTitle: "Dingle Forest Trail Hike" },
  // Joy — Five Tersty Trekkers' island guide
  { guideName: "Josefina 'Joy' Panganiban", eventTitle: "Pan de Azucar Island Day Trek" },
  { guideName: "Josefina 'Joy' Panganiban", eventTitle: "Concepcion Island Hop & Hike" },
  // Edong — Yenergy Outdoors' sunrise/highland guide
  { guideName: "Eduardo 'Edong' Magtibay", eventTitle: "Mt. Napulak Sunrise Hike" },
  { guideName: "Eduardo 'Edong' Magtibay", eventTitle: "Pototan Highland Hike" },
  { guideName: "Eduardo 'Edong' Magtibay", eventTitle: "Igbaras Mountain Day Hike" },
  // Leng — Rubo-rubo Lang's coastal guide
  { guideName: "Arlene 'Leng' Flores", eventTitle: "Anini-y Coastal Trail Walk" },
  { guideName: "Arlene 'Leng' Flores", eventTitle: "Garin Farm Hilltop Hike" },
  { guideName: "Arlene 'Leng' Flores", eventTitle: "Guimbal Lighthouse Walk" },
];

interface TestGuideReview {
  guideName: string;
  reviewerEmail: string;
  eventTitle: string;
  rating: number;
  text: string;
}

const TEST_GUIDE_REVIEWS: TestGuideReview[] = [
  // Tatay Rod — reviewed on completed Mt. Malinao Summit Hike
  {
    guideName: "Rodrigo 'Tatay Rod' Espinosa",
    reviewerEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Mt. Malinao Summit Hike",
    rating: 5,
    text: "Tatay Rod is a legend. He navigated the mossy forest like it was his backyard — because it basically is. His stories about the Ati people and the mountain's history made the trek unforgettable.",
  },
  {
    guideName: "Rodrigo 'Tatay Rod' Espinosa",
    reviewerEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Mt. Malinao Summit Hike",
    rating: 5,
    text: "I felt completely safe with Tatay Rod leading the way. He adjusted the pace for our group perfectly and knew exactly where to stop for the best views. A true master of the mountains.",
  },
  // Nanay Lorna — reviewed on completed Igbaras Mountain Day Hike and Nadsadan Falls
  {
    guideName: "Lorna 'Nanay Lorna' Delos Santos",
    reviewerEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Igbaras Mountain Day Hike",
    rating: 5,
    text: "Nanay Lorna is the heart and soul of Igbaras hiking. She knows every shortcut, every swimming spot, and she even packed extra snacks for the group. Like hiking with your favorite tita!",
  },
  {
    guideName: "Lorna 'Nanay Lorna' Delos Santos",
    reviewerEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Igbaras Mountain Day Hike",
    rating: 4,
    text: "Very friendly and knowledgeable guide. She pointed out local plants and their uses along the trail. The river dip she took us to was the best part.",
  },
  {
    guideName: "Lorna 'Nanay Lorna' Delos Santos",
    reviewerEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Nadsadan Falls Day Hike",
    rating: 5,
    text: "Second time with Nanay Lorna and she's still amazing. This time she took us on a different route to the falls with even better views. She never runs out of new things to show you.",
  },
  {
    guideName: "Lorna 'Nanay Lorna' Delos Santos",
    reviewerEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Nadsadan Falls Day Hike",
    rating: 4,
    text: "Great guide for beginners. Very patient and encouraging on the steeper sections. Made sure everyone was comfortable before moving on.",
  },
  // Benito — reviewed on completed Bacolod de Tubungan Heritage Hike
  {
    guideName: "Benito Salazar Jr.",
    reviewerEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Bacolod de Tubungan Heritage Hike",
    rating: 4,
    text: "Benito knows the Tubungan trail network inside out. His fitness level is insane — he was barely breaking a sweat while we were dying on the climbs. Very professional guide.",
  },
  {
    guideName: "Benito Salazar Jr.",
    reviewerEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Bacolod de Tubungan Heritage Hike",
    rating: 5,
    text: "The Spanish ruins were fascinating and Benito's knowledge of the local history really brought them to life. He also showed us a hidden natural spring that wasn't on any map.",
  },
  // Cel — reviewed on completed Nadsadan Falls Day Hike (co-guide with Nanay Lorna)
  {
    guideName: "Maricel 'Cel' Aguirre",
    reviewerEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Nadsadan Falls Day Hike",
    rating: 5,
    text: "Cel's knowledge of local ecology is incredible. She identified at least 20 different plant species along the trail to the falls. It's like having a walking encyclopedia of Panay wildlife.",
  },
  {
    guideName: "Maricel 'Cel' Aguirre",
    reviewerEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Nadsadan Falls Day Hike",
    rating: 4,
    text: "Really appreciated Cel pointing out the birds and butterflies along the river trail. She made the hike educational without being boring. Great co-guide alongside Nanay Lorna.",
  },
  // Kuya Romy — reviewed on completed Baloy Falls Adventure Hike
  {
    guideName: "Romeo 'Kuya Romy' Bautista",
    reviewerEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Baloy Falls Adventure Hike",
    rating: 5,
    text: "Kuya Romy is the ultimate adventure guide. He helped us through every river crossing and rope section with confidence. His calm demeanor kept the whole group relaxed on the tricky parts.",
  },
  {
    guideName: "Romeo 'Kuya Romy' Bautista",
    reviewerEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Baloy Falls Adventure Hike",
    rating: 4,
    text: "Strong and reliable guide. He carried extra gear for those who were struggling and always made sure no one was left behind. The falls at the end were worth every step.",
  },
  // Edong — reviewed on completed Igbaras Mountain Day Hike (co-guide)
  {
    guideName: "Eduardo 'Edong' Magtibay",
    reviewerEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Igbaras Mountain Day Hike",
    rating: 4,
    text: "Edong is super safety-conscious which I appreciate. He checked trail conditions ahead of us and always had a plan B. Former PNP discipline shows — punctual and organized.",
  },
  {
    guideName: "Eduardo 'Edong' Magtibay",
    reviewerEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Igbaras Mountain Day Hike",
    rating: 4,
    text: "Very calm and reassuring guide. You can tell he's seen it all. He made sure we had enough water and rest stops on the way up. Good complement to Nanay Lorna's energy.",
  },
  // Leng — reviewed on completed Anini-y Coastal Trail Walk
  {
    guideName: "Arlene 'Leng' Flores",
    reviewerEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Anini-y Coastal Trail Walk",
    rating: 5,
    text: "Leng embodies the rubo-rubo spirit. No rushing, just pure enjoyment of the trail. She told local legends at every stop and found us the perfect seafood lunch spot by the beach.",
  },
  {
    guideName: "Arlene 'Leng' Flores",
    reviewerEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Anini-y Coastal Trail Walk",
    rating: 5,
    text: "Best coastal hike guide ever. Leng knows every tide pool, every hidden beach, and every local fisherman by name. Her storytelling made the walk feel like a cultural experience.",
  },
];

// ---------------------------------------------------------------------------
// Seed Functions
// ---------------------------------------------------------------------------

/** Delete any existing test data (makes the script idempotent). */
async function cleanExistingTestData() {
  log("🧹", "Cleaning existing test data...");

  // Find existing test auth users
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const testUsers = authUsers?.users?.filter((u) => u.email?.endsWith(TEST_EMAIL_DOMAIN)) ?? [];

  if (testUsers.length === 0) {
    log("✅", "No existing test data found.");
    return;
  }

  log("🗑️", `Found ${testUsers.length} existing test users. Removing...`);

  // Deleting auth users cascades to public.users, which cascades to bookings,
  // checkins, user_badges etc. We need to also clean up clubs, club_members,
  // events, badges etc. that are linked through clubs.
  // Because events FK to clubs (which FK to public.users via club_members),
  // we clean clubs explicitly before deleting users.

  // Clean event_routes and event_mountains (before events, due to FK)
  await supabase.from("event_routes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("event_mountains").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Mountains are reference data — keep them across seed/unseed cycles

  // Clean app testimonials (not tied to user cascade)
  await supabase
    .from("app_testimonials")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  for (const user of testUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) {
      console.error(`  Failed to delete user ${user.email}: ${error.message}`);
    }
  }

  log("✅", "Existing test data cleaned.");
}

/** Create auth users and update their public.users rows. */
async function createUsers(): Promise<Map<string, string>> {
  log("👤", "Creating test users...");

  // Map of email -> userId
  const userMap = new Map<string, string>();

  for (const user of TEST_USERS) {
    // 1. Create auth user (trigger auto-creates public.users row)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.full_name,
      },
    });

    if (authError) {
      console.error(`  Failed to create auth user ${user.email}: ${authError.message}`);
      continue;
    }

    const userId = authData.user.id;
    userMap.set(user.email, userId);

    // 2. Wait briefly for the trigger to fire
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 3. Update the public.users row with role, username, etc.
    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        is_guest: user.is_guest ?? false,
        avatar_url: user.avatar_url ?? null,
      })
      .eq("id", userId);

    if (updateError) {
      console.error(`  Failed to update public.users for ${user.email}: ${updateError.message}`);
    } else {
      log("  ✅", `${user.full_name} (${user.email}) - ${user.role}`);
    }
  }

  return userMap;
}

/** Create clubs and club_members. Returns map of club name -> club id. */
async function createClubs(userMap: Map<string, string>): Promise<Map<string, string>> {
  log("🏢", "Creating clubs...");

  const clubMap = new Map<string, string>();

  for (const club of CLUBS) {
    const userId = userMap.get(club.ownerEmail);
    if (!userId) {
      console.error(`  User not found for ${club.ownerEmail}`);
      continue;
    }

    const { data, error } = await supabase
      .from("clubs")
      .insert({
        name: club.name,
        slug: club.slug,
        description: club.description,
        logo_url: club.logo_url,
        visibility: club.visibility,
        payment_info: {
          gcash_number: "09171234567",
          maya_number: "09181234567",
        },
        is_demo: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to create club "${club.name}": ${error.message}`);
      continue;
    }

    clubMap.set(club.name, data.id);

    // Create club_members entry with role "owner"
    const { error: memberError } = await supabase.from("club_members").insert({
      club_id: data.id,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      console.error(`  Failed to add owner to club "${club.name}": ${memberError.message}`);
    } else {
      log("  ✅", `${club.name} (owner: ${club.ownerEmail})`);
    }
  }

  return clubMap;
}

/** Create events. Returns map of event title -> event id. */
async function createEvents(clubMap: Map<string, string>): Promise<Map<string, string>> {
  log("📅", "Creating events...");

  const eventMap = new Map<string, string>();

  for (const event of TEST_EVENTS) {
    const clubId = clubMap.get(event.clubName);
    if (!clubId) {
      console.error(`  Club not found: ${event.clubName}`);
      continue;
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        club_id: clubId,
        title: event.title,
        description: event.description,
        type: event.type,
        date: event.date,
        location: event.location,
        coordinates: event.coordinates || null,
        max_participants: event.max_participants,
        price: event.price,
        status: event.status,
        cover_image_url: event.cover_image_url,
        is_demo: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to create event "${event.title}": ${error.message}`);
    } else {
      eventMap.set(event.title, data.id);
      log("  ✅", `${event.title} [${event.status}]`);

      // Insert distance categories if defined
      if (event.distances && event.distances.length > 0) {
        const distanceRows = event.distances.map((d) => ({
          event_id: data.id,
          distance_km: d.distance_km,
          label: d.label || null,
          price: d.price,
          max_participants: d.max_participants,
        }));
        const { error: distError } = await supabase.from("event_distances").insert(distanceRows);
        if (distError) {
          console.error(`  Failed to add distances for "${event.title}": ${distError.message}`);
        } else {
          log("  📏", `Added ${distanceRows.length} distance categories`);
        }
      }
    }
  }

  return eventMap;
}

/** Seed event routes using pre-defined waypoints for real Iloilo/Panay routes. */
async function seedEventRoutes(eventMap: Map<string, string>) {
  log("🗺️", "Creating event routes...");

  let created = 0;
  for (const def of EVENT_ROUTE_DEFS) {
    const eventId = eventMap.get(def.eventTitle);
    if (!eventId) {
      console.error(`  Event not found for route: "${def.eventTitle}"`);
      continue;
    }

    const encoded = def.osrmPolyline ?? polyline.encode(def.waypoints);

    const { error } = await supabase.from("event_routes").insert({
      event_id: eventId,
      source: "gpx" as const,
      name: def.name,
      distance: def.distanceKm * 1000,
      elevation_gain: def.elevationGain,
      summary_polyline: encoded,
    });

    if (error) {
      console.error(`  Failed to create route for "${def.eventTitle}": ${error.message}`);
    } else {
      log("  ✅", `${def.name} (${def.distanceKm}km, ${def.elevationGain}m gain)`);
      created++;
    }
  }

  log("✅", `Created ${created} event routes.`);
}

/** Create bookings with QR codes. Returns map of "userEmail:eventTitle" -> bookingId. */
async function createBookings(
  userMap: Map<string, string>,
  eventMap: Map<string, string>,
): Promise<Map<string, string>> {
  log("🎫", "Creating bookings...");

  const bookingMap = new Map<string, string>();

  interface BookingDef {
    userEmail: string;
    eventTitle: string;
    status: "pending" | "confirmed" | "cancelled";
    payment_status: "pending" | "paid" | "rejected" | "refunded";
    payment_method: "gcash" | "maya" | "cash" | null;
  }

  const bookings: BookingDef[] = [
    // ---- Upcoming event bookings ----
    // Jake's bookings
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Madja-as Summit Trek",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Iloilo-Antique Coastal Road Ride",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    // Maria's bookings
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Madja-as Summit Trek",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Iloilo Esplanade Night Run 10K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    // Carlos's bookings
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Bucari Pine Forest Trail Run",
      status: "pending",
      payment_status: "pending",
      payment_method: "gcash",
    },
    // Cash booking — pending, pays on event day
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Iloilo Esplanade Night Run 10K",
      status: "pending",
      payment_status: "pending",
      payment_method: "cash",
    },
    // Rejected payment — needs re-upload
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Iloilo-Antique Coastal Road Ride",
      status: "pending",
      payment_status: "rejected",
      payment_method: "maya",
    },
    // Guest's booking
    {
      userEmail: `guest${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Iloilo Esplanade Night Run 10K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // ---- Past event bookings ----
    // Igbaras Mountain Day Hike (-14 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Igbaras Mountain Day Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Igbaras Mountain Day Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Nadsadan Falls Day Hike (-21 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Nadsadan Falls Day Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Nadsadan Falls Day Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    // Calinog Highland Trail Run 15K (-25 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Calinog Highland Trail Run 15K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Calinog Highland Trail Run 15K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Panay Circumferential Road Ride (-30 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Panay Circumferential Road Ride",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Panay Circumferential Road Ride",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Bacolod de Tubungan Heritage Hike (-35 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Bacolod de Tubungan Heritage Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Bacolod de Tubungan Heritage Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    // Anini-y Coastal Trail Walk (-40 days)
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Anini-y Coastal Trail Walk",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Anini-y Coastal Trail Walk",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Miag-ao Heritage Trail Run (-45 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Miag-ao Heritage Trail Run",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Miag-ao Heritage Trail Run",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Baloy Falls Adventure Hike (-50 days)
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Baloy Falls Adventure Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Baloy Falls Adventure Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    // Malalison Island Trail Ride (-60 days)
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Malalison Island Trail Ride",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Malalison Island Trail Ride",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Mt. Malinao Summit Hike (-75 days)
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Malinao Summit Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Malinao Summit Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Iloilo City Fun Run 5K (-90 days)
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Iloilo City Fun Run 5K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `guest${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Iloilo City Fun Run 5K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
  ];

  for (const booking of bookings) {
    const userId = userMap.get(booking.userEmail);
    const eventId = eventMap.get(booking.eventTitle);
    if (!userId || !eventId) {
      console.error(
        `  Missing user or event for booking: ${booking.userEmail} -> ${booking.eventTitle}`,
      );
      continue;
    }

    // QR code: issued for paid, cash, and confirmed bookings; not for pending e-wallet
    const isEwallet = booking.payment_method === "gcash" || booking.payment_method === "maya";
    const isPendingEwallet = isEwallet && booking.payment_status !== "paid";
    const qrCode = isPendingEwallet ? null : `eventtara:checkin:${eventId}:${userId}`;

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        event_id: eventId,
        user_id: userId,
        status: booking.status,
        payment_status: booking.payment_status,
        payment_method: booking.payment_method,
        qr_code: qrCode,
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        `  Failed to create booking (${booking.userEmail} -> ${booking.eventTitle}): ${error.message}`,
      );
    } else {
      bookingMap.set(`${booking.userEmail}:${booking.eventTitle}`, data.id);
      const userName = booking.userEmail.split("@")[0];
      log(
        "  ✅",
        `${userName} -> ${booking.eventTitle} [${booking.status}/${booking.payment_status}]`,
      );
    }
  }

  return bookingMap;
}

interface BadgeDef {
  eventTitle: string;
  title: string;
  description: string;
  image_url: string;
  category: "distance" | "adventure" | "location" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
}

const BADGE_DEFS: BadgeDef[] = [
  // Published events — pre-created by clubs
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
  // Completed event badges
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

interface BadgeAwardDef {
  badgeTitle: string;
  userEmails: string[];
}

const BADGE_AWARDS: BadgeAwardDef[] = [
  {
    badgeTitle: "Igbaras Hiker",
    userEmails: [
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
      `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
    ],
  },
  {
    badgeTitle: "Nadsadan Falls Explorer",
    userEmails: [
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
      `participant2${TEST_EMAIL_DOMAIN}`, // Maria
    ],
  },
  {
    badgeTitle: "Miag-ao Heritage Runner",
    userEmails: [
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
      `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
    ],
  },
  {
    badgeTitle: "Mt. Malinao Summiteer",
    userEmails: [
      `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
      `participant2${TEST_EMAIL_DOMAIN}`, // Maria
    ],
  },
  {
    badgeTitle: "Panay Circuit Finisher",
    userEmails: [
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
      `participant2${TEST_EMAIL_DOMAIN}`, // Maria
    ],
  },
  {
    badgeTitle: "Malalison Island Rider",
    userEmails: [
      `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
    ],
  },
  {
    badgeTitle: "Iloilo Fun Runner",
    userEmails: [
      `participant2${TEST_EMAIL_DOMAIN}`, // Maria
      `guest${TEST_EMAIL_DOMAIN}`, // Guest
    ],
  },
];

/** Create badges for events. */
async function createBadges(eventMap: Map<string, string>): Promise<Map<string, string>> {
  log("🏅", "Creating badges...");

  const badgeMap = new Map<string, string>();

  for (const badge of BADGE_DEFS) {
    const eventId = eventMap.get(badge.eventTitle);
    if (!eventId) {
      console.error(`  Event not found for badge "${badge.title}", skipping.`);
      continue;
    }

    // Check if badge already exists (badges are reference data, kept across cycles)
    const { data: existing } = await supabase
      .from("badges")
      .select("id")
      .eq("title", badge.title)
      .single();

    if (existing) {
      // Update event_id to link to new seed event, keep the badge
      await supabase.from("badges").update({ event_id: eventId }).eq("id", existing.id);
      badgeMap.set(badge.title, existing.id);
      log("  ✅", `${badge.title} (${badge.eventTitle}) [existing]`);
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
      log("  ✅", `${badge.title} (${badge.eventTitle})`);
    }
  }

  return badgeMap;
}

/** Award badges to participants. */
async function awardBadges(userMap: Map<string, string>, badgeMap: Map<string, string>) {
  log("🎖️", "Awarding badges...");

  for (const award of BADGE_AWARDS) {
    const badgeId = badgeMap.get(award.badgeTitle);
    if (!badgeId) {
      console.error(`  Badge "${award.badgeTitle}" not found, skipping.`);
      continue;
    }

    for (const email of award.userEmails) {
      const userId = userMap.get(email);
      if (!userId) continue;

      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badgeId,
      });

      if (error) {
        console.error(`  Failed to award "${award.badgeTitle}" to ${email}: ${error.message}`);
      } else {
        const name = TEST_USERS.find((u) => u.email === email)?.full_name;
        log("  ✅", `${name} received "${award.badgeTitle}"`);
      }
    }
  }
}

interface CheckinDef {
  eventTitle: string;
  daysAgo: number;
  userEmails: string[];
}

const CHECKIN_DEFS: CheckinDef[] = [
  {
    eventTitle: "Igbaras Mountain Day Hike",
    daysAgo: 14,
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Nadsadan Falls Day Hike",
    daysAgo: 21,
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Calinog Highland Trail Run 15K",
    daysAgo: 25,
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Panay Circumferential Road Ride",
    daysAgo: 30,
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Bacolod de Tubungan Heritage Hike",
    daysAgo: 35,
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Anini-y Coastal Trail Walk",
    daysAgo: 40,
    userEmails: [`participant2${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Miag-ao Heritage Trail Run",
    daysAgo: 45,
    userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Baloy Falls Adventure Hike",
    daysAgo: 50,
    userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Malalison Island Trail Ride",
    daysAgo: 60,
    userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant1${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Mt. Malinao Summit Hike",
    daysAgo: 75,
    userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`],
  },
  {
    eventTitle: "Iloilo City Fun Run 5K",
    daysAgo: 90,
    userEmails: [`participant2${TEST_EMAIL_DOMAIN}`, `guest${TEST_EMAIL_DOMAIN}`],
  },
];

/** Create check-ins for all completed events. */
async function createCheckins(userMap: Map<string, string>, eventMap: Map<string, string>) {
  log("📋", "Creating check-ins...");

  for (const def of CHECKIN_DEFS) {
    const eventId = eventMap.get(def.eventTitle);
    if (!eventId) {
      console.error(`  Event not found for check-ins: "${def.eventTitle}", skipping.`);
      continue;
    }

    const checkinDate = new Date();
    checkinDate.setDate(checkinDate.getDate() - def.daysAgo);
    checkinDate.setHours(7, 30, 0, 0);

    for (const email of def.userEmails) {
      const userId = userMap.get(email);
      if (!userId) continue;

      const { error } = await supabase.from("event_checkins").insert({
        event_id: eventId,
        user_id: userId,
        checked_in_at: checkinDate.toISOString(),
        method: "manual",
      });

      if (error) {
        console.error(
          `  Failed to create check-in for ${email} at "${def.eventTitle}": ${error.message}`,
        );
      } else {
        const name = TEST_USERS.find((u) => u.email === email)?.full_name;
        log("  ✅", `${name} checked in at ${def.eventTitle}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// System Badges
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
  // First activity per type
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
  // All-rounder
  {
    criteriaKey: "all_rounder",
    title: "All-Rounder",
    description: "Checked in to at least one event of every activity type",
    category: "special",
    rarity: "epic",
    imageUrl: "\u{1F31F}",
  },
  // Volume milestones
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
  // Pioneer (check-in)
  {
    criteriaKey: "pioneer",
    title: "Check-in Pioneer",
    description: "Among the first 100 users to check in on EventTara",
    category: "special",
    rarity: "legendary",
    imageUrl: "\u{1F680}",
  },
  // Pioneer (signup)
  {
    criteriaKey: "pioneer_participant",
    title: "Pioneer Participant",
    description: "Among the first 250 users to join EventTara",
    category: "special",
    rarity: "legendary",
    imageUrl: "\u{1F31F}",
  },
  // Pioneer (club creator)
  {
    criteriaKey: "pioneer_organizer",
    title: "Pioneer Club Creator",
    description: "Among the first 50 clubs created on EventTara",
    category: "special",
    rarity: "legendary",
    imageUrl: "\u{1F3D4}\uFE0F",
  },
  // First review
  {
    criteriaKey: "first_review",
    title: "First Review",
    description: "Wrote your first event review on EventTara",
    category: "special",
    rarity: "rare",
    imageUrl: "\u270D\uFE0F",
  },
];

const ALL_EVENT_TYPES = ["hiking", "running", "road_bike", "mtb", "trail_run"];

/** Seed system badge rows into the badges table. */
async function createSystemBadges(): Promise<Map<string, string>> {
  log("\u{1F396}\uFE0F", "Creating system badges...");

  // Badges are reference data — check if exists, skip if so
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

/** Retroactively award system badges based on seeded check-in data. */
async function awardSystemBadges(
  userMap: Map<string, string>,
  systemBadgeMap: Map<string, string>,
) {
  log("\u{1F31F}", "Awarding system badges retroactively...");

  // Get all unique user IDs from userMap
  const userIds = Array.from(new Set(Array.from(userMap.values())));

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

    // Pioneer rank: count distinct users whose first check-in is before this user's
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

    // Find the user's name for logging
    let userName = "Unknown";
    for (const [email, id] of Array.from(userMap.entries())) {
      if (id === userId) {
        userName = TEST_USERS.find((u) => u.email === email)?.full_name ?? email;
        break;
      }
    }

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
        // Ignore duplicate errors (user already has this badge)
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

interface CompanionDef {
  userEmail: string;
  eventTitle: string;
  companions: { full_name: string; phone: string }[];
}

const COMPANION_DEFS: CompanionDef[] = [
  // Jake brought 2 friends to Mt. Madja-as (confirmed/paid — companions get QR codes)
  {
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Mt. Madja-as Summit Trek",
    companions: [
      { full_name: "Rico Dela Cruz", phone: "09171112233" },
      { full_name: "Jen Villanueva", phone: "09181234567" },
    ],
  },
  // Maria brought 1 friend to Esplanade Night Run (confirmed/paid)
  {
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Iloilo Esplanade Night Run 10K",
    companions: [{ full_name: "Sofia Reyes", phone: "09199876543" }],
  },
  // Carlos has a pending booking to Bucari with 1 companion (pending e-wallet — no QR yet)
  {
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Bucari Pine Forest Trail Run",
    companions: [{ full_name: "Daniel Torres", phone: "09201234567" }],
  },
  // Carlos brought a friend to Esplanade Night Run (cash/pending — companions get QR codes)
  {
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Iloilo Esplanade Night Run 10K",
    companions: [{ full_name: "Andrea Santos", phone: "" }],
  },
];

const APP_TESTIMONIALS = [
  {
    name: "Miguel Pascual",
    role: "Trail Runner",
    text: "EventTara made it so easy to find trail running events around Panay. I've joined three events already — from Bucari to Miag-ao — and met amazing people along the way!",
    avatar_url: null,
    display_order: 1,
  },
  {
    name: "Rina Aquino",
    role: "Mountain Biker",
    text: "As someone new to MTB, I was nervous about joining group rides. EventTara's booking system was seamless, and the Iloilo Pedal Club community was so welcoming.",
    avatar_url: null,
    display_order: 2,
  },
  {
    name: "Paolo Guerrero",
    role: "Hiking Enthusiast",
    text: "I love how I can track my adventure badges on EventTara. It's like a passport for outdoor adventures across Panay Island!",
    avatar_url: null,
    display_order: 3,
  },
  {
    name: "Camille Tan",
    role: "Road Cyclist",
    text: "Finally a platform that brings the Western Visayas cycling community together. The QR check-in system is super convenient for clubs and participants alike.",
    avatar_url: null,
    display_order: 4,
  },
];

interface ReviewDef {
  eventTitle: string;
  userEmail: string;
  rating: number;
  text: string;
}

const REVIEW_DEFS: ReviewDef[] = [
  {
    eventTitle: "Igbaras Mountain Day Hike",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "The mountains of Igbaras are stunning! The guide was knowledgeable and the pace was perfect for beginners. The river dip at Nadsadan Falls was the highlight.",
  },
  {
    eventTitle: "Igbaras Mountain Day Hike",
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Great hike overall. The views from the ridge were amazing. Only wish we had more time at the falls.",
  },
  {
    eventTitle: "Nadsadan Falls Day Hike",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Nadsadan Falls is even more beautiful in person. The bamboo grove trail was magical and the swimming pool at the base is crystal clear!",
  },
  {
    eventTitle: "Nadsadan Falls Day Hike",
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Well organized event. The multi-tiered falls are spectacular. Bring waterproof bags for your gear!",
  },
  {
    eventTitle: "Miag-ao Heritage Trail Run",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Running past the UNESCO Heritage Miag-ao Church at sunrise was unforgettable. The coastal trail section was challenging but beautiful.",
  },
  {
    eventTitle: "Miag-ao Heritage Trail Run",
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Tough but rewarding 21K. The rice paddy views and heritage town post-run tour made it special. Would definitely do it again.",
  },
  {
    eventTitle: "Panay Circumferential Road Ride",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Solid event. The Capiz coastal road is beautiful. Aid stations were well-stocked and the overnight in Roxas City was a nice break.",
  },
  {
    eventTitle: "Panay Circumferential Road Ride",
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Best gran fondo I've done in the Visayas. 300km around Panay is no joke! Perfect organization and the post-ride seafood feast in Antique was amazing.",
  },
  {
    eventTitle: "Mt. Malinao Summit Hike",
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "The sacred mountain of the Ati people — bucket list checked! Views of Boracay from the summit were breathtaking. The guides were top-notch.",
  },
  {
    eventTitle: "Mt. Malinao Summit Hike",
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Life-changing experience. The old-growth mossy forest was like stepping into another world. Worth every peso and every step.",
  },
  {
    eventTitle: "Malalison Island Trail Ride",
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Riding through coastal cliffs on a remote island — what an experience! The boat ride and white sand coves made it unforgettable.",
  },
  {
    eventTitle: "Malalison Island Trail Ride",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Unique combination of island hopping and mountain biking. The rocky terrain was challenging but the beach lunch was worth it.",
  },
  {
    eventTitle: "Iloilo City Fun Run 5K",
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Perfect for beginners! The route past Molo Church and through Jaro was scenic. And the free La Paz batchoy at the finish? Chef's kiss!",
  },
  {
    eventTitle: "Bacolod de Tubungan Heritage Hike",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Hidden gem of Iloilo! The Spanish ruins and natural springs were fascinating. Easy-moderate hike perfect for a chill weekend.",
  },
  {
    eventTitle: "Baloy Falls Adventure Hike",
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "Baloy Falls is absolutely worth the trek! The rope sections and river crossings made it a real adventure. The multi-tiered cascade is jaw-dropping.",
  },
  {
    eventTitle: "Calinog Highland Trail Run 15K",
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    rating: 4,
    text: "Beautiful trail through coffee plantations and grasslands. The Calinog highlands are an underrated gem. Great hydration stations throughout.",
  },
  {
    eventTitle: "Anini-y Coastal Trail Walk",
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    rating: 5,
    text: "The most relaxing hike I've ever done! Ocean views, tide pools, and fresh seafood lunch by the beach. The rubo-rubo way is the best way!",
  },
];

/** Create booking companions with QR codes. */
async function createCompanions(bookingMap: Map<string, string>, eventMap: Map<string, string>) {
  log("👥", "Creating booking companions...");

  for (const def of COMPANION_DEFS) {
    const key = `${def.userEmail}:${def.eventTitle}`;
    const bookingId = bookingMap.get(key);
    const eventId = eventMap.get(def.eventTitle);
    if (!bookingId || !eventId) {
      console.error(`  Booking not found for companion: ${key}`);
      continue;
    }

    // Look up the booking to determine if companions should get QR codes
    const { data: booking } = await supabase
      .from("bookings")
      .select("payment_status, payment_method")
      .eq("id", bookingId)
      .single();

    if (!booking) continue;

    const isEwallet = booking.payment_method === "gcash" || booking.payment_method === "maya";
    const isPendingEwallet = isEwallet && booking.payment_status !== "paid";

    for (const comp of def.companions) {
      const id = crypto.randomUUID();
      const qrCode = !isPendingEwallet ? `eventtara:checkin:${eventId}:companion:${id}` : null;

      const { error } = await supabase.from("booking_companions").insert({
        id,
        booking_id: bookingId,
        full_name: comp.full_name,
        phone: comp.phone || null,
        qr_code: qrCode,
      });

      if (error) {
        console.error(`  Failed to create companion "${comp.full_name}": ${error.message}`);
        continue;
      }

      const userName = def.userEmail.split("@")[0];
      log("  ✅", `${comp.full_name} (companion of ${userName}) -> ${def.eventTitle}`);
    }
  }
}

async function seedAppTestimonials() {
  log("💬", "Creating app testimonials...");

  for (const t of APP_TESTIMONIALS) {
    const { error } = await supabase.from("app_testimonials").insert(t);
    if (error) {
      console.error(`  Failed to create testimonial for "${t.name}": ${error.message}`);
    } else {
      log("  ✅", `${t.name} — ${t.role}`);
    }
  }
}

async function seedEventReviews(userMap: Map<string, string>, eventMap: Map<string, string>) {
  log("⭐", "Creating event reviews...");

  for (const review of REVIEW_DEFS) {
    const userId = userMap.get(review.userEmail);
    const eventId = eventMap.get(review.eventTitle);
    if (!userId || !eventId) {
      console.error(
        `  Missing user or event for review: ${review.userEmail} -> ${review.eventTitle}`,
      );
      continue;
    }

    const { error } = await supabase.from("event_reviews").insert({
      event_id: eventId,
      user_id: userId,
      rating: review.rating,
      text: review.text,
    });

    if (error) {
      console.error(`  Failed to create review: ${error.message}`);
    } else {
      const name = TEST_USERS.find((u) => u.email === review.userEmail)?.full_name;
      log("  ✅", `${name} reviewed ${review.eventTitle} (${review.rating}★)`);
    }
  }
}

/** Create guides. Returns map of guide full_name -> guide id. */
async function createGuides(userMap: Map<string, string>): Promise<Map<string, string>> {
  log("🧭", "Creating guides...");

  const guideMap = new Map<string, string>();

  for (const guide of TEST_GUIDES) {
    const createdBy = userMap.get(guide.createdByEmail);
    if (!createdBy) {
      console.error(`  User not found for guide creator: ${guide.createdByEmail}`);
      continue;
    }

    const { data, error } = await supabase
      .from("guides")
      .insert({
        full_name: guide.full_name,
        bio: guide.bio,
        contact_number: guide.contact_number,
        created_by: createdBy,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to create guide "${guide.full_name}": ${error.message}`);
    } else {
      guideMap.set(guide.full_name, data.id);
      log("  ✅", `${guide.full_name}`);
    }
  }

  return guideMap;
}

/** Link guides to events. */
async function linkEventGuides(
  guideMap: Map<string, string>,
  eventMap: Map<string, string>,
): Promise<void> {
  log("🔗", "Linking guides to events...");

  for (const link of TEST_EVENT_GUIDES) {
    const guideId = guideMap.get(link.guideName);
    const eventId = eventMap.get(link.eventTitle);
    if (!guideId || !eventId) {
      console.error(`  Missing guide or event for link: ${link.guideName} -> ${link.eventTitle}`);
      continue;
    }

    const { error } = await supabase.from("event_guides").insert({
      event_id: eventId,
      guide_id: guideId,
    });

    if (error) {
      console.error(
        `  Failed to link "${link.guideName}" to "${link.eventTitle}": ${error.message}`,
      );
    } else {
      log("  ✅", `${link.guideName} -> ${link.eventTitle}`);
    }
  }
}

/** Create guide reviews from participants. */
async function seedGuideReviews(
  guideMap: Map<string, string>,
  userMap: Map<string, string>,
  eventMap: Map<string, string>,
): Promise<void> {
  log("📝", "Creating guide reviews...");

  for (const review of TEST_GUIDE_REVIEWS) {
    const guideId = guideMap.get(review.guideName);
    const userId = userMap.get(review.reviewerEmail);
    const eventId = eventMap.get(review.eventTitle);
    if (!guideId || !userId || !eventId) {
      console.error(
        `  Missing guide, user, or event for guide review: ${review.guideName} <- ${review.reviewerEmail} @ ${review.eventTitle}`,
      );
      continue;
    }

    const { error } = await supabase.from("guide_reviews").insert({
      guide_id: guideId,
      user_id: userId,
      event_id: eventId,
      rating: review.rating,
      text: review.text,
    });

    if (error) {
      console.error(`  Failed to create guide review: ${error.message}`);
    } else {
      const name = TEST_USERS.find((u) => u.email === review.reviewerEmail)?.full_name;
      log(
        "  ✅",
        `${name} reviewed ${review.guideName} @ ${review.eventTitle} (${review.rating}★)`,
      );
    }
  }
}

/** Seed mountains. Returns map of mountain name -> mountain object (id, name, difficulty_level). */
async function seedMountains(): Promise<
  Map<string, { id: string; name: string; difficulty_level: number }>
> {
  log("⛰️", "Seeding mountains...");

  const mountainMap = new Map<string, { id: string; name: string; difficulty_level: number }>();

  for (const mountain of PANAY_MOUNTAINS) {
    const { data, error } = await supabase
      .from("mountains")
      .upsert(mountain, { onConflict: "name" })
      .select("id, name, difficulty_level")
      .single();

    if (error) {
      console.warn(`  Warning seeding mountain ${mountain.name}:`, error.message);
    } else {
      mountainMap.set(data.name, data);
      log(
        "  ✅",
        `${mountain.name} (${mountain.elevation_masl}m, difficulty ${mountain.difficulty_level})`,
      );
    }
  }

  return mountainMap;
}

/** Link hiking events to mountains and set difficulty_level on events. */
async function linkEventMountains(
  eventMap: Map<string, string>,
  mountainMap: Map<string, { id: string; name: string; difficulty_level: number }>,
): Promise<void> {
  log("🔗", "Linking hiking events to mountains...");

  for (const [eventTitle, mountainNames] of Object.entries(HIKING_EVENT_MOUNTAINS)) {
    const eventId = eventMap.get(eventTitle);
    if (!eventId) {
      console.error(`  Event not found: ${eventTitle}`);
      continue;
    }

    let maxDifficulty = 0;

    for (let i = 0; i < mountainNames.length; i++) {
      const mountainName = mountainNames[i];
      const mountain = mountainMap.get(mountainName);
      if (!mountain) {
        console.error(`  Mountain not found: ${mountainName}`);
        continue;
      }

      const { error } = await supabase.from("event_mountains").insert({
        event_id: eventId,
        mountain_id: mountain.id,
        sort_order: i,
      });

      if (error) {
        console.error(`  Failed to link "${mountainName}" to "${eventTitle}": ${error.message}`);
      } else {
        log("  ✅", `${mountainName} -> ${eventTitle}`);
      }

      if (mountain.difficulty_level > maxDifficulty) {
        maxDifficulty = mountain.difficulty_level;
      }
    }

    // Set the event's difficulty_level to the max difficulty of linked mountains
    if (maxDifficulty > 0) {
      const { error: updateError } = await supabase
        .from("events")
        .update({ difficulty_level: maxDifficulty })
        .eq("id", eventId);

      if (updateError) {
        console.error(`  Failed to set difficulty on "${eventTitle}": ${updateError.message}`);
      } else {
        log("  📊", `${eventTitle} difficulty set to ${maxDifficulty}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Award Club Owner Borders
// ---------------------------------------------------------------------------

const TIER_RANK: Record<string, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

async function awardClubOwnerBorders(userMap: Map<string, string>, clubMap: Map<string, string>) {
  log("🖼️", "Awarding club owner borders...");

  // 1. Fetch all borders relevant to club owners
  const { data: borders, error: bordersError } = await supabase
    .from("avatar_borders")
    .select("*")
    .in("criteria_type", ["organizer_event_count", "signup_date"]);

  if (bordersError || !borders || borders.length === 0) {
    console.error("  Failed to fetch avatar borders:", bordersError?.message ?? "none found");
    return;
  }

  // 2. Build email -> club_id mapping from CLUBS
  const emailToClub = new Map<string, string>();
  for (const club of CLUBS) {
    const clubId = clubMap.get(club.name);
    if (clubId) emailToClub.set(club.ownerEmail, clubId);
  }

  // 3. For each club owner, count events and award borders
  const ownerEmails = CLUBS.map((c) => c.ownerEmail);

  for (const email of ownerEmails) {
    const userId = userMap.get(email);
    const clubId = emailToClub.get(email);
    if (!userId || !clubId) continue;

    // Count published/completed events for this club
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .in("status", ["published", "completed"]);

    const eventCount = count ?? 0;

    const awarded: { border_id: string; tier: string; name: string }[] = [];

    for (const border of borders) {
      const criteria = border.criteria_value as Record<string, unknown>;

      if (border.criteria_type === "organizer_event_count") {
        const minEvents = criteria.min_events as number;
        if (eventCount >= minEvents) {
          awarded.push({ border_id: border.id, tier: border.tier, name: border.name });
        }
      } else if (border.criteria_type === "signup_date") {
        // All seeded users are created today, before the Pioneer cutoff
        const before = criteria.before as string;
        if (new Date() < new Date(before)) {
          awarded.push({ border_id: border.id, tier: border.tier, name: border.name });
        }
      }
    }

    if (awarded.length === 0) continue;

    // Insert user_avatar_borders
    const { error: insertError } = await supabase
      .from("user_avatar_borders")
      .insert(awarded.map((a) => ({ user_id: userId, border_id: a.border_id })));

    if (insertError) {
      console.error(`  Failed to award borders for ${email}: ${insertError.message}`);
      continue;
    }

    // Set active_border_id to the highest-tier border
    const best = awarded.reduce((a, b) =>
      (TIER_RANK[b.tier] ?? 0) > (TIER_RANK[a.tier] ?? 0) ? b : a,
    );

    await supabase.from("users").update({ active_border_id: best.border_id }).eq("id", userId);

    const borderNames = awarded.map((a) => a.name).join(", ");
    log("  ✅", `${email} (${eventCount} events) → ${borderNames} [active: ${best.name}]`);
  }
}

// ---------------------------------------------------------------------------
// Welcome Pages & Duck Races
// ---------------------------------------------------------------------------

async function seedWelcomePages(clubMap: Map<string, string>, badgeMap: Map<string, string>) {
  log("🎫", "Creating welcome pages...");

  const yenergyClubId = clubMap.get("Yenergy Outdoors");
  const pioneerBadgeId = badgeMap.get("Pioneer Participant");

  if (!yenergyClubId) {
    console.error("  Yenergy Outdoors club not found — skipping welcome pages");
    return;
  }

  const { error } = await supabase.from("welcome_pages").insert({
    code: "yenergy",
    title: "Welcome to Yenergy Outdoors!",
    subtitle: "Scan this QR to join the crew",
    description:
      "You're about to join a community of outdoor enthusiasts. Sign up to become a member and claim your exclusive badge!",
    badge_id: pioneerBadgeId ?? null,
    club_id: yenergyClubId,
    redirect_url: "/clubs/yenergy-outdoors",
    hero_image_url:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=400&fit=crop",
    is_active: true,
  });

  if (error) {
    console.error("  Failed to create Yenergy welcome page:", error.message);
  } else {
    log("  ✅", "Yenergy welcome page → /welcome/yenergy");
  }
}

async function seedDuckRaces(clubMap: Map<string, string>, userMap: Map<string, string>) {
  log("🦆", "Creating duck races...");

  const yenergyClubId = clubMap.get("Yenergy Outdoors");
  const ownerUserId = userMap.get(`organizer5${TEST_EMAIL_DOMAIN}`);

  if (!yenergyClubId || !ownerUserId) {
    console.error("  Yenergy club or owner not found — skipping duck races");
    return;
  }

  const { data: race, error } = await supabase
    .from("club_races")
    .insert({
      club_id: yenergyClubId,
      title: "Yenergy Pioneer Raffle",
      num_winners: 3,
      created_by: ownerUserId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("  Failed to create duck race:", error.message);
  } else {
    log("  ✅", `Yenergy Pioneer Raffle → /race/${race.id}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  EventTara - Database Seed Script");
  console.log("  Target: " + SUPABASE_URL);
  console.log("=".repeat(60));
  console.log();

  const startTime = Date.now();

  try {
    // Step 1: Clean existing test data
    await cleanExistingTestData();
    console.log();

    // Step 2: Create users
    const userMap = await createUsers();
    console.log();

    // Step 3: Create clubs and club members
    const clubMap = await createClubs(userMap);
    console.log();

    // Step 4: Create events
    const eventMap = await createEvents(clubMap);
    console.log();

    // Step 4a: Seed event routes (map polylines)
    await seedEventRoutes(eventMap);
    console.log();

    // Step 4b: Create guides
    const guideMap = await createGuides(userMap);
    console.log();

    // Step 4c: Link guides to events
    await linkEventGuides(guideMap, eventMap);
    console.log();

    // Step 4d: Seed mountains
    const mountainMap = await seedMountains();
    console.log();

    // Step 4e: Link hiking events to mountains
    await linkEventMountains(eventMap, mountainMap);
    console.log();

    // Step 5: Create bookings
    const bookingMap = await createBookings(userMap, eventMap);
    console.log();

    // Step 5b: Create booking companions
    await createCompanions(bookingMap, eventMap);
    console.log();

    // Step 6: Create badges
    const badgeMap = await createBadges(eventMap);
    console.log();

    // Step 7: Award badges
    await awardBadges(userMap, badgeMap);
    console.log();

    // Step 8: Create check-ins
    await createCheckins(userMap, eventMap);
    console.log();

    // Step 8b: Create system badges
    const systemBadgeMap = await createSystemBadges();
    console.log();

    // Step 8c: Award system badges retroactively
    await awardSystemBadges(userMap, systemBadgeMap);
    console.log();

    // Step 9: Create app testimonials
    await seedAppTestimonials();
    console.log();

    // Step 10: Create event reviews
    await seedEventReviews(userMap, eventMap);
    console.log();

    // Step 11: Create guide reviews
    await seedGuideReviews(guideMap, userMap, eventMap);
    console.log();

    // Step 12: Award club owner borders
    await awardClubOwnerBorders(userMap, clubMap);
    console.log();

    // Step 13: Welcome pages
    await seedWelcomePages(clubMap, systemBadgeMap);
    console.log();

    // Step 14: Duck races
    await seedDuckRaces(clubMap, userMap);
    console.log();

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("=".repeat(60));
    log("🎉", `Seed completed in ${elapsed}s`);
    console.log();
    console.log("  Test accounts created:");
    console.log("  ──────────────────────────────────────────────");
    for (const user of TEST_USERS) {
      console.log(`  ${user.role.padEnd(12)} | ${user.email}`);
    }
    console.log(`  Password   | ${DEFAULT_PASSWORD}`);
    console.log("  ──────────────────────────────────────────────");
    console.log("=".repeat(60));
  } catch (err) {
    console.error("\nSeed failed with an unexpected error:");
    console.error(err);
    process.exit(1);
  }
}

main();
