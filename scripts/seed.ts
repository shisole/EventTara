/**
 * EventTara - Database Seed Script
 *
 * Creates test accounts and events for local development.
 * Uses the Supabase Admin client (service_role key) to bypass RLS.
 *
 * Usage: npm run seed
 */

import { loadEnvConfig } from "@next/env";
import { resolve, dirname } from "path";
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
      "Make sure your .env.local file contains both variables."
  );
  process.exit(1);
}

// Safety: prevent running against production
if (SUPABASE_URL.includes("prod") || SUPABASE_URL.includes("production")) {
  console.error("REFUSING to seed against a production database!");
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
  role: "organizer" | "participant" | "guest";
  is_guest?: boolean;
  avatar_url?: string | null;
}

const TEST_USERS: TestUser[] = [
  {
    email: `organizer1${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Marco Santos",
    username: "marco_trails",
    role: "organizer",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `organizer2${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Ana Reyes",
    username: "ana_pedal",
    role: "organizer",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `participant1${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Jake Mendoza",
    username: "jake_adventure",
    role: "participant",
  },
  {
    email: `participant2${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Maria Cruz",
    username: "maria_explorer",
    role: "participant",
  },
  {
    email: `participant3${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Carlos Rivera",
    username: "carlos_hiker",
    role: "participant",
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
    role: "organizer",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `organizer4${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Teri Magbanua",
    username: "ftt_treks",
    role: "organizer",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `organizer5${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Yen Casimiro",
    username: "yenergy_out",
    role: "organizer",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
  },
  {
    email: `organizer6${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Ruben Torres",
    username: "ruborubo",
    role: "organizer",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
  },
];

interface OrgProfile {
  ownerEmail: string;
  org_name: string;
  description: string;
  logo_url: string;
}

const ORGANIZER_PROFILES: OrgProfile[] = [
  {
    ownerEmail: `organizer1${TEST_EMAIL_DOMAIN}`,
    org_name: "Panay Trail Collective",
    description:
      "Exploring the mountains and trails of Panay Island — from the highlands of Igbaras and Tubungan to the summit of Mt. Madja-as. We organize hiking, trail running, and outdoor adventures across Iloilo, Antique, and beyond.",
    logo_url:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
  },
  {
    ownerEmail: `organizer2${TEST_EMAIL_DOMAIN}`,
    org_name: "Iloilo Pedal Club",
    description:
      "Road cycling and mountain biking events across Panay Island. From the coastal roads of Iloilo-Antique to the highland trails of Tubungan and Guimaras, we bring the Western Visayas cycling community together.",
    logo_url:
      "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=200&h=200&fit=crop",
  },
  {
    ownerEmail: `organizer3${TEST_EMAIL_DOMAIN}`,
    org_name: "JTT (Journey Through Trails)",
    description:
      "Journey Through Trails — discovering the hidden paths of Panay Island one trail at a time. We organize weekend hikes, multi-day treks, and trail exploration events across Iloilo, Antique, and Capiz.",
    logo_url:
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=200&h=200&fit=crop",
  },
  {
    ownerEmail: `organizer4${TEST_EMAIL_DOMAIN}`,
    org_name: "Five Tersty Trekkers",
    description:
      "Five friends turned trail community — Five Tersty Trekkers brings the fun to every mountain adventure. From Igbaras to Antique, we hike with energy, laughter, and lots of water (we're always thirsty!).",
    logo_url:
      "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=200&h=200&fit=crop",
  },
  {
    ownerEmail: `organizer5${TEST_EMAIL_DOMAIN}`,
    org_name: "Yenergy Outdoors",
    description:
      "Fueled by positive energy! Yenergy Outdoors organizes hiking, trail running, and outdoor fitness events across Western Visayas. We believe every mountain is a chance to recharge your soul.",
    logo_url:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop",
  },
  {
    ownerEmail: `organizer6${TEST_EMAIL_DOMAIN}`,
    org_name: "Rubo-rubo Lang",
    description:
      "Rubo-rubo lang — just wandering! A laid-back hiking community that explores the trails of Panay at our own pace. No pressure, no rush. Just good vibes, good views, and good company.",
    logo_url:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop",
  },
];

// Unsplash cover images for different event types
const COVER_IMAGES = {
  hiking:
    "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&h=630&fit=crop",
  trail_run:
    "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&h=630&fit=crop",
  road_bike:
    "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1200&h=630&fit=crop",
  mtb: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1200&h=630&fit=crop",
  running:
    "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=1200&h=630&fit=crop",
  hiking_alt:
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=630&fit=crop",
  trail_run_alt:
    "https://images.unsplash.com/photo-1510227272981-87123e259b17?w=1200&h=630&fit=crop",
  mtb_alt:
    "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=630&fit=crop",
  hiking_alt2:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop",
  road_bike_alt:
    "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=1200&h=630&fit=crop",
  running_alt:
    "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=1200&h=630&fit=crop",
};

interface TestEvent {
  orgProfileName: string;
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
}

const TEST_EVENTS: TestEvent[] = [
  // ---- Organizer 1: Panay Trail Collective ----
  {
    orgProfileName: "Panay Trail Collective",
    title: "Mt. Madja-as Summit Trek",
    description:
      "Conquer the highest peak on Panay Island! This 2-day guided trek to the summit of Mt. Madja-as (2,117m) in Antique takes you through mossy forest, cloud forest, and exposed ridgelines with panoramic views of the Visayan Sea. Includes guide, porter, campsite fee, and meals. Bring cold-weather gear — summit temperatures can drop to single digits!",
    type: "hiking",
    date: daysFromNow(14),
    location: "Mt. Madja-as, Culasi, Antique",
    coordinates: { lat: 11.3850, lng: 122.0600 },
    max_participants: 20,
    price: 2500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    orgProfileName: "Panay Trail Collective",
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
  },
  {
    orgProfileName: "Panay Trail Collective",
    title: "Igbaras Mountain Day Hike",
    description:
      "Explore the lush mountains of Igbaras, the hiking capital of Iloilo. This beginner-friendly day hike takes you past Nadsadan Falls and through dense tropical forest to a scenic ridge overlooking the town and the Panay Gulf. Perfect for first-timers. Includes guide, lunch, and river dip at the falls.",
    type: "hiking",
    date: daysFromNow(-14),
    location: "Igbaras, Iloilo",
    coordinates: { lat: 10.7200, lng: 122.2700 },
    max_participants: 35,
    price: 350,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Panay Trail Collective",
    title: "Mt. Nangtud Expedition",
    description:
      "Attempt the second highest peak in Panay — Mt. Nangtud (2,073m) in the deep mountains of Antique. This 3-day expedition through virgin forest and steep ridges is strictly for experienced mountaineers. All-inclusive: guides, porters, camping gear, and all meals from basecamp to summit.",
    type: "trail_run",
    date: daysFromNow(45),
    location: "Mt. Nangtud, Sebaste, Antique",
    coordinates: { lat: 11.3500, lng: 122.0200 },
    max_participants: 15,
    price: 3500,
    status: "draft",
    cover_image_url: COVER_IMAGES.trail_run_alt,
  },
  // ---- Organizer 2: Iloilo Pedal Club ----
  {
    orgProfileName: "Iloilo Pedal Club",
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
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Tubungan Highlands MTB",
    description:
      "Take on the highland trails of Tubungan, Iloilo on a mountain bike. Rolling single tracks through farmlands, river crossings, and steep climbs with rewarding views of the surrounding mountains. This intermediate-level MTB event includes mechanical support, local lunch, and a cold spring dip. Hardtail or full-suspension recommended.",
    type: "mtb",
    date: daysFromNow(14),
    location: "Tubungan, Iloilo",
    coordinates: { lat: 10.7500, lng: 122.3000 },
    max_participants: 25,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Iloilo Esplanade Night Run 10K",
    description:
      "Run the iconic Iloilo Esplanade at night! This 10K night run takes you along the beautifully lit riverside boardwalk, through the streets of Mandurriao, and past the Iloilo Business Park. Open to all fitness levels. Includes race kit, LED armband, finisher medal, and post-run street food festival. The best way to experience Iloilo City after dark.",
    type: "running",
    date: daysFromNow(7),
    location: "Esplanade, Iloilo City",
    coordinates: { lat: 10.7130, lng: 122.5650 },
    max_participants: 100,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Guimaras Island MTB Adventure",
    description:
      "Cross the Iloilo Strait by boat and explore Guimaras Island on mountain bikes. Scenic coastal trails, mango plantation roads, and rolling hills make this a unique island MTB experience. Includes boat transfer, park entrance, lunch, and mechanical support. Don't miss the fresh mangoes at the finish!",
    type: "mtb",
    date: daysFromNow(35),
    location: "Guimaras Island",
    coordinates: { lat: 10.5880, lng: 122.6280 },
    max_participants: 20,
    price: 900,
    status: "cancelled",
    cover_image_url: COVER_IMAGES.mtb_alt,
  },
  // ---- Past / Completed Events ----
  // Panay Trail Collective
  {
    orgProfileName: "Panay Trail Collective",
    title: "Nadsadan Falls Day Hike",
    description:
      "A refreshing day hike to the multi-tiered Nadsadan Falls in Igbaras, Iloilo. Trek through bamboo groves and river trails to reach the stunning cascade. Includes guide, packed lunch, and plenty of time for swimming in the crystal-clear pools. A perfect weekend escape from the city.",
    type: "hiking",
    date: daysFromNow(-21),
    location: "Nadsadan Falls, Igbaras, Iloilo",
    coordinates: { lat: 10.7150, lng: 122.2650 },
    max_participants: 30,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    orgProfileName: "Panay Trail Collective",
    title: "Miag-ao Heritage Trail Run",
    description:
      "A scenic 21K trail run starting from the UNESCO World Heritage Miag-ao Church, through coastal paths, rice paddies, and the rolling hills of southern Iloilo. Experience history and nature combined. Includes finisher medal, hydration stations, and a heritage town tour post-race.",
    type: "trail_run",
    date: daysFromNow(-45),
    location: "Miag-ao, Iloilo",
    coordinates: { lat: 10.6440, lng: 122.2340 },
    max_participants: 50,
    price: 650,
    status: "completed",
    cover_image_url: COVER_IMAGES.trail_run_alt,
  },
  {
    orgProfileName: "Panay Trail Collective",
    title: "Mt. Malinao Summit Hike",
    description:
      "Trek to the summit of Mt. Malinao (1,610m) in Aklan, the sacred mountain of the Ati people. This challenging day hike passes through old-growth forest and mossy trails. On a clear day, the summit offers views of Boracay Island, the Sibuyan Sea, and the Antique mountain range. Guide and packed meals included.",
    type: "hiking",
    date: daysFromNow(-75),
    location: "Mt. Malinao, Malinao, Aklan",
    coordinates: { lat: 11.6900, lng: 122.1800 },
    max_participants: 20,
    price: 1200,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  // Iloilo Pedal Club
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Panay Circumferential Road Ride",
    description:
      "The ultimate Panay cycling challenge — a 2-day 300km road ride around the entire island. Day 1: Iloilo to Roxas City via Capiz coast. Day 2: Roxas to Kalibo to Antique and back to Iloilo. Fully supported with SAG wagons, aid stations, overnight accommodation, and meals. For serious cyclists only.",
    type: "road_bike",
    date: daysFromNow(-30),
    location: "Panay Island Circumferential",
    coordinates: { lat: 11.0000, lng: 122.5000 },
    max_participants: 30,
    price: 2500,
    status: "completed",
    cover_image_url: COVER_IMAGES.road_bike_alt,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Malalison Island Trail Ride",
    description:
      "Take a boat to the remote Malalison Island off the coast of Culasi, Antique, and explore its rugged trails on mountain bikes. Coastal cliffs, white sand coves, and challenging rocky terrain make this a one-of-a-kind MTB experience. Includes boat transfer, island guide, lunch, and beach time.",
    type: "mtb",
    date: daysFromNow(-60),
    location: "Malalison Island, Culasi, Antique",
    coordinates: { lat: 11.4400, lng: 121.9600 },
    max_participants: 15,
    price: 1500,
    status: "completed",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Iloilo City Fun Run 5K",
    description:
      "A beginner-friendly 5K fun run through the streets of Iloilo City. Starting at the Iloilo Esplanade, the route passes by the iconic Molo Church, through the tree-lined streets of Jaro, and finishes at SM City Iloilo. Perfect for first-time runners and families. Includes race bib, finisher medal, and free La Paz batchoy at the finish!",
    type: "running",
    date: daysFromNow(-90),
    location: "Iloilo City",
    coordinates: { lat: 10.6920, lng: 122.5640 },
    max_participants: 200,
    price: 250,
    status: "completed",
    cover_image_url: COVER_IMAGES.running_alt,
  },
  // ---- Organizer 3: JTT (Journey Through Trails) ----
  {
    orgProfileName: "JTT (Journey Through Trails)",
    title: "Igbaras-Tubungan Traverse",
    description:
      "A challenging day traverse connecting the mountain trails of Igbaras and Tubungan. Start from Brgy. Passi in Igbaras, cross the ridgeline, and descend into the highlands of Tubungan. Roughly 18km of trail through farmland, forest, and river valleys. For experienced hikers. Guide and lunch included.",
    type: "hiking",
    date: daysFromNow(10),
    location: "Igbaras to Tubungan, Iloilo",
    coordinates: { lat: 10.7350, lng: 122.2850 },
    max_participants: 25,
    price: 450,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    orgProfileName: "JTT (Journey Through Trails)",
    title: "Bacolod de Tubungan Heritage Hike",
    description:
      "Discover the old Spanish-era ruins and mountain trails around Bacolod de Tubungan. This easy-to-moderate hike explores the historical sites and natural springs of one of Iloilo's hidden gems. Guide, snacks, and local history briefing included.",
    type: "hiking",
    date: daysFromNow(-35),
    location: "Tubungan, Iloilo",
    coordinates: { lat: 10.7480, lng: 122.3100 },
    max_participants: 30,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  // ---- Organizer 4: Five Tersty Trekkers ----
  {
    orgProfileName: "Five Tersty Trekkers",
    title: "Pan de Azucar Island Day Trek",
    description:
      "Trek to the summit of Pan de Azucar (Sugar Loaf) island off the coast of Concepcion, Iloilo. A boat ride across turquoise waters leads to a steep but rewarding climb with 360-degree views of the Visayan Sea. Includes boat transfer, guide, and island picnic lunch.",
    type: "hiking",
    date: daysFromNow(18),
    location: "Pan de Azucar Island, Concepcion, Iloilo",
    coordinates: { lat: 11.2700, lng: 123.0800 },
    max_participants: 20,
    price: 700,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Five Tersty Trekkers",
    title: "Baloy Falls Adventure Hike",
    description:
      "Trek through the jungles of San Joaquin to reach the stunning Baloy Falls — a multi-tiered cascade hidden deep in the mountains of southern Iloilo. River crossings, rope sections, and jungle trails make this an exciting adventure for intermediate hikers. Guide and packed lunch included.",
    type: "hiking",
    date: daysFromNow(-50),
    location: "San Joaquin, Iloilo",
    coordinates: { lat: 10.5900, lng: 122.2100 },
    max_participants: 20,
    price: 400,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  // ---- Organizer 5: Yenergy Outdoors ----
  {
    orgProfileName: "Yenergy Outdoors",
    title: "Mt. Napulak Sunrise Hike",
    description:
      "Catch the sunrise from the summit of Mt. Napulak in Igbaras, one of the most accessible peaks in Iloilo. Start the pre-dawn hike at 3 AM and reach the summit just in time for golden hour. Includes guide, headlamps, and breakfast at the summit. Perfect for all fitness levels.",
    type: "hiking",
    date: daysFromNow(5),
    location: "Mt. Napulak, Igbaras, Iloilo",
    coordinates: { lat: 10.7100, lng: 122.2800 },
    max_participants: 30,
    price: 350,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    orgProfileName: "Yenergy Outdoors",
    title: "Calinog Highland Trail Run 15K",
    description:
      "A 15K trail run through the rolling highlands of Calinog, Iloilo. Pass through coffee plantations, river crossings, and open grasslands with views of the central Panay mountain range. Includes finisher medal, hydration stations, and a post-run recovery meal. Moderate difficulty.",
    type: "trail_run",
    date: daysFromNow(-25),
    location: "Calinog, Iloilo",
    coordinates: { lat: 10.8500, lng: 122.3500 },
    max_participants: 40,
    price: 500,
    status: "completed",
    cover_image_url: COVER_IMAGES.trail_run,
  },
  // ---- Organizer 6: Rubo-rubo Lang ----
  {
    orgProfileName: "Rubo-rubo Lang",
    title: "Garin Farm Hilltop Hike",
    description:
      "A relaxed day hike to the famous Garin Farm hilltop in San Joaquin, Iloilo. Climb the 456 steps to the heavenly garden replica with views of the coastline and surrounding mountains. Perfect for families and casual hikers. Includes farm entrance, guide, and organic lunch.",
    type: "hiking",
    date: daysFromNow(12),
    location: "Garin Farm, San Joaquin, Iloilo",
    coordinates: { lat: 10.5950, lng: 122.1950 },
    max_participants: 40,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Rubo-rubo Lang",
    title: "Anini-y Coastal Trail Walk",
    description:
      "A chill coastal trail walk along the cliffs and beaches of Anini-y, Antique. No rush, no pressure — just a relaxing 8km walk with ocean views, tide pools, and a seafood lunch by the beach. The rubo-rubo (wandering) way of hiking.",
    type: "hiking",
    date: daysFromNow(-40),
    location: "Anini-y, Antique",
    coordinates: { lat: 10.4600, lng: 121.9500 },
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
    orgProfileName: "Panay Trail Collective",
    title: "Mt. Baloy Ridge Traverse",
    description:
      "A full-day ridge traverse across Mt. Baloy in San Joaquin, Iloilo. Exposed ridgeline hiking with views of the Panay Gulf and surrounding farmlands. Intermediate difficulty.",
    type: "hiking",
    date: daysFromNow(8),
    location: "San Joaquin, Iloilo",
    coordinates: { lat: 10.5950, lng: 122.2000 },
    max_participants: 25,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    orgProfileName: "Panay Trail Collective",
    title: "Cabatuan River Trail Run 10K",
    description:
      "A scenic 10K trail run following the river systems of Cabatuan, Iloilo. Flat-to-rolling terrain through rice paddies and riverside paths. Beginner-friendly.",
    type: "trail_run",
    date: daysFromNow(16),
    location: "Cabatuan, Iloilo",
    coordinates: { lat: 10.8600, lng: 122.4900 },
    max_participants: 50,
    price: 350,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run,
  },
  {
    orgProfileName: "Panay Trail Collective",
    title: "Janiuay Highlands Day Hike",
    description:
      "Explore the rolling highlands of Janiuay with panoramic views of central Panay. Easy-to-moderate day hike through farmlands and forest patches.",
    type: "hiking",
    date: daysFromNow(-10),
    location: "Janiuay, Iloilo",
    coordinates: { lat: 10.9500, lng: 122.5000 },
    max_participants: 30,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    orgProfileName: "Panay Trail Collective",
    title: "Lambunao Waterfall Trek",
    description:
      "Trek to the hidden waterfalls of Lambunao in the interior mountains of Iloilo. Multiple cascades, jungle trails, and natural swimming pools.",
    type: "hiking",
    date: daysFromNow(25),
    location: "Lambunao, Iloilo",
    coordinates: { lat: 10.9400, lng: 122.3700 },
    max_participants: 20,
    price: 450,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Panay Trail Collective",
    title: "Passi City River Run 5K",
    description:
      "A quick 5K fun run through the streets and riverbanks of Passi City. Great for beginners and families. Post-run pancit molo feast included!",
    type: "running",
    date: daysFromNow(-55),
    location: "Passi City, Iloilo",
    coordinates: { lat: 11.1100, lng: 122.6400 },
    max_participants: 80,
    price: 200,
    status: "completed",
    cover_image_url: COVER_IMAGES.running,
  },
  // ---- Iloilo Pedal Club ----
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Oton-Tigbauan Coastal Ride",
    description:
      "A beginner-friendly 40km coastal road ride from Oton to Tigbauan and back. Flat terrain, ocean views, and a seafood lunch stop in Tigbauan.",
    type: "road_bike",
    date: daysFromNow(6),
    location: "Oton to Tigbauan, Iloilo",
    coordinates: { lat: 10.6900, lng: 122.4800 },
    max_participants: 40,
    price: 300,
    status: "published",
    cover_image_url: COVER_IMAGES.road_bike,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Santa Barbara Farm MTB",
    description:
      "Mountain biking through the agricultural flatlands and gentle hills of Santa Barbara. Easy trails perfect for MTB beginners. Includes farm tour and fresh produce snacks.",
    type: "mtb",
    date: daysFromNow(20),
    location: "Santa Barbara, Iloilo",
    coordinates: { lat: 10.8200, lng: 122.5300 },
    max_participants: 30,
    price: 350,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Dumangas Century Ride",
    description:
      "A 100km endurance road ride from Iloilo City to Dumangas and back via the national highway. For intermediate to advanced riders. SAG support provided.",
    type: "road_bike",
    date: daysFromNow(-20),
    location: "Iloilo City to Dumangas",
    coordinates: { lat: 10.8300, lng: 122.7100 },
    max_participants: 30,
    price: 600,
    status: "completed",
    cover_image_url: COVER_IMAGES.road_bike_alt,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Jaro Heritage Night Ride",
    description:
      "An evening bike ride through the heritage district of Jaro, Iloilo. Visit the Jaro Cathedral, old mansions, and the Jaro belfry illuminated at night. Casual pace, all bike types welcome.",
    type: "road_bike",
    date: daysFromNow(32),
    location: "Jaro, Iloilo City",
    coordinates: { lat: 10.7200, lng: 122.5700 },
    max_participants: 50,
    price: 150,
    status: "published",
    cover_image_url: COVER_IMAGES.road_bike,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Pavia Sprint Duathlon",
    description:
      "Run 5K, bike 20K, run 2.5K! A beginner-friendly sprint duathlon in the flat roads of Pavia, Iloilo. Transition area and timing chip provided.",
    type: "running",
    date: daysFromNow(-65),
    location: "Pavia, Iloilo",
    coordinates: { lat: 10.7700, lng: 122.5500 },
    max_participants: 60,
    price: 500,
    status: "completed",
    cover_image_url: COVER_IMAGES.running_alt,
  },
  // ---- JTT (Journey Through Trails) ----
  {
    orgProfileName: "JTT (Journey Through Trails)",
    title: "Capiz River Valley Trail",
    description:
      "Explore the lush river valleys of Capiz province. A moderate day hike following the Panay River through dense forest and traditional farming communities.",
    type: "hiking",
    date: daysFromNow(22),
    location: "Tapaz, Capiz",
    coordinates: { lat: 11.2600, lng: 122.5200 },
    max_participants: 20,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    orgProfileName: "JTT (Journey Through Trails)",
    title: "Maasin Watershed Trail Hike",
    description:
      "Hike through the protected Maasin Watershed in Iloilo. Dense canopy, bird-watching, and pristine streams in one of the last remaining lowland forests of Panay.",
    type: "hiking",
    date: daysFromNow(-8),
    location: "Maasin, Iloilo",
    coordinates: { lat: 10.8300, lng: 122.4300 },
    max_participants: 20,
    price: 350,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "JTT (Journey Through Trails)",
    title: "Aklan Mountain Loop Trail Run",
    description:
      "A challenging 25K trail loop through the mountains of Aklan. River crossings, steep ascents, and jungle trails through Ati ancestral lands.",
    type: "trail_run",
    date: daysFromNow(40),
    location: "Malinao, Aklan",
    coordinates: { lat: 11.6900, lng: 122.1800 },
    max_participants: 30,
    price: 700,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run_alt,
  },
  {
    orgProfileName: "JTT (Journey Through Trails)",
    title: "Leon River Trail Walk",
    description:
      "A relaxed river trail walk through Leon, Iloilo. Follow the cool mountain streams past small waterfalls and swimming holes. Perfect for families.",
    type: "hiking",
    date: daysFromNow(-70),
    location: "Leon, Iloilo",
    coordinates: { lat: 10.7800, lng: 122.3700 },
    max_participants: 35,
    price: 250,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  // ---- Five Tersty Trekkers ----
  {
    orgProfileName: "Five Tersty Trekkers",
    title: "Concepcion Island Hop & Hike",
    description:
      "Island hop across the Concepcion archipelago and hike the island peaks. Visit Agho, Malangaban, and Bulubadiangan islands. Snorkeling, hiking, and beach camping combo.",
    type: "hiking",
    date: daysFromNow(30),
    location: "Concepcion, Iloilo",
    coordinates: { lat: 11.2500, lng: 123.0900 },
    max_participants: 15,
    price: 1200,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Five Tersty Trekkers",
    title: "Sicogon Island Beach Run",
    description:
      "A barefoot 10K beach run on the white sands of Sicogon Island, Concepcion. Run along pristine coastline with turquoise waters. Includes boat transfer and beach lunch.",
    type: "running",
    date: daysFromNow(15),
    location: "Sicogon Island, Concepcion, Iloilo",
    coordinates: { lat: 11.3400, lng: 123.1700 },
    max_participants: 30,
    price: 800,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
  },
  {
    orgProfileName: "Five Tersty Trekkers",
    title: "Dingle Forest Trail Hike",
    description:
      "A shaded forest hike through the hills of Dingle, Iloilo. Cool temperatures, bird sounds, and a hidden spring at the turnaround point.",
    type: "hiking",
    date: daysFromNow(-28),
    location: "Dingle, Iloilo",
    coordinates: { lat: 10.9900, lng: 122.6600 },
    max_participants: 25,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    orgProfileName: "Five Tersty Trekkers",
    title: "Tigbauan Coastal Trail Run 12K",
    description:
      "A 12K coastal trail run from Tigbauan to Guimbal along rocky shoreline paths and fishing village trails. Ocean spray and sea breeze included!",
    type: "trail_run",
    date: daysFromNow(38),
    location: "Tigbauan, Iloilo",
    coordinates: { lat: 10.6700, lng: 122.3800 },
    max_participants: 35,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run,
  },
  // ---- Yenergy Outdoors ----
  {
    orgProfileName: "Yenergy Outdoors",
    title: "Alimodian Sunrise Trail Run",
    description:
      "Chase the sunrise on the trails of Alimodian! A 10K morning trail run through rolling hills and open grasslands with views of Mt. Napulak.",
    type: "trail_run",
    date: daysFromNow(9),
    location: "Alimodian, Iloilo",
    coordinates: { lat: 10.8200, lng: 122.4000 },
    max_participants: 35,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run,
  },
  {
    orgProfileName: "Yenergy Outdoors",
    title: "SM City to Esplanade Fun Run",
    description:
      "A feel-good 5K fun run from SM City Iloilo to the Esplanade and back. Music, energy drinks, and good vibes. Open to all ages and fitness levels.",
    type: "running",
    date: daysFromNow(3),
    location: "Iloilo City",
    coordinates: { lat: 10.7130, lng: 122.5650 },
    max_participants: 150,
    price: 250,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
  },
  {
    orgProfileName: "Yenergy Outdoors",
    title: "Pototan Highland Hike",
    description:
      "Discover the hidden highlands of Pototan, Iloilo. A moderate day hike through sugarcane fields and forest patches to a scenic overlook.",
    type: "hiking",
    date: daysFromNow(-15),
    location: "Pototan, Iloilo",
    coordinates: { lat: 10.9400, lng: 122.6300 },
    max_participants: 25,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    orgProfileName: "Yenergy Outdoors",
    title: "Barotac Viejo Mountain Bike Tour",
    description:
      "A scenic MTB tour through the mountains of Barotac Viejo. Intermediate trails through bamboo forest, river crossings, and hillside farmlands.",
    type: "mtb",
    date: daysFromNow(27),
    location: "Barotac Viejo, Iloilo",
    coordinates: { lat: 10.9900, lng: 122.7700 },
    max_participants: 20,
    price: 450,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    orgProfileName: "Yenergy Outdoors",
    title: "Mandurriao Fitness Run 5K",
    description:
      "A high-energy 5K run through Mandurriao district and Iloilo Business Park. DJ at the finish line, free energy drinks, and fun activities.",
    type: "running",
    date: daysFromNow(-85),
    location: "Mandurriao, Iloilo City",
    coordinates: { lat: 10.7200, lng: 122.5600 },
    max_participants: 100,
    price: 300,
    status: "completed",
    cover_image_url: COVER_IMAGES.running_alt,
  },
  // ---- Rubo-rubo Lang ----
  {
    orgProfileName: "Rubo-rubo Lang",
    title: "Guimbal Lighthouse Walk",
    description:
      "A chill coastal walk from Guimbal town proper to the old lighthouse ruins. Scenic cliffs, tide pools, and a seafood lunch at a local carinderia. Zero rush.",
    type: "hiking",
    date: daysFromNow(11),
    location: "Guimbal, Iloilo",
    coordinates: { lat: 10.6600, lng: 122.3200 },
    max_participants: 30,
    price: 250,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Rubo-rubo Lang",
    title: "Miag-ao River & Rice Paddy Walk",
    description:
      "Wander through the iconic rice terraces and river trails of Miag-ao. A slow-paced community walk with stops for local snacks and storytelling.",
    type: "hiking",
    date: daysFromNow(19),
    location: "Miag-ao, Iloilo",
    coordinates: { lat: 10.6440, lng: 122.2340 },
    max_participants: 25,
    price: 200,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    orgProfileName: "Rubo-rubo Lang",
    title: "San Joaquin Sunset Beach Walk",
    description:
      "A leisurely 5km sunset beach walk along the shores of San Joaquin. Watch the sun set over the Panay Gulf with good company and cold drinks.",
    type: "hiking",
    date: daysFromNow(-5),
    location: "San Joaquin, Iloilo",
    coordinates: { lat: 10.5800, lng: 122.1800 },
    max_participants: 30,
    price: 150,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    orgProfileName: "Rubo-rubo Lang",
    title: "Cabugao Islet Snorkel & Walk",
    description:
      "Boat to Cabugao Islet near Carles and combine a short island walk with snorkeling in the marine sanctuary. Pure island vibes, no agenda.",
    type: "hiking",
    date: daysFromNow(42),
    location: "Carles, Iloilo",
    coordinates: { lat: 11.5700, lng: 123.1500 },
    max_participants: 15,
    price: 900,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Rubo-rubo Lang",
    title: "Iloilo Riverside Morning Walk",
    description:
      "A peaceful morning walk along the Iloilo River esplanade. Stop for coffee, watch the boats, and enjoy the sunrise over the city. The most chill event on the calendar.",
    type: "running",
    date: daysFromNow(-32),
    location: "Iloilo City Esplanade",
    coordinates: { lat: 10.6950, lng: 122.5650 },
    max_participants: 40,
    price: 0,
    status: "completed",
    cover_image_url: COVER_IMAGES.running,
  },
  // ---- More variety across organizers ----
  {
    orgProfileName: "Panay Trail Collective",
    title: "Dumarao Caves Exploration",
    description:
      "Explore the cave systems of Dumarao, Capiz. A unique spelunking and hiking combo through limestone formations and underground rivers.",
    type: "hiking",
    date: daysFromNow(50),
    location: "Dumarao, Capiz",
    coordinates: { lat: 11.2700, lng: 122.6700 },
    max_participants: 15,
    price: 800,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    orgProfileName: "Iloilo Pedal Club",
    title: "Roxas City Coastal Ride",
    description:
      "A scenic 60km road ride exploring the coastal roads of Roxas City, Capiz. Flat terrain, fresh seafood stops, and views of the Sibuyan Sea.",
    type: "road_bike",
    date: daysFromNow(35),
    location: "Roxas City, Capiz",
    coordinates: { lat: 11.5850, lng: 122.7510 },
    max_participants: 35,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.road_bike_alt,
  },
  {
    orgProfileName: "JTT (Journey Through Trails)",
    title: "Hamtic River Gorge Trek",
    description:
      "A thrilling gorge trek through the narrow river valleys of Hamtic, Antique. Waist-deep river crossings, rock scrambling, and jungle canopy. For adventurous hikers only.",
    type: "hiking",
    date: daysFromNow(17),
    location: "Hamtic, Antique",
    coordinates: { lat: 10.7000, lng: 121.9800 },
    max_participants: 15,
    price: 550,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Five Tersty Trekkers",
    title: "Badiangan Sunrise MTB",
    description:
      "An early morning MTB ride through the quiet roads and trails of Badiangan at sunrise. Gentle terrain, misty mornings, and local coffee at the turnaround.",
    type: "mtb",
    date: daysFromNow(24),
    location: "Badiangan, Iloilo",
    coordinates: { lat: 10.9200, lng: 122.5500 },
    max_participants: 20,
    price: 300,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb_alt,
  },
  {
    orgProfileName: "Yenergy Outdoors",
    title: "Iloilo Marathon Relay",
    description:
      "Form a team of 4 and relay a full marathon distance across Iloilo City! Each runner covers ~10.5km. Fun, fast, and team-spirited.",
    type: "running",
    date: daysFromNow(48),
    location: "Iloilo City",
    coordinates: { lat: 10.7000, lng: 122.5600 },
    max_participants: 120,
    price: 600,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
  },
  {
    orgProfileName: "Rubo-rubo Lang",
    title: "Sibalom Natural Park Wander",
    description:
      "A leisurely walk through Sibalom Natural Park in Antique. Old-growth forest, rare bird species, and the gentle pace of a rubo-rubo walk.",
    type: "hiking",
    date: daysFromNow(55),
    location: "Sibalom, Antique",
    coordinates: { lat: 10.7700, lng: 121.9900 },
    max_participants: 20,
    price: 400,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking_alt2,
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
  const testUsers =
    authUsers?.users?.filter((u) =>
      u.email?.endsWith(TEST_EMAIL_DOMAIN)
    ) ?? [];

  if (testUsers.length === 0) {
    log("✅", "No existing test data found.");
    return;
  }

  log("🗑️", `Found ${testUsers.length} existing test users. Removing...`);

  // Deleting auth users cascades to public.users, which cascades to bookings,
  // checkins, user_badges etc. We need to also clean up organizer_profiles,
  // events, badges etc. that are linked through organizer_profiles.
  // Because events FK to organizer_profiles (which FK to public.users),
  // deleting public.users cascades everything.
  // Clean app testimonials (not tied to user cascade)
  await supabase.from("app_testimonials").delete().neq("id", "00000000-0000-0000-0000-000000000000");

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
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
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
      console.error(
        `  Failed to update public.users for ${user.email}: ${updateError.message}`
      );
    } else {
      log("  ✅", `${user.full_name} (${user.email}) - ${user.role}`);
    }
  }

  return userMap;
}

/** Create organizer profiles. Returns map of org_name -> profile id. */
async function createOrganizerProfiles(
  userMap: Map<string, string>
): Promise<Map<string, string>> {
  log("🏢", "Creating organizer profiles...");

  const orgMap = new Map<string, string>();

  for (const profile of ORGANIZER_PROFILES) {
    const userId = userMap.get(profile.ownerEmail);
    if (!userId) {
      console.error(`  User not found for ${profile.ownerEmail}`);
      continue;
    }

    const { data, error } = await supabase
      .from("organizer_profiles")
      .insert({
        user_id: userId,
        org_name: profile.org_name,
        description: profile.description,
        logo_url: profile.logo_url,
        payment_info: {
          gcash_number: "09171234567",
          maya_number: "09181234567",
        },
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        `  Failed to create org profile "${profile.org_name}": ${error.message}`
      );
    } else {
      orgMap.set(profile.org_name, data.id);
      log("  ✅", `${profile.org_name}`);
    }
  }

  return orgMap;
}

/** Create events. Returns map of event title -> event id. */
async function createEvents(
  orgMap: Map<string, string>
): Promise<Map<string, string>> {
  log("📅", "Creating events...");

  const eventMap = new Map<string, string>();

  for (const event of TEST_EVENTS) {
    const organizerId = orgMap.get(event.orgProfileName);
    if (!organizerId) {
      console.error(`  Org profile not found: ${event.orgProfileName}`);
      continue;
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        organizer_id: organizerId,
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
      })
      .select("id")
      .single();

    if (error) {
      console.error(
        `  Failed to create event "${event.title}": ${error.message}`
      );
    } else {
      eventMap.set(event.title, data.id);
      log("  ✅", `${event.title} [${event.status}]`);
    }
  }

  return eventMap;
}

/** Create bookings with QR codes. Returns map of "userEmail:eventTitle" -> bookingId. */
async function createBookings(
  userMap: Map<string, string>,
  eventMap: Map<string, string>
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
        `  Missing user or event for booking: ${booking.userEmail} -> ${booking.eventTitle}`
      );
      continue;
    }

    // QR code: issued for paid, cash, and confirmed bookings; not for pending e-wallet
    const isEwallet = booking.payment_method === "gcash" || booking.payment_method === "maya";
    const isPendingEwallet = isEwallet && booking.payment_status !== "paid";
    const qrCode = isPendingEwallet ? null : `eventtara:checkin:${eventId}:${userId}`;

    const { data, error } = await supabase.from("bookings").insert({
      event_id: eventId,
      user_id: userId,
      status: booking.status,
      payment_status: booking.payment_status,
      payment_method: booking.payment_method,
      qr_code: qrCode,
    }).select("id").single();

    if (error) {
      console.error(
        `  Failed to create booking (${booking.userEmail} -> ${booking.eventTitle}): ${error.message}`
      );
    } else {
      bookingMap.set(`${booking.userEmail}:${booking.eventTitle}`, data.id);
      const userName = booking.userEmail.split("@")[0];
      log(
        "  ✅",
        `${userName} -> ${booking.eventTitle} [${booking.status}/${booking.payment_status}]`
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
  category: 'distance' | 'adventure' | 'location' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const BADGE_DEFS: BadgeDef[] = [
  // Published events — pre-created by organizers
  {
    eventTitle: "Mt. Madja-as Summit Trek",
    title: "Madja-as Summiteer",
    description:
      "Conquered the highest peak on Panay Island — Mt. Madja-as at 2,117m. You earned this above the clouds.",
    image_url:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "epic",
  },
  {
    eventTitle: "Bucari Pine Forest Trail Run",
    title: "Bucari Trailblazer",
    description:
      "Ran through the highland pine forests of Bucari at 900m elevation. A unique Visayan trail experience!",
    image_url:
      "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "rare",
  },
  {
    eventTitle: "Iloilo Esplanade Night Run 10K",
    title: "Esplanade Night Runner",
    description:
      "Finished the Iloilo Esplanade Night Run 10K under the city lights. You owned the riverside!",
    image_url:
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=200&h=200&fit=crop",
    category: "distance",
    rarity: "common",
  },
  {
    eventTitle: "Iloilo-Antique Coastal Road Ride",
    title: "Coastal Road Warrior",
    description:
      "Completed the 120km coastal ride from Iloilo to Antique. Your legs earned this one!",
    image_url:
      "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=200&h=200&fit=crop",
    category: "distance",
    rarity: "rare",
  },
  {
    eventTitle: "Tubungan Highlands MTB",
    title: "Tubungan MTB Crusher",
    description:
      "Conquered the highland trails and river crossings of Tubungan on two wheels. Mountain biker certified!",
    image_url:
      "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "epic",
  },
  {
    eventTitle: "Mt. Napulak Sunrise Hike",
    title: "Napulak Sunrise Chaser",
    description:
      "Caught the sunrise from Mt. Napulak's summit. The early morning trek was worth every step!",
    image_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "rare",
  },
  // Completed event badges
  {
    eventTitle: "Igbaras Mountain Day Hike",
    title: "Igbaras Hiker",
    description:
      "Explored the lush mountains of Igbaras, the hiking capital of Iloilo. A true Panay adventurer!",
    image_url:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "common",
  },
  {
    eventTitle: "Nadsadan Falls Day Hike",
    title: "Nadsadan Falls Explorer",
    description:
      "Trekked through bamboo groves to reach the stunning Nadsadan Falls. You earned a river dip!",
    image_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "common",
  },
  {
    eventTitle: "Miag-ao Heritage Trail Run",
    title: "Miag-ao Heritage Runner",
    description:
      "Ran 21K from the UNESCO Heritage Miag-ao Church through rice paddies and coastal paths. History meets endurance!",
    image_url:
      "https://images.unsplash.com/photo-1510227272981-87123e259b17?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "rare",
  },
  {
    eventTitle: "Mt. Malinao Summit Hike",
    title: "Mt. Malinao Summiteer",
    description:
      "Stood on the sacred summit of Mt. Malinao in Aklan with views of Boracay and the Sibuyan Sea. Legendary!",
    image_url:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
    category: "adventure",
    rarity: "legendary",
  },
  {
    eventTitle: "Panay Circumferential Road Ride",
    title: "Panay Circuit Finisher",
    description:
      "Pedaled 300km around the entire island of Panay in 2 days. Your legs are legends.",
    image_url:
      "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=200&h=200&fit=crop",
    category: "distance",
    rarity: "epic",
  },
  {
    eventTitle: "Malalison Island Trail Ride",
    title: "Malalison Island Rider",
    description:
      "Rode through coastal cliffs and white sand coves on the remote Malalison Island. Island MTB at its finest!",
    image_url:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
    category: "location",
    rarity: "rare",
  },
  {
    eventTitle: "Iloilo City Fun Run 5K",
    title: "Iloilo Fun Runner",
    description:
      "Crossed the finish line at the Iloilo City 5K. Every adventure starts with the first stride — and a bowl of La Paz batchoy!",
    image_url:
      "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=200&h=200&fit=crop",
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
      `guest${TEST_EMAIL_DOMAIN}`,        // Guest
    ],
  },
];

/** Create badges for events. */
async function createBadges(
  eventMap: Map<string, string>
): Promise<Map<string, string>> {
  log("🏅", "Creating badges...");

  const badgeMap = new Map<string, string>();

  for (const badge of BADGE_DEFS) {
    const eventId = eventMap.get(badge.eventTitle);
    if (!eventId) {
      console.error(`  Event not found for badge "${badge.title}", skipping.`);
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
async function awardBadges(
  userMap: Map<string, string>,
  badgeMap: Map<string, string>
) {
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
  { eventTitle: "Igbaras Mountain Day Hike",          daysAgo: 14, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Nadsadan Falls Day Hike",            daysAgo: 21, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Calinog Highland Trail Run 15K",     daysAgo: 25, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Panay Circumferential Road Ride",    daysAgo: 30, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Bacolod de Tubungan Heritage Hike",  daysAgo: 35, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Anini-y Coastal Trail Walk",         daysAgo: 40, userEmails: [`participant2${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Miag-ao Heritage Trail Run",         daysAgo: 45, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Baloy Falls Adventure Hike",         daysAgo: 50, userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Malalison Island Trail Ride",        daysAgo: 60, userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant1${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Mt. Malinao Summit Hike",            daysAgo: 75, userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Iloilo City Fun Run 5K",             daysAgo: 90, userEmails: [`participant2${TEST_EMAIL_DOMAIN}`, `guest${TEST_EMAIL_DOMAIN}`] },
];

/** Create check-ins for all completed events. */
async function createCheckins(
  userMap: Map<string, string>,
  eventMap: Map<string, string>
) {
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
        console.error(`  Failed to create check-in for ${email} at "${def.eventTitle}": ${error.message}`);
      } else {
        const name = TEST_USERS.find((u) => u.email === email)?.full_name;
        log("  ✅", `${name} checked in at ${def.eventTitle}`);
      }
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
    companions: [
      { full_name: "Sofia Reyes", phone: "09199876543" },
    ],
  },
  // Carlos has a pending booking to Bucari with 1 companion (pending e-wallet — no QR yet)
  {
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Bucari Pine Forest Trail Run",
    companions: [
      { full_name: "Daniel Torres", phone: "09201234567" },
    ],
  },
  // Carlos brought a friend to Esplanade Night Run (cash/pending — companions get QR codes)
  {
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Iloilo Esplanade Night Run 10K",
    companions: [
      { full_name: "Andrea Santos", phone: "" },
    ],
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
    text: "As someone new to MTB, I was nervous about joining group rides. EventTara's booking system was seamless, and the Iloilo Pedal Club organizers were so welcoming.",
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
    text: "Finally a platform that brings the Western Visayas cycling community together. The QR check-in system is super convenient for organizers and participants alike.",
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
async function createCompanions(
  bookingMap: Map<string, string>,
  eventMap: Map<string, string>
) {
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
      const { data, error } = await supabase
        .from("booking_companions")
        .insert({
          booking_id: bookingId,
          full_name: comp.full_name,
          phone: comp.phone || null,
          qr_code: null, // set below if applicable
        })
        .select("id")
        .single();

      if (error) {
        console.error(`  Failed to create companion "${comp.full_name}": ${error.message}`);
        continue;
      }

      // Generate QR code for paid or cash bookings (not pending e-wallet)
      if (!isPendingEwallet) {
        const qrCode = `eventtara:checkin:${eventId}:companion:${data.id}`;
        await supabase
          .from("booking_companions")
          .update({ qr_code: qrCode })
          .eq("id", data.id);
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

async function seedEventReviews(
  userMap: Map<string, string>,
  eventMap: Map<string, string>
) {
  log("⭐", "Creating event reviews...");

  for (const review of REVIEW_DEFS) {
    const userId = userMap.get(review.userEmail);
    const eventId = eventMap.get(review.eventTitle);
    if (!userId || !eventId) {
      console.error(`  Missing user or event for review: ${review.userEmail} -> ${review.eventTitle}`);
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
async function createGuides(
  userMap: Map<string, string>
): Promise<Map<string, string>> {
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
  eventMap: Map<string, string>
): Promise<void> {
  log("🔗", "Linking guides to events...");

  for (const link of TEST_EVENT_GUIDES) {
    const guideId = guideMap.get(link.guideName);
    const eventId = eventMap.get(link.eventTitle);
    if (!guideId || !eventId) {
      console.error(
        `  Missing guide or event for link: ${link.guideName} -> ${link.eventTitle}`
      );
      continue;
    }

    const { error } = await supabase.from("event_guides").insert({
      event_id: eventId,
      guide_id: guideId,
    });

    if (error) {
      console.error(
        `  Failed to link "${link.guideName}" to "${link.eventTitle}": ${error.message}`
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
  eventMap: Map<string, string>
): Promise<void> {
  log("📝", "Creating guide reviews...");

  for (const review of TEST_GUIDE_REVIEWS) {
    const guideId = guideMap.get(review.guideName);
    const userId = userMap.get(review.reviewerEmail);
    const eventId = eventMap.get(review.eventTitle);
    if (!guideId || !userId || !eventId) {
      console.error(
        `  Missing guide, user, or event for guide review: ${review.guideName} <- ${review.reviewerEmail} @ ${review.eventTitle}`
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
      log("  ✅", `${name} reviewed ${review.guideName} @ ${review.eventTitle} (${review.rating}★)`);
    }
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

    // Step 3: Create organizer profiles
    const orgMap = await createOrganizerProfiles(userMap);
    console.log();

    // Step 4: Create events
    const eventMap = await createEvents(orgMap);
    console.log();

    // Step 4b: Create guides
    const guideMap = await createGuides(userMap);
    console.log();

    // Step 4c: Link guides to events
    await linkEventGuides(guideMap, eventMap);
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

    // Step 9: Create app testimonials
    await seedAppTestimonials();
    console.log();

    // Step 10: Create event reviews
    await seedEventReviews(userMap, eventMap);
    console.log();

    // Step 11: Create guide reviews
    await seedGuideReviews(guideMap, userMap, eventMap);
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
