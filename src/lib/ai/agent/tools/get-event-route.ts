import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { type AgentContext } from "../types";

export function createGetEventRouteTool(ctx: AgentContext) {
  return tool(
    async (input) => {
      try {
        const { data: routes, error } = await ctx.supabase
          .from("event_routes")
          .select("id, name, distance, elevation_gain, source, gpx_url, strava_route_id")
          .eq("event_id", input.eventId);

        if (error) {
          return `Error fetching routes: ${error.message}`;
        }

        if (!routes || routes.length === 0) {
          return "No route information available for this event.";
        }

        return JSON.stringify(
          routes.map((r) => ({
            name: r.name,
            distanceKm: r.distance,
            elevationGainM: r.elevation_gain,
            source: r.source,
            hasGpx: !!r.gpx_url,
            hasStravaRoute: !!r.strava_route_id,
          })),
        );
      } catch (error) {
        return `Error fetching route info: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "getEventRoute",
      description:
        "Get trail/route information for an event, including distance, elevation gain, and route type.",
      schema: z.object({
        eventId: z.string().describe("The event ID to look up routes for"),
      }),
    },
  );
}
