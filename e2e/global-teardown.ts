import { createClient } from "@supabase/supabase-js";

/**
 * Playwright global teardown — cleans up stale E2E test data.
 * Catches leftovers from crashed runs, CI retries, and previously accumulated data.
 * Requires SUPABASE_SERVICE_ROLE_KEY; skips silently if not set.
 */
export default async function globalTeardown() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.log("[e2e teardown] Skipping cleanup — missing SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const supabase = createClient(url, serviceKey);

  // Delete stale E2E events first (FK to clubs)
  const { error: eventsError, count: eventsCount } = await supabase
    .from("events")
    .delete({ count: "exact" })
    .like("title", "E2E Test Event%");

  if (eventsError) {
    console.error("[e2e teardown] Failed to delete E2E events:", eventsError.message);
  } else if (eventsCount && eventsCount > 0) {
    console.log(`[e2e teardown] Deleted ${String(eventsCount)} stale E2E event(s)`);
  }

  // Delete stale E2E clubs
  const { error: clubsError, count: clubsCount } = await supabase
    .from("clubs")
    .delete({ count: "exact" })
    .like("name", "E2E Test Club%");

  if (clubsError) {
    console.error("[e2e teardown] Failed to delete E2E clubs:", clubsError.message);
  } else if (clubsCount && clubsCount > 0) {
    console.log(`[e2e teardown] Deleted ${String(clubsCount)} stale E2E club(s)`);
  }
}
