import { cleanupE2EData } from "./cleanup";

/**
 * Playwright global teardown — cleans up E2E test data after all tests complete.
 * Catches leftovers from the current run.
 */
export default async function globalTeardown() {
  await cleanupE2EData("teardown");
}
