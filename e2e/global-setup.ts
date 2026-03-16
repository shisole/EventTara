import { cleanupE2EData } from "./cleanup";

/**
 * Playwright global setup — cleans up stale E2E test data BEFORE tests run.
 * Prevents overlap conflicts from bookings left by previous crashed/failed runs.
 */
export default async function globalSetup() {
  await cleanupE2EData("setup");
}
