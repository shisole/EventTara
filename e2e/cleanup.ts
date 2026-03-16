import { createClient } from "@supabase/supabase-js";

/**
 * Cleans up stale E2E test data from the database.
 * Deletes bookings, events, welcome_pages, club_members, and clubs
 * created by E2E tests (matched by name prefix).
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY; skips silently if not set.
 */
export async function cleanupE2EData(label: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.log(`[e2e ${label}] Skipping cleanup — missing SUPABASE_SERVICE_ROLE_KEY`);
    return;
  }

  const supabase = createClient(url, serviceKey);

  // Find stale E2E event IDs first (needed to delete bookings)
  const { data: staleEvents } = await supabase
    .from("events")
    .select("id")
    .like("title", "E2E Test Event%");

  if (staleEvents && staleEvents.length > 0) {
    const eventIds = staleEvents.map((e) => e.id);

    // Delete bookings for stale events (booking_companions cascade-delete via FK)
    const { count: bookingsCount } = await supabase
      .from("bookings")
      .delete({ count: "exact" })
      .in("event_id", eventIds);

    if (bookingsCount && bookingsCount > 0) {
      console.log(`[e2e ${label}] Deleted ${String(bookingsCount)} stale E2E booking(s)`);
    }

    // Delete the events
    const { error: eventsError, count: eventsCount } = await supabase
      .from("events")
      .delete({ count: "exact" })
      .in("id", eventIds);

    if (eventsError) {
      console.error(`[e2e ${label}] Failed to delete E2E events:`, eventsError.message);
    } else if (eventsCount && eventsCount > 0) {
      console.log(`[e2e ${label}] Deleted ${String(eventsCount)} stale E2E event(s)`);
    }
  }

  // Find stale E2E clubs, then delete dependent rows before the clubs themselves
  const { data: staleClubs } = await supabase
    .from("clubs")
    .select("id")
    .like("name", "E2E Test Club%");

  if (staleClubs && staleClubs.length > 0) {
    const clubIds = staleClubs.map((c) => c.id);

    // Delete welcome_pages first (FK to clubs)
    await supabase.from("welcome_pages").delete().in("club_id", clubIds);

    // Delete club_members (FK to clubs)
    await supabase.from("club_members").delete().in("club_id", clubIds);

    // Now delete the clubs
    const { error: clubsError, count: clubsCount } = await supabase
      .from("clubs")
      .delete({ count: "exact" })
      .in("id", clubIds);

    if (clubsError) {
      console.error(`[e2e ${label}] Failed to delete E2E clubs:`, clubsError.message);
    } else if (clubsCount && clubsCount > 0) {
      console.log(`[e2e ${label}] Deleted ${String(clubsCount)} stale E2E club(s)`);
    }
  }
}
