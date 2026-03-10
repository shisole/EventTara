import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { type AgentContext } from "../types";

export function createGetLeaderboardTool(ctx: AgentContext) {
  return tool(
    async (input) => {
      try {
        const metric = input.metric ?? "badges";
        const limit = 10;

        if (metric === "badges") {
          // Top users by badge count
          const { data, error } = await ctx.supabase.from("user_badges").select("user_id");

          if (error) return `Error fetching leaderboard: ${error.message}`;
          if (!data || data.length === 0) return "No leaderboard data available.";

          // Count badges per user
          const counts = new Map<string, number>();
          for (const row of data) {
            counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
          }

          const sorted = [...counts.entries()].sort(([, a], [, b]) => b - a).slice(0, limit);

          const userIds = sorted.map(([id]) => id);
          const { data: users } = await ctx.supabase
            .from("users")
            .select("id, full_name, username, avatar_url")
            .in("id", userIds);

          const userMap = new Map((users ?? []).map((u) => [u.id, u]));

          const leaderboard = sorted.map(([userId, count], i) => {
            const user = userMap.get(userId);
            return {
              rank: i + 1,
              name: user?.full_name ?? "Unknown",
              username: user?.username,
              badgeCount: count,
            };
          });

          return JSON.stringify({ metric: "badges", leaderboard });
        }

        if (metric === "events") {
          // Top users by event check-in count
          const { data, error } = await ctx.supabase.from("event_checkins").select("user_id");

          if (error) return `Error fetching leaderboard: ${error.message}`;
          if (!data || data.length === 0) return "No leaderboard data available.";

          const counts = new Map<string, number>();
          for (const row of data) {
            counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
          }

          const sorted = [...counts.entries()].sort(([, a], [, b]) => b - a).slice(0, limit);

          const userIds = sorted.map(([id]) => id);
          const { data: users } = await ctx.supabase
            .from("users")
            .select("id, full_name, username, avatar_url")
            .in("id", userIds);

          const userMap = new Map((users ?? []).map((u) => [u.id, u]));

          const leaderboard = sorted.map(([userId, count], i) => {
            const user = userMap.get(userId);
            return {
              rank: i + 1,
              name: user?.full_name ?? "Unknown",
              username: user?.username,
              eventCount: count,
            };
          });

          return JSON.stringify({ metric: "events", leaderboard });
        }

        return "Invalid metric. Use 'badges' or 'events'.";
      } catch (error) {
        return `Error fetching leaderboard: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "getLeaderboard",
      description:
        "Get leaderboard rankings. Available metrics: 'badges' (most badges earned), 'events' (most events attended).",
      schema: z.object({
        metric: z
          .enum(["badges", "events"])
          .optional()
          .describe("Ranking metric (default: badges)"),
      }),
    },
  );
}
