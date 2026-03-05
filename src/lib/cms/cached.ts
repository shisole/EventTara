import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { type Database } from "@/lib/supabase/types";

import type {
  CmsFeatureFlags,
  CmsFooterLegalLink,
  CmsFooterSection,
  CmsHeroCarousel,
  CmsHeroSlide,
  CmsHomepageSection,
  CmsHomepageSections,
  CmsNavigation,
  CmsSiteSettings,
} from "./types";

/**
 * Plain anon client for public CMS reads inside unstable_cache.
 * Does NOT use cookies() — safe to call during build / ISR / cache revalidation.
 */
function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Cached site-settings fetch. Revalidates every 60 seconds.
 */
export const getCachedSiteSettings = unstable_cache(
  async (): Promise<CmsSiteSettings | null> => {
    try {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("cms_site_settings")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data as CmsSiteSettings;
    } catch (error) {
      console.error("[CMS] Failed to fetch site settings:", error);
      return null;
    }
  },
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] },
);

/**
 * Cached feature-flags fetch. Revalidates every 30 seconds.
 */
export const getCachedFeatureFlags = unstable_cache(
  async (): Promise<CmsFeatureFlags | null> => {
    try {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("cms_feature_flags")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data as CmsFeatureFlags;
    } catch (error) {
      console.error("[CMS] Failed to fetch feature flags:", error);
      return null;
    }
  },
  ["feature-flags"],
  { revalidate: 30, tags: ["feature-flags"] },
);

/**
 * Returns whether the activity feed feature flag is enabled.
 * Checks env var override first, then falls back to the CMS table.
 */
export async function isActivityFeedEnabled(): Promise<boolean> {
  if (process.env.ACTIVITY_FEED_ENABLED === "true") return true;
  if (process.env.ACTIVITY_FEED_ENABLED === "false") return false;

  try {
    const flags = await getCachedFeatureFlags();
    return flags?.activity_feed === true;
  } catch {
    return false;
  }
}

/**
 * Returns which Strava showcase sub-sections are enabled.
 */
export async function getStravaShowcaseFlags(): Promise<{
  features: boolean;
  stats: boolean;
  routeMap: boolean;
}> {
  try {
    const flags = await getCachedFeatureFlags();
    return {
      features: flags?.strava_showcase_features === true,
      stats: flags?.strava_showcase_stats === true,
      routeMap: flags?.strava_showcase_route_map === true,
    };
  } catch {
    return { features: false, stats: false, routeMap: false };
  }
}

/**
 * Returns whether the events two-column mobile grid is enabled.
 */
export async function isEventsTwoColMobileEnabled(): Promise<boolean> {
  try {
    const flags = await getCachedFeatureFlags();
    return flags?.events_two_col_mobile === true;
  } catch {
    return false;
  }
}

/**
 * Cached hero-carousel fetch. Revalidates every 300 seconds.
 */
export const getCachedHeroCarousel = unstable_cache(
  async (): Promise<CmsHeroCarousel | null> => {
    try {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("cms_hero_carousel")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data as CmsHeroCarousel;
    } catch (error) {
      console.error("[CMS] Failed to fetch hero carousel:", error);
      return null;
    }
  },
  ["hero-carousel"],
  { revalidate: 300, tags: ["hero-carousel"] },
);

/**
 * Cached navigation fetch. Revalidates every 60 seconds.
 */
export const getCachedNavigation = unstable_cache(
  async (): Promise<CmsNavigation | null> => {
    try {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("cms_navigation")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data as CmsNavigation;
    } catch (error) {
      console.error("[CMS] Failed to fetch navigation:", error);
      return null;
    }
  },
  ["navigation"],
  { revalidate: 60, tags: ["navigation"] },
);

/**
 * Cached homepage-sections fetch. Revalidates every 60 seconds.
 */
export const getCachedHomepageSections = unstable_cache(
  async (): Promise<CmsHomepageSections | null> => {
    try {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("cms_homepage_sections")
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data as CmsHomepageSections;
    } catch (error) {
      console.error("[CMS] Failed to fetch homepage sections:", error);
      return null;
    }
  },
  ["homepage-sections"],
  { revalidate: 60, tags: ["homepage-sections"] },
);

/**
 * Parse hero carousel slides from JSONB into typed array.
 */
export function parseHeroSlides(carousel: CmsHeroCarousel | null): CmsHeroSlide[] {
  if (!carousel?.slides || !Array.isArray(carousel.slides)) return [];
  return (carousel.slides as unknown as CmsHeroSlide[]).filter((s) => s.url && s.alt);
}

/**
 * Parse homepage sections from JSONB into typed array, sorted by order.
 */
export function parseHomepageSections(data: CmsHomepageSections | null): CmsHomepageSection[] {
  if (!data?.sections || !Array.isArray(data.sections)) return [];
  return (data.sections as unknown as CmsHomepageSection[])
    .filter((s) => s.key && s.label != null)
    .sort((a, b) => a.order - b.order);
}

/**
 * Returns whether the organizer reviews feature flag is enabled.
 */
export async function isOrganizerReviewsEnabled(): Promise<boolean> {
  try {
    const flags = await getCachedFeatureFlags();
    return flags?.organizer_reviews === true;
  } catch {
    return false;
  }
}

/**
 * Parse footer sections from JSONB into typed array.
 */
export function parseFooterSections(nav: CmsNavigation | null): CmsFooterSection[] {
  if (!nav?.footer_sections || !Array.isArray(nav.footer_sections)) return [];
  return nav.footer_sections as unknown as CmsFooterSection[];
}

/**
 * Parse footer legal links from JSONB into typed array.
 */
export function parseFooterLegalLinks(nav: CmsNavigation | null): CmsFooterLegalLink[] {
  if (!nav?.footer_legal_links || !Array.isArray(nav.footer_legal_links)) return [];
  return nav.footer_legal_links as unknown as CmsFooterLegalLink[];
}
