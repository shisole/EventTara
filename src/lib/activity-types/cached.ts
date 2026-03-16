import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { type ActivityTypeRow } from "./types";

/**
 * Plain anon client for public reads inside unstable_cache.
 * Does NOT use cookies() — safe to call during build / ISR / cache revalidation.
 */
function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Cached activity types fetch (enabled only). Revalidates every 60 seconds.
 */
export const getCachedActivityTypes = unstable_cache(
  async (): Promise<ActivityTypeRow[]> => {
    try {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .eq("enabled", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ActivityTypeRow[];
    } catch (error) {
      console.error("[ActivityTypes] Failed to fetch activity types:", error);
      return [];
    }
  },
  ["activity-types"],
  { revalidate: 60, tags: ["activity-types"] },
);

/**
 * Cached fetch of ALL activity types (including disabled). For admin use.
 * Revalidates every 60 seconds.
 */
export const getCachedAllActivityTypes = unstable_cache(
  async (): Promise<ActivityTypeRow[]> => {
    try {
      const supabase = createAnonClient();
      const { data, error } = await supabase
        .from("activity_types")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ActivityTypeRow[];
    } catch (error) {
      console.error("[ActivityTypes] Failed to fetch all activity types:", error);
      return [];
    }
  },
  ["activity-types-all"],
  { revalidate: 60, tags: ["activity-types"] },
);
