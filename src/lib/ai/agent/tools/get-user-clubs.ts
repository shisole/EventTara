import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { type AgentContext } from "../types";

export function createGetUserClubsTool(ctx: AgentContext) {
  return tool(
    async () => {
      if (!ctx.userId) {
        return "User is not logged in. Please ask them to log in to view their clubs.";
      }

      try {
        const { data: memberships, error } = await ctx.supabase
          .from("club_members")
          .select("club_id, role, joined_at")
          .eq("user_id", ctx.userId);

        if (error) return `Error fetching clubs: ${error.message}`;
        if (!memberships || memberships.length === 0) return "User is not a member of any clubs.";

        const clubIds = memberships.map((m) => m.club_id);
        const { data: clubs } = await ctx.supabase
          .from("clubs")
          .select("id, name, slug, description, location")
          .in("id", clubIds);

        const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));

        const result = memberships.map((m) => {
          const club = clubMap.get(m.club_id);
          return {
            name: club?.name,
            slug: club?.slug,
            description: club?.description,
            location: club?.location,
            role: m.role,
            joinedAt: m.joined_at,
            clubUrl: club ? `/clubs/${club.slug}` : null,
          };
        });

        return JSON.stringify(result);
      } catch (error) {
        return `Error fetching clubs: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "getUserClubs",
      description:
        "Get the clubs that the logged-in user is a member of, including their role in each club. Requires authentication.",
      schema: z.object({}),
    },
  );
}
