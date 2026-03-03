/** Strava OAuth & API constants */

export const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
export const STRAVA_API_BASE = "https://www.strava.com/api/v3";

/**
 * Requested OAuth scopes.
 * - `read` — read public profile
 * - `activity:read_all` — read all activities (including private)
 * - `activity:write` — create manual activities
 */
export const STRAVA_SCOPES = ["read", "activity:read_all", "activity:write"] as const;

export type StravaScope = (typeof STRAVA_SCOPES)[number];

/**
 * Maps Strava activity types to EventTara event types.
 * Only the types we care about are included.
 */
export const STRAVA_TO_EVENT_TYPE: Record<
  string,
  "hiking" | "mtb" | "road_bike" | "running" | "trail_run"
> = {
  Hike: "hiking",
  Run: "running",
  Ride: "road_bike",
  MountainBikeRide: "mtb",
  GravelRide: "mtb",
  TrailRun: "trail_run",
  VirtualRide: "road_bike",
  VirtualRun: "running",
};

/**
 * Reverse map: EventTara event type → matching Strava activity types.
 * Used when filtering Strava activities to match a specific event type.
 */
export const EVENT_TYPE_TO_STRAVA: Record<
  "hiking" | "mtb" | "road_bike" | "running" | "trail_run",
  string[]
> = {
  hiking: ["Hike"],
  running: ["Run", "VirtualRun"],
  road_bike: ["Ride", "VirtualRide"],
  mtb: ["MountainBikeRide", "GravelRide"],
  trail_run: ["TrailRun"],
};
