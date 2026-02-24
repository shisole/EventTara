/**
 * EventTara - Database Unseed (Cleanup) Script
 *
 * Removes all test data created by the seed script.
 * Deletes auth users with @test.eventtara.com emails, which cascades
 * to public.users, organizer_profiles, events, bookings, badges, etc.
 *
 * Usage: npm run unseed
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
      "Make sure your .env.local file contains both variables.",
  );
  process.exit(1);
}

// Safety: prevent running against production
if (SUPABASE_URL.includes("prod") || SUPABASE_URL.includes("production")) {
  console.error("REFUSING to unseed against a production database!");
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

    // 3. Delete each test user (cascades through FK constraints)
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
