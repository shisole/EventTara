import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { executeEventSearch } from "../event-query-builder";
import { type AgentContext } from "../types";

export function createSearchEventsTool(ctx: AgentContext) {
  return tool(
    async (input) => {
      try {
        const parsed = {
          search: input.search,
          type: input.type,
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          when: input.when,
          duration: input.duration,
          distance: input.distance,
          difficulty: input.difficulty,
          nearMe: input.nearMe,
          reply: "",
        };

        const result = await executeEventSearch({
          supabase: ctx.supabase,
          parsed,
          userLocation: ctx.userLocation,
        });

        if (result.events.length === 0) {
          return JSON.stringify({
            message: "No events found matching the criteria.",
            totalCount: 0,
            filterUrl: result.filterUrl,
          });
        }

        return JSON.stringify({
          events: result.events,
          totalCount: result.totalCount,
          filterUrl: result.filterUrl,
        });
      } catch (error) {
        return `Error searching events: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "searchEvents",
      description:
        "Search for outdoor adventure events by type, date, location, difficulty, and distance. Returns up to 3 matching events with a total count.",
      schema: z.object({
        search: z
          .string()
          .optional()
          .describe("Search text for event title, location, or club/guide name"),
        type: z
          .enum(["hiking", "mtb", "road_bike", "running", "trail_run"])
          .optional()
          .describe("Activity type filter"),
        dateFrom: z.string().optional().describe("Start date filter (YYYY-MM-DD)"),
        dateTo: z.string().optional().describe("End date filter (YYYY-MM-DD)"),
        when: z.enum(["upcoming", "now", "past"]).optional().describe("Relative time filter"),
        duration: z
          .enum(["single", "multi"])
          .optional()
          .describe("single = dayhike, multi = overnight/multi-day"),
        distance: z.number().optional().describe("Distance in km (e.g., 42 for marathon)"),
        difficulty: z
          .string()
          .optional()
          .describe('Difficulty range "min-max" on 1-9 scale (e.g., "1-4" for easy)'),
        nearMe: z.boolean().optional().describe("Sort by distance from user location"),
      }),
    },
  );
}
