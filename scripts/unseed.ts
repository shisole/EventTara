/**
 * EventTara - Database Unseed (Cleanup) Script
 *
 * Removes all test data created by the seed script.
 * Deletes auth users with @test.eventtara.com emails, which cascades
 * to public.users, organizer_profiles, events, bookings, badges, etc.
 *
 * Usage: npm run unseed
 */

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { loadEnvironment } from "./load-env";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvironment(projectRoot);

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
    `\n  WARNING: You are about to UNSEED (delete test data from) the database at:\n  ${SUPABASE_URL}\n\n` +
      "  This will delete all @test.eventtara.com accounts and their data.\n" +
      "  Run with --yes to confirm:\n\n" +
      "    pnpm unseed --yes\n",
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_EMAIL_DOMAIN = "@test.eventtara.com";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("  EventTara - Database Unseed (Cleanup) Script");
  console.log("  Target: " + SUPABASE_URL);
  console.log("=".repeat(60));
  console.log();

  const startTime = Date.now();

  try {
    // 1. List all auth users and filter for test accounts
    console.log("Searching for test accounts...");
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error(`Failed to list users: ${listError.message}`);
      process.exit(1);
    }

    const testUsers = authUsers?.users?.filter((u) => u.email?.endsWith(TEST_EMAIL_DOMAIN)) ?? [];

    if (testUsers.length === 0) {
      console.log("No test accounts found. Nothing to clean up.");
      return;
    }

    console.log(`Found ${testUsers.length} test account(s) to remove:\n`);
    for (const user of testUsers) {
      console.log(`  - ${user.email} (${user.id})`);
    }
    console.log();

    // 2. Clean non-cascading tables (not tied to auth user FK)
    console.log("Cleaning app_testimonials...");
    await supabase
      .from("app_testimonials")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // 3. Snapshot badges before cascade (event badges get wiped when events are deleted)
    console.log("Saving badges snapshot...");
    const { data: badgeSnapshot } = await supabase
      .from("badges")
      .select("title, description, image_url, category, rarity, type, criteria_key");
    const savedBadges = badgeSnapshot ?? [];
    console.log(`  Saved ${savedBadges.length} badge(s).`);

    // 4. Pre-clean references that block auth user deletion (no CASCADE FK)
    const testUserIds = testUsers.map((u) => u.id);
    console.log("Pre-cleaning non-cascading references...");

    // payment_verified_by on bookings has no ON DELETE CASCADE — null it out
    const { error: pvErr } = await supabase
      .from("bookings")
      .update({ payment_verified_by: null })
      .in("payment_verified_by", testUserIds);
    if (pvErr) {
      console.log(`  Skipped bookings.payment_verified_by: ${pvErr.message}`);
    }

    // 5. Delete each test user (cascades through FK constraints)
    //    auth.users -> public.users -> organizer_profiles -> events -> bookings,
    //    badges, user_badges, event_checkins, event_photos, event_reviews
    console.log("Deleting test accounts and all associated data...\n");

    let deleted = 0;
    let failed = 0;

    for (const user of testUsers) {
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) {
        console.error(`  FAILED: ${user.email} - ${error.message}`);
        failed++;
      } else {
        console.log(`  Deleted: ${user.email}`);
        deleted++;
      }
    }

    // 6. Restore badges (mountains survive since they have no FK to events/users)
    if (savedBadges.length > 0) {
      console.log("Restoring badges...");
      let restored = 0;
      for (const badge of savedBadges) {
        // System badges: upsert by criteria_key; event badges: insert without event_id
        if (badge.type === "system" && badge.criteria_key) {
          const { data: existing } = await supabase
            .from("badges")
            .select("id")
            .eq("criteria_key", badge.criteria_key)
            .single();
          if (!existing) {
            const { error } = await supabase.from("badges").insert(badge);
            if (!error) restored++;
          }
        } else {
          // Event badges — re-insert without event_id (will be re-linked on next seed)
          const { error } = await supabase.from("badges").insert({
            title: badge.title,
            description: badge.description,
            image_url: badge.image_url,
            category: badge.category,
            rarity: badge.rarity,
            type: "system",
            criteria_key: `event_badge_${badge.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_")}`,
          });
          if (!error) restored++;
        }
      }
      console.log(`  Restored ${restored} badge(s).`);
    }

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log();
    console.log("=".repeat(60));
    console.log(`  Cleanup completed in ${elapsed}s: ${deleted} deleted, ${failed} failed.`);
    console.log("=".repeat(60));

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("\nUnseed failed with an unexpected error:");
    console.error(err);
    process.exit(1);
  }
}

main();
