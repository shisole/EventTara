import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { type AgentContext } from "../types";

export function createGetUserBadgesTool(ctx: AgentContext) {
  return tool(
    async (input) => {
      try {
        if (input.mode === "available") {
          // List all available badges
          const { data: badges, error } = await ctx.supabase
            .from("badges")
            .select("id, title, description, category, rarity, type")
            .order("rarity", { ascending: true })
            .limit(20);

          if (error) return `Error fetching badges: ${error.message}`;
          if (!badges || badges.length === 0) return "No badges available.";

          return JSON.stringify(badges);
        }

        // Default: user's earned badges
        if (!ctx.userId) {
          return "User is not logged in. Please ask them to log in to view their badges.";
        }

        const { data: userBadges, error } = await ctx.supabase
          .from("user_badges")
          .select("badge_id, awarded_at")
          .eq("user_id", ctx.userId)
          .order("awarded_at", { ascending: false });

        if (error) return `Error fetching user badges: ${error.message}`;
        if (!userBadges || userBadges.length === 0) return "User has no badges yet.";

        // Get badge details
        const badgeIds = userBadges.map((ub) => ub.badge_id);
        const { data: badges } = await ctx.supabase
          .from("badges")
          .select("id, title, description, category, rarity")
          .in("id", badgeIds);

        const badgeMap = new Map((badges ?? []).map((b) => [b.id, b]));

        const result = userBadges.map((ub) => {
          const badge = badgeMap.get(ub.badge_id);
          return {
            title: badge?.title,
            description: badge?.description,
            category: badge?.category,
            rarity: badge?.rarity,
            awardedAt: ub.awarded_at,
          };
        });

        return JSON.stringify({ badges: result, totalCount: result.length });
      } catch (error) {
        return `Error fetching badges: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "getUserBadges",
      description:
        "Get the user's earned badges or list all available badges. Requires authentication for user badges.",
      schema: z.object({
        mode: z
          .enum(["earned", "available"])
          .optional()
          .describe("'earned' for user's badges (default), 'available' for all badges"),
      }),
    },
  );
}
