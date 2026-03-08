import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { type Database } from "@/lib/supabase/types";

export interface LeaderboardEntry {
  rank: number;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  metric_value: number;
}

function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Cached leaderboard preview for the homepage.
 * Returns top 7 users by badge count. Revalidates every 60 seconds.
 */
export const getCachedLeaderboardPreview = unstable_cache(
  async (): Promise<LeaderboardEntry[]> => {
    try {
      const supabase = createAnonClient();

      // Get badge counts per user
      const { data: badgeCounts, error: badgeError } = await supabase
        .from("user_badges")
        .select("user_id");

      if (badgeError) throw badgeError;
      if (!badgeCounts || badgeCounts.length === 0) return [];

      // Aggregate badge counts
      const countMap = new Map<string, number>();
      for (const row of badgeCounts) {
        countMap.set(row.user_id, (countMap.get(row.user_id) ?? 0) + 1);
      }

      // Sort by count descending and take top 7
      const topUserIds = [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([id]) => id);

      if (topUserIds.length === 0) return [];

      // Fetch user info for top users
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, full_name, username, avatar_url")
        .in("id", topUserIds)
        .neq("role", "guest");

      if (userError) throw userError;
      if (!users) return [];

      // Build leaderboard sorted by badge count
      const entries: LeaderboardEntry[] = users
        .map((u) => ({
          rank: 0,
          full_name: u.full_name,
          username: u.username,
          avatar_url: u.avatar_url,
          metric_value: countMap.get(u.id) ?? 0,
        }))
        .filter((e) => e.metric_value > 0)
        .sort((a, b) => b.metric_value - a.metric_value);

      // Assign ranks
      for (const [i, entry] of entries.entries()) {
        entry.rank = i + 1;
      }

      return entries.slice(0, 7);
    } catch (error) {
      console.error("[Leaderboard] Failed to fetch preview:", error);
      return [];
    }
  },
  ["leaderboard-preview"],
  { revalidate: 60, tags: ["leaderboard-preview"] },
);
