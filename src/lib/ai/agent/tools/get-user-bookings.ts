import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { type AgentContext } from "../types";

export function createGetUserBookingsTool(ctx: AgentContext) {
  return tool(
    async (input) => {
      if (!ctx.userId) {
        return "User is not logged in. Please ask them to log in to view their bookings.";
      }

      try {
        let query = ctx.supabase
          .from("bookings")
          .select("id, event_id, status, payment_status, booked_at")
          .eq("user_id", ctx.userId);

        if (input.status) {
          query = query.eq("status", input.status);
        }

        query = query.order("booked_at", { ascending: false }).limit(10);

        const { data: bookings, error } = await query;

        if (error) {
          return `Error fetching bookings: ${error.message}`;
        }

        if (!bookings || bookings.length === 0) {
          return "No bookings found.";
        }

        // Fetch event details for each booking
        const eventIds = [...new Set(bookings.map((b) => b.event_id))];
        const { data: events } = await ctx.supabase
          .from("events")
          .select("id, title, type, date, location, price")
          .in("id", eventIds);

        const eventMap = new Map((events ?? []).map((e) => [e.id, e]));

        const result = bookings.map((b) => {
          const event = eventMap.get(b.event_id);
          return {
            bookingId: b.id,
            status: b.status,
            paymentStatus: b.payment_status,
            bookedAt: b.booked_at,
            event: event
              ? {
                  id: event.id,
                  title: event.title,
                  type: event.type,
                  date: event.date,
                  location: event.location,
                  price: event.price,
                }
              : null,
          };
        });

        return JSON.stringify(result);
      } catch (error) {
        return `Error fetching bookings: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
    {
      name: "getUserBookings",
      description:
        "Get the logged-in user's event bookings with status and event info. Requires authentication.",
      schema: z.object({
        status: z
          .enum(["pending", "confirmed", "cancelled"])
          .optional()
          .describe("Filter by booking status"),
      }),
    },
  );
}
