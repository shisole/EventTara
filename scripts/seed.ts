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
    org_name: "Trail Masters PH",
    description:
      "Leading hiking and trail running events across the Philippines. We organize unforgettable outdoor adventures from easy day hikes to challenging multi-day expeditions through the country's most scenic mountains and trails.",
    logo_url:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&h=200&fit=crop",
  },
  {
    ownerEmail: `organizer2${TEST_EMAIL_DOMAIN}`,
    org_name: "Pedal Republic",
    description:
      "Mountain biking and road cycling events for riders of all levels. From scenic road loops to adrenaline-pumping MTB trails, we bring the cycling community together for epic rides and races.",
    logo_url:
      "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=200&h=200&fit=crop",
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
  // ---- Organizer 1: Trail Masters PH ----
  {
    orgProfileName: "Trail Masters PH",
    title: "Mt. Pulag Sunrise Hike",
    description:
      "Experience the breathtaking sea of clouds at the summit of Mt. Pulag, the third highest peak in the Philippines. This guided sunrise hike follows the Ambangeg Trail, the easiest route to the summit. Includes campsite fee, guide, and hot breakfast. Bring warm clothes - temperatures can drop below zero!",
    type: "hiking",
    date: daysFromNow(14),
    location: "Mt. Pulag, Benguet",
    coordinates: { lat: 16.5917, lng: 120.8983 },
    max_participants: 30,
    price: 500,
    status: "published",
    cover_image_url: COVER_IMAGES.hiking,
  },
  {
    orgProfileName: "Trail Masters PH",
    title: "Masungi Georeserve Trail Run",
    description:
      "Run through the stunning karst landscape of Masungi Georeserve in Rizal. This trail run takes you through rope courses, hanging bridges, and breathtaking viewpoints. A unique combination of trail running and nature exploration. Includes park entrance fee and hydration stations.",
    type: "trail_run",
    date: daysFromNow(30),
    location: "Masungi Georeserve, Rizal",
    coordinates: { lat: 14.5785, lng: 121.3419 },
    max_participants: 25,
    price: 800,
    status: "published",
    cover_image_url: COVER_IMAGES.trail_run,
  },
  {
    orgProfileName: "Trail Masters PH",
    title: "Taal Volcano Day Hike",
    description:
      "A classic day hike to Taal Volcano, the smallest active volcano in the world. Enjoy panoramic views of Taal Lake from the crater rim. This beginner-friendly hike includes boat ride, guide, and refreshments. Perfect for first-time hikers!",
    type: "hiking",
    date: daysFromNow(-14),
    location: "Taal Volcano, Batangas",
    coordinates: { lat: 14.0113, lng: 120.9980 },
    max_participants: 40,
    price: 350,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt,
  },
  {
    orgProfileName: "Trail Masters PH",
    title: "Sierra Madre Trail Challenge",
    description:
      "Take on the ultimate trail running challenge in the Sierra Madre mountain range. A grueling 25K course through dense forest, river crossings, and steep climbs. Only for experienced trail runners. Finisher medals and post-race feast included.",
    type: "trail_run",
    date: daysFromNow(45),
    location: "Sierra Madre, Rizal",
    coordinates: { lat: 14.7500, lng: 121.4500 },
    max_participants: 20,
    price: 1200,
    status: "draft",
    cover_image_url: COVER_IMAGES.trail_run_alt,
  },
  // ---- Organizer 2: Pedal Republic ----
  {
    orgProfileName: "Pedal Republic",
    title: "Tagaytay Road Bike Loop",
    description:
      "Ride the scenic Tagaytay loop with stunning views of Taal Lake. This 80km road cycling event follows the classic route through Nasugbu, Tagaytay, and back. Includes SAG support vehicle, hydration stops, and post-ride meal. Road bikes recommended.",
    type: "road_bike",
    date: daysFromNow(21),
    location: "Tagaytay, Cavite",
    coordinates: { lat: 14.1153, lng: 120.9621 },
    max_participants: 35,
    price: 600,
    status: "published",
    cover_image_url: COVER_IMAGES.road_bike,
  },
  {
    orgProfileName: "Pedal Republic",
    title: "Mt. Banahaw MTB Adventure",
    description:
      "Explore the mystical trails of Mt. Banahaw on a mountain bike. Technical single tracks, river crossings, and challenging climbs await. This intermediate-level MTB event includes mechanical support, lunch, and a commemorative jersey.",
    type: "mtb",
    date: daysFromNow(30),
    location: "Mt. Banahaw, Quezon",
    coordinates: { lat: 14.0692, lng: 121.4887 },
    max_participants: 20,
    price: 900,
    status: "published",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    orgProfileName: "Pedal Republic",
    title: "BGC Night Run 10K",
    description:
      "Hit the streets of BGC for a fun 10K night run! Run through the vibrant nightlife of Bonifacio Global City with live music, LED armbands, and a post-run party. Open to all fitness levels. Includes race kit, finisher medal, and event shirt.",
    type: "running",
    date: daysFromNow(14),
    location: "Bonifacio Global City, Taguig",
    coordinates: { lat: 14.5547, lng: 121.0509 },
    max_participants: 100,
    price: 450,
    status: "published",
    cover_image_url: COVER_IMAGES.running,
  },
  {
    orgProfileName: "Pedal Republic",
    title: "Subic MTB Trail Ride",
    description:
      "An MTB trail ride through the forests of Subic Bay Freeport Zone. Rolling hills, flowing single tracks, and wide fire roads make this perfect for intermediate riders. Includes park entrance and post-ride refreshments.",
    type: "mtb",
    date: daysFromNow(28),
    location: "Subic Bay Freeport Zone, Zambales",
    coordinates: { lat: 14.7943, lng: 120.2832 },
    max_participants: 25,
    price: 700,
    status: "cancelled",
    cover_image_url: COVER_IMAGES.mtb_alt,
  },
  // ---- Past / Completed Events ----
  // Trail Masters PH
  {
    orgProfileName: "Trail Masters PH",
    title: "Mt. Pinatubo Crater Hike",
    description:
      "Trek through the lahar-covered landscapes of Mt. Pinatubo and gaze into one of the world's most dramatic volcanic craters. The turquoise crater lake at the summit is an unforgettable sight. Includes 4x4 ride, guide, lunch, and crater fee.",
    type: "hiking",
    date: daysFromNow(-30),
    location: "Mt. Pinatubo, Tarlac",
    coordinates: { lat: 15.1429, lng: 120.3496 },
    max_participants: 35,
    price: 650,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking_alt2,
  },
  {
    orgProfileName: "Trail Masters PH",
    title: "Bataan Death March Trail Run",
    description:
      "A historic 21K trail run along the routes of the Bataan Death March. Pay tribute to heroes while pushing your limits through jungle terrain and rolling hills. A deeply meaningful race that combines history and athleticism. Finisher medal included.",
    type: "trail_run",
    date: daysFromNow(-60),
    location: "Mt. Samat, Bataan",
    coordinates: { lat: 14.5700, lng: 120.4400 },
    max_participants: 40,
    price: 750,
    status: "completed",
    cover_image_url: COVER_IMAGES.trail_run_alt,
  },
  {
    orgProfileName: "Trail Masters PH",
    title: "Mt. Apo Summit Trek",
    description:
      "Stand on the highest point in the Philippines! This 3-day guided trek to the summit of Mt. Apo takes you through cloud forest, sulfuric vents, and stunning ridgelines. All-inclusive package: guide, porter, meals, and camping gear provided.",
    type: "hiking",
    date: daysFromNow(-90),
    location: "Mt. Apo, Davao del Sur",
    coordinates: { lat: 6.9871, lng: 125.2710 },
    max_participants: 15,
    price: 4500,
    status: "completed",
    cover_image_url: COVER_IMAGES.hiking,
  },
  // Pedal Republic
  {
    orgProfileName: "Pedal Republic",
    title: "Clark-Subic Gran Fondo",
    description:
      "A classic 120km road cycling gran fondo from Clark Freeport to Subic Bay. Rolling terrain through Bataan's scenic countryside with fully supported aid stations every 20km. Chip timing, SAG wagons, and a post-ride barbecue feast await finishers.",
    type: "road_bike",
    date: daysFromNow(-30),
    location: "Clark Freeport Zone, Pampanga",
    coordinates: { lat: 15.1861, lng: 120.5467 },
    max_participants: 60,
    price: 1100,
    status: "completed",
    cover_image_url: COVER_IMAGES.road_bike_alt,
  },
  {
    orgProfileName: "Pedal Republic",
    title: "Corregidor Island MTB Ride",
    description:
      "Explore the historic island fortress of Corregidor on mountain bikes. Winding trails through WWII ruins, bunkers, and coastal cliffs create an unforgettable riding experience. Ferry ride and island entrance fee included.",
    type: "mtb",
    date: daysFromNow(-60),
    location: "Corregidor Island, Manila Bay",
    coordinates: { lat: 14.3814, lng: 120.5747 },
    max_participants: 20,
    price: 1800,
    status: "completed",
    cover_image_url: COVER_IMAGES.mtb,
  },
  {
    orgProfileName: "Pedal Republic",
    title: "Quezon City Fun Run 5K",
    description:
      "A beginner-friendly 5K fun run through the tree-lined streets of Quezon City Memorial Circle. Perfect for first-time runners and families. Includes race bib, finisher medal, and free breakfast at the finish line.",
    type: "running",
    date: daysFromNow(-90),
    location: "QC Memorial Circle, Quezon City",
    coordinates: { lat: 14.6518, lng: 121.0492 },
    max_participants: 200,
    price: 250,
    status: "completed",
    cover_image_url: COVER_IMAGES.running_alt,
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
    // Jake's bookings
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Pulag Sunrise Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Tagaytay Road Bike Loop",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Taal Volcano Day Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Maria's bookings
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Pulag Sunrise Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "BGC Night Run 10K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    // Carlos's bookings
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Taal Volcano Day Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Masungi Georeserve Trail Run",
      status: "pending",
      payment_status: "pending",
      payment_method: "gcash",
    },
    // Cash booking — pending, pays on event day
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "BGC Night Run 10K",
      status: "pending",
      payment_status: "pending",
      payment_method: "cash",
    },
    // Rejected payment — needs re-upload
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Tagaytay Road Bike Loop",
      status: "pending",
      payment_status: "rejected",
      payment_method: "maya",
    },
    // Guest's booking
    {
      userEmail: `guest${TEST_EMAIL_DOMAIN}`,
      eventTitle: "BGC Night Run 10K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // ---- Past event bookings ----
    // Mt. Pinatubo Crater Hike (-30 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Pinatubo Crater Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Pinatubo Crater Hike",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    // Bataan Death March Trail Run (-60 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Bataan Death March Trail Run",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Bataan Death March Trail Run",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Mt. Apo Summit Trek (-90 days)
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Apo Summit Trek",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Mt. Apo Summit Trek",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Clark-Subic Gran Fondo (-30 days)
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Clark-Subic Gran Fondo",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "maya",
    },
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Clark-Subic Gran Fondo",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Corregidor Island MTB Ride (-60 days)
    {
      userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Corregidor Island MTB Ride",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Corregidor Island MTB Ride",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    // Quezon City Fun Run 5K (-90 days)
    {
      userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Quezon City Fun Run 5K",
      status: "confirmed",
      payment_status: "paid",
      payment_method: "gcash",
    },
    {
      userEmail: `guest${TEST_EMAIL_DOMAIN}`,
      eventTitle: "Quezon City Fun Run 5K",
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
}

const BADGE_DEFS: BadgeDef[] = [
  // Completed event — Taal Volcano Day Hike
  {
    eventTitle: "Taal Volcano Day Hike",
    title: "Taal Volcano Summit Badge",
    description:
      "Awarded to participants who completed the Taal Volcano Day Hike and reached the crater rim.",
    image_url:
      "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=200&h=200&fit=crop",
  },
  // Published events — pre-created by organizers
  {
    eventTitle: "Mt. Pulag Sunrise Hike",
    title: "Sea of Clouds Chaser",
    description:
      "Awarded to those who conquered Mt. Pulag and witnessed the legendary sunrise above the sea of clouds.",
    image_url:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "Masungi Georeserve Trail Run",
    title: "Masungi Trailblazer",
    description:
      "You ran through the karst limestone landscape of Masungi Georeserve. Nature's obstacle course conquered!",
    image_url:
      "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "BGC Night Run 10K",
    title: "BGC Night Runner",
    description:
      "Finished the BGC Night Run 10K in the city lights of Bonifacio Global City. You owned the night!",
    image_url:
      "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "Tagaytay Road Bike Loop",
    title: "Tagaytay Road Warrior",
    description:
      "Completed the scenic 80km Tagaytay loop with views of Taal Lake. Your legs earned this one.",
    image_url:
      "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "Mt. Banahaw MTB Adventure",
    title: "Banahaw MTB Crusher",
    description:
      "Conquered the technical single tracks and river crossings of the mystical Mt. Banahaw on two wheels.",
    image_url:
      "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=200&h=200&fit=crop",
  },
  // Past event badges
  {
    eventTitle: "Mt. Pinatubo Crater Hike",
    title: "Pinatubo Crater Explorer",
    description:
      "You hiked through volcanic lahar fields and reached the legendary turquoise crater lake of Mt. Pinatubo.",
    image_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "Bataan Death March Trail Run",
    title: "Bataan Trailblazer",
    description:
      "Completed the historic 21K Bataan Death March Trail Run — honoring heroes through every step.",
    image_url:
      "https://images.unsplash.com/photo-1510227272981-87123e259b17?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "Mt. Apo Summit Trek",
    title: "Mt. Apo Summiteer",
    description:
      "You stood on the highest point in the Philippines. The roof of the archipelago is yours.",
    image_url:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "Clark-Subic Gran Fondo",
    title: "Gran Fondo Finisher",
    description:
      "Pedaled 120km from Clark to Subic Bay through the hills of Bataan. Your legs are legends.",
    image_url:
      "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "Corregidor Island MTB Ride",
    title: "Corregidor Island Rider",
    description:
      "Rode through WWII ruins and coastal cliffs on the historic island fortress of Corregidor.",
    image_url:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop",
  },
  {
    eventTitle: "Quezon City Fun Run 5K",
    title: "QC Fun Runner",
    description:
      "Crossed the finish line at the QC Memorial Circle 5K. Every adventure starts with the first stride!",
    image_url:
      "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=200&h=200&fit=crop",
  },
];

interface BadgeAwardDef {
  badgeTitle: string;
  userEmails: string[];
}

const BADGE_AWARDS: BadgeAwardDef[] = [
  {
    badgeTitle: "Taal Volcano Summit Badge",
    userEmails: [
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
      `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
    ],
  },
  {
    badgeTitle: "Pinatubo Crater Explorer",
    userEmails: [
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
      `participant2${TEST_EMAIL_DOMAIN}`, // Maria
    ],
  },
  {
    badgeTitle: "Bataan Trailblazer",
    userEmails: [
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
      `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
    ],
  },
  {
    badgeTitle: "Mt. Apo Summiteer",
    userEmails: [
      `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
      `participant2${TEST_EMAIL_DOMAIN}`, // Maria
    ],
  },
  {
    badgeTitle: "Gran Fondo Finisher",
    userEmails: [
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
      `participant2${TEST_EMAIL_DOMAIN}`, // Maria
    ],
  },
  {
    badgeTitle: "Corregidor Island Rider",
    userEmails: [
      `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
      `participant1${TEST_EMAIL_DOMAIN}`, // Jake
    ],
  },
  {
    badgeTitle: "QC Fun Runner",
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
  { eventTitle: "Taal Volcano Day Hike",         daysAgo: 14, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Mt. Pinatubo Crater Hike",       daysAgo: 30, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Bataan Death March Trail Run",   daysAgo: 60, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant3${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Mt. Apo Summit Trek",            daysAgo: 90, userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Clark-Subic Gran Fondo",         daysAgo: 30, userEmails: [`participant1${TEST_EMAIL_DOMAIN}`, `participant2${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Corregidor Island MTB Ride",     daysAgo: 60, userEmails: [`participant3${TEST_EMAIL_DOMAIN}`, `participant1${TEST_EMAIL_DOMAIN}`] },
  { eventTitle: "Quezon City Fun Run 5K",         daysAgo: 90, userEmails: [`participant2${TEST_EMAIL_DOMAIN}`, `guest${TEST_EMAIL_DOMAIN}`] },
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
  // Jake brought 2 friends to Mt. Pulag (confirmed/paid — companions get QR codes)
  {
    userEmail: `participant1${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Mt. Pulag Sunrise Hike",
    companions: [
      { full_name: "Rico Dela Cruz", phone: "09171112233" },
      { full_name: "Jen Villanueva", phone: "09181234567" },
    ],
  },
  // Maria brought 1 friend to BGC Night Run (confirmed/paid)
  {
    userEmail: `participant2${TEST_EMAIL_DOMAIN}`,
    eventTitle: "BGC Night Run 10K",
    companions: [
      { full_name: "Sofia Reyes", phone: "09199876543" },
    ],
  },
  // Carlos has a pending booking to Masungi with 1 companion (pending e-wallet — no QR yet)
  {
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "Masungi Georeserve Trail Run",
    companions: [
      { full_name: "Daniel Torres", phone: "09201234567" },
    ],
  },
  // Carlos brought a friend to BGC Night Run (cash/pending — companions get QR codes)
  {
    userEmail: `participant3${TEST_EMAIL_DOMAIN}`,
    eventTitle: "BGC Night Run 10K",
    companions: [
      { full_name: "Andrea Santos", phone: "" },
    ],
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
