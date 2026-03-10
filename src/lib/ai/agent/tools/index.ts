import { type StructuredToolInterface } from "@langchain/core/tools";

import { type AgentContext } from "../types";

import { createGetClubInfoTool } from "./get-club-info";
import { createGetEventDetailsTool } from "./get-event-details";
import { createGetEventRouteTool } from "./get-event-route";
import { createGetLeaderboardTool } from "./get-leaderboard";
import { createGetUserBadgesTool } from "./get-user-badges";
import { createGetUserBookingsTool } from "./get-user-bookings";
import { createGetUserClubsTool } from "./get-user-clubs";
import { createSearchEventsTool } from "./search-events";

/**
 * Creates all Coco agent tools bound to the given auth context.
 */
export function createAllTools(ctx: AgentContext): StructuredToolInterface[] {
  return [
    createSearchEventsTool(ctx),
    createGetEventDetailsTool(ctx),
    createGetEventRouteTool(ctx),
    createGetClubInfoTool(ctx),
    createGetUserBookingsTool(ctx),
    createGetUserBadgesTool(ctx),
    createGetUserClubsTool(ctx),
    createGetLeaderboardTool(ctx),
  ];
}
