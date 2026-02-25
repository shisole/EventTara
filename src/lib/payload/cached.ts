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
  { revalidate: 60 },
);
