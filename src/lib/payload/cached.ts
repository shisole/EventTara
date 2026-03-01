import { unstable_cache } from "next/cache";

import { getPayloadClient } from "./client";

/**
 * Cached Payload CMS site-settings fetch.
 * Revalidates every 60 seconds to avoid blocking TTFB on every page load.
 */
export const getCachedSiteSettings = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.findGlobal({ slug: "site-settings" });
    } catch {
      return null;
    }
  },
  ["site-settings"],
  { revalidate: 60 },
);

/**
 * Cached Payload CMS feature-flags fetch.
 * Revalidates every 30 seconds so admin toggles propagate quickly.
 */
export const getCachedFeatureFlags = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.findGlobal({ slug: "feature-flags" });
    } catch {
      return null;
    }
  },
  ["feature-flags"],
  { revalidate: 30 },
);

/**
 * Returns whether the activity feed feature flag is enabled.
 * Defaults to false when Payload is unreachable.
 */
export async function isActivityFeedEnabled(): Promise<boolean> {
  try {
    const flags = await getCachedFeatureFlags();
    return flags?.activityFeed === true;
  } catch {
    return false;
  }
}

/**
 * Cached Payload CMS hero-carousel fetch.
 * Revalidates every 60 seconds.
 */
export const getCachedHeroCarousel = unstable_cache(
  async () => {
    try {
      const payload = await getPayloadClient();
      return await payload.findGlobal({ slug: "hero-carousel" });
    } catch {
      return null;
    }
  },
  ["hero-carousel"],
  { revalidate: 300 },
);
