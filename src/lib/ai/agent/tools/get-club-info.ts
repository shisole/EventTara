import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { type AgentContext } from "../types";

export function createGetClubInfoTool(ctx: AgentContext) {
  return tool(
    async (input) => {
      try {
        // Try by slug first, then by name search
        let club: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          location: string | null;
        } | null = null;

        const { data: bySlug } = await ctx.supabase
          .from("clubs")
          .select("id, name, slug, description, logo_url, location")
          .eq("slug", input.clubIdentifier)
          .single();

        if (bySlug) {
          club = bySlug;
        } else {
          const { data: byName } = await ctx.supabase
            .from("clubs")
            .select("id, name, slug, description, logo_url, location")
            .ilike("name", `%${input.clubIdentifier}%`)
            .limit(1)
            .single();
          club = byName;
        }

        if (!club) {
          return `No club found matching "${input.clubIdentifier}".`;
        }

        // Get member count
        const { count: memberCount } = await ctx.supabase
          .from("club_members")
          .select("id", { count: "exact", head: true })
          .eq("club_id", club.id);

        // Get upcoming events
        const today = new Date().toISOString().split("T")[0];
        const { data: upcomingEvents } = await ctx.supabase
          .from("events")
          .select("id, title, type, date, location, price")
          .eq("club_id", club.id)
          .eq("status", "published")
          .gte("date", today)
          .order("date", { ascending: true })
          .limit(5);

        return JSON.stringify({
          name: club.name,
          slug: club.slug,
          description: club.description,
          location: club.location,
          memberCount: memberCount ?? 0,
          upcomingEvents: upcomingEvents ?? [],
          clubUrl: `/clubs/${club.slug}`,
        });
      } catch (error) {
        return `Error fetching club info: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "getClubInfo",
      description:
        "Get details about a club including description, member count, location, and upcoming events.",
      schema: z.object({
        clubIdentifier: z.string().describe("Club slug or name to search for"),
      }),
    },
  );
}
