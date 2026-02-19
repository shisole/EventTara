/**
 * EventTara - Database Seed Script
 *
 * Creates test accounts and events for local development.
 * Uses the Supabase Admin client (service_role key) to bypass RLS.
 *
 * Usage: npm run seed
 */

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
  },
  {
    email: `organizer2${TEST_EMAIL_DOMAIN}`,
    password: DEFAULT_PASSWORD,
    full_name: "Ana Reyes",
    username: "ana_pedal",
    role: "organizer",
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
}

const ORGANIZER_PROFILES: OrgProfile[] = [
  {
    ownerEmail: `organizer1${TEST_EMAIL_DOMAIN}`,
    org_name: "Trail Masters PH",
    description:
      "Leading hiking and trail running events across the Philippines. We organize unforgettable outdoor adventures from easy day hikes to challenging multi-day expeditions through the country's most scenic mountains and trails.",
  },
  {
    ownerEmail: `organizer2${TEST_EMAIL_DOMAIN}`,
    org_name: "Pedal Republic",
    description:
      "Mountain biking and road cycling events for riders of all levels. From scenic road loops to adrenaline-pumping MTB trails, we bring the cycling community together for epic rides and races.",
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
};

interface TestEvent {
  orgProfileName: string;
  title: string;
  description: string;
  type: "hiking" | "mtb" | "road_bike" | "running" | "trail_run";
  date: string;
  location: string;
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
    max_participants: 25,
    price: 700,
    status: "cancelled",
    cover_image_url: COVER_IMAGES.mtb_alt,
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
        payment_info: {
          gcash: { name: profile.org_name, number: "0917-XXX-XXXX" },
          maya: { name: profile.org_name, number: "0918-XXX-XXXX" },
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

/** Create bookings with QR codes. */
async function createBookings(
  userMap: Map<string, string>,
  eventMap: Map<string, string>
) {
  log("🎫", "Creating bookings...");

  interface BookingDef {
    userEmail: string;
    eventTitle: string;
    status: "pending" | "confirmed" | "cancelled";
    payment_status: "pending" | "paid" | "refunded";
    payment_method: "gcash" | "maya" | null;
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
      payment_method: null,
    },
    // Guest's booking
    {
      userEmail: `guest${TEST_EMAIL_DOMAIN}`,
      eventTitle: "BGC Night Run 10K",
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

    const qrCode = `eventtara:checkin:${eventId}:${userId}`;

    const { error } = await supabase.from("bookings").insert({
      event_id: eventId,
      user_id: userId,
      status: booking.status,
      payment_status: booking.payment_status,
      payment_method: booking.payment_method,
      qr_code: qrCode,
    });

    if (error) {
      console.error(
        `  Failed to create booking (${booking.userEmail} -> ${booking.eventTitle}): ${error.message}`
      );
    } else {
      const userName = booking.userEmail.split("@")[0];
      log(
        "  ✅",
        `${userName} -> ${booking.eventTitle} [${booking.status}/${booking.payment_status}]`
      );
    }
  }
}

/** Create badges for the completed event. */
async function createBadges(
  eventMap: Map<string, string>
): Promise<Map<string, string>> {
  log("🏅", "Creating badges...");

  const badgeMap = new Map<string, string>();
  const taalEventId = eventMap.get("Taal Volcano Day Hike");

  if (!taalEventId) {
    console.error("  Taal Volcano event not found, skipping badges.");
    return badgeMap;
  }

  const { data, error } = await supabase
    .from("badges")
    .insert({
      event_id: taalEventId,
      title: "Taal Volcano Summit Badge",
      description:
        "Awarded to participants who completed the Taal Volcano Day Hike and reached the crater rim.",
      image_url:
        "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=200&h=200&fit=crop",
    })
    .select("id")
    .single();

  if (error) {
    console.error(`  Failed to create badge: ${error.message}`);
  } else {
    badgeMap.set("Taal Volcano Summit Badge", data.id);
    log("  ✅", "Taal Volcano Summit Badge");
  }

  return badgeMap;
}

/** Award badges to participants. */
async function awardBadges(
  userMap: Map<string, string>,
  badgeMap: Map<string, string>
) {
  log("🎖️", "Awarding badges...");

  const taalBadgeId = badgeMap.get("Taal Volcano Summit Badge");
  if (!taalBadgeId) {
    console.error("  Badge not found, skipping awards.");
    return;
  }

  const awardees = [
    `participant1${TEST_EMAIL_DOMAIN}`, // Jake
    `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
  ];

  for (const email of awardees) {
    const userId = userMap.get(email);
    if (!userId) continue;

    const { error } = await supabase.from("user_badges").insert({
      user_id: userId,
      badge_id: taalBadgeId,
    });

    if (error) {
      console.error(
        `  Failed to award badge to ${email}: ${error.message}`
      );
    } else {
      const name = TEST_USERS.find((u) => u.email === email)?.full_name;
      log("  ✅", `${name} received "Taal Volcano Summit Badge"`);
    }
  }
}

/** Create check-ins for the completed event. */
async function createCheckins(
  userMap: Map<string, string>,
  eventMap: Map<string, string>
) {
  log("📋", "Creating check-ins...");

  const taalEventId = eventMap.get("Taal Volcano Day Hike");
  if (!taalEventId) {
    console.error("  Taal Volcano event not found, skipping check-ins.");
    return;
  }

  const checkinUsers = [
    `participant1${TEST_EMAIL_DOMAIN}`, // Jake
    `participant3${TEST_EMAIL_DOMAIN}`, // Carlos
  ];

  // Check-in time was during the event (past date)
  const checkinDate = new Date();
  checkinDate.setDate(checkinDate.getDate() - 14);
  checkinDate.setHours(7, 30, 0, 0);

  for (const email of checkinUsers) {
    const userId = userMap.get(email);
    if (!userId) continue;

    const { error } = await supabase.from("event_checkins").insert({
      event_id: taalEventId,
      user_id: userId,
      checked_in_at: checkinDate.toISOString(),
      method: "manual",
    });

    if (error) {
      console.error(
        `  Failed to create check-in for ${email}: ${error.message}`
      );
    } else {
      const name = TEST_USERS.find((u) => u.email === email)?.full_name;
      log("  ✅", `${name} checked in at Taal Volcano Day Hike`);
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
    await createBookings(userMap, eventMap);
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
