import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { type AgentContext } from "../types";

export function createGetEventDetailsTool(ctx: AgentContext) {
  return tool(
    async (input) => {
      try {
        const { data: event, error } = await ctx.supabase
          .from("events")
          .select(
            "id, title, description, type, date, end_date, location, price, max_participants, difficulty_level, cover_image_url, status, club_id",
          )
          .eq("id", input.eventId)
          .single();

        if (error || !event) {
          return "Event not found.";
        }

        // Get club name
        const { data: club } = await ctx.supabase
          .from("clubs")
          .select("name, slug")
          .eq("id", event.club_id)
          .single();

        // Get distances
        const { data: distances } = await ctx.supabase
          .from("event_distances")
          .select("distance_km, label")
          .eq("event_id", input.eventId);

        // Get mountains
        const { data: eventMountains } = await ctx.supabase
          .from("event_mountains")
          .select("mountain_id")
          .eq("event_id", input.eventId);

        let mountains: { name: string; elevation_masl: number | null }[] = [];
        if (eventMountains && eventMountains.length > 0) {
          const mountainIds = eventMountains.map((em) => em.mountain_id);
          const { data: mountainData } = await ctx.supabase
            .from("mountains")
            .select("name, elevation_masl")
            .in("id", mountainIds);
          mountains = mountainData ?? [];
        }

        // Get current booking count
        const { count: bookingCount } = await ctx.supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("event_id", input.eventId)
          .in("status", ["pending", "confirmed"]);

        return JSON.stringify({
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          date: event.date,
          endDate: event.end_date,
          location: event.location,
          price: event.price,
          maxParticipants: event.max_participants,
          currentBookings: bookingCount ?? 0,
          difficultyLevel: event.difficulty_level,
          status: event.status,
          club: club ? { name: club.name, slug: club.slug } : null,
          distances: distances ?? [],
          mountains,
        });
      } catch (error) {
        return `Error fetching event details: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "getEventDetails",
      description:
        "Get full details about a specific event including description, price, difficulty, distances, mountains, and booking availability.",
      schema: z.object({
        eventId: z.string().describe("The event ID to look up"),
      }),
    },
  );
}
