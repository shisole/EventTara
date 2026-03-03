/**
 * Strava API v3 response types.
 * Only the fields EventTara uses are typed — Strava returns many more.
 */

/** Strava OAuth token response (POST /oauth/token) */
export interface StravaTokenResponse {
  token_type: "Bearer";
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp (seconds)
  expires_in: number; // Seconds until expiration
  athlete: StravaAthlete;
}

/** Strava athlete profile (GET /athlete) */
export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  username: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: "M" | "F" | null;
  profile: string; // Large profile picture URL
  profile_medium: string; // Medium profile picture URL
  premium: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/** Strava detailed activity (GET /activities/:id or listed) */
export interface StravaActivity {
  id: number;
  name: string;
  type: string; // e.g. "Run", "Ride", "Hike", "TrailRun"
  sport_type: string; // More granular, e.g. "MountainBikeRide"
  distance: number; // Meters
  moving_time: number; // Seconds
  elapsed_time: number; // Seconds
  total_elevation_gain: number; // Meters
  start_date: string; // ISO 8601 UTC
  start_date_local: string; // ISO 8601 local
  timezone: string; // e.g. "(GMT+08:00) Asia/Manila"
  start_latlng: [number, number] | null; // [lat, lng]
  end_latlng: [number, number] | null;
  map: {
    id: string;
    summary_polyline: string | null;
    polyline: string | null; // Only in detailed response
  };
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate: number | null;
  max_heartrate: number | null;
  kudos_count: number;
  achievement_count: number;
  description: string | null;
  private: boolean;
  visibility: "everyone" | "followers_only" | "only_me";
}

/** Strava route (GET /routes/:id) */
export interface StravaRoute {
  id: number;
  name: string;
  description: string | null;
  distance: number; // Meters
  elevation_gain: number; // Meters
  type: 1 | 2 | 3; // 1=ride, 2=run, 3=walk
  sub_type: 1 | 2 | 3 | 4 | 5; // 1=road, 2=mtb, 3=cx, 4=trail, 5=mixed
  map: {
    summary_polyline: string | null;
    polyline: string | null;
  };
  starred: boolean;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  estimated_moving_time: number; // Seconds
  athlete: { id: number };
}

/** Strava athlete stats (GET /athletes/:id/stats) */
export interface StravaAthleteStats {
  recent_run_totals: StravaActivityTotal;
  recent_ride_totals: StravaActivityTotal;
  ytd_run_totals: StravaActivityTotal;
  ytd_ride_totals: StravaActivityTotal;
  all_run_totals: StravaActivityTotal;
  all_ride_totals: StravaActivityTotal;
}

export interface StravaActivityTotal {
  count: number;
  distance: number; // Meters
  moving_time: number; // Seconds
  elapsed_time: number; // Seconds
  elevation_gain: number; // Meters
  achievement_count?: number;
}

/** Parameters for listing activities (GET /athlete/activities) */
export interface GetActivitiesParams {
  before?: number; // Unix timestamp
  after?: number; // Unix timestamp
  page?: number;
  per_page?: number; // Max 200, default 30
}

/** Parameters for creating an activity (POST /activities) */
export interface CreateActivityParams {
  name: string;
  type: string; // e.g. "Run", "Ride", "Hike"
  sport_type?: string;
  start_date_local: string; // ISO 8601
  elapsed_time: number; // Seconds (required)
  description?: string;
  distance?: number; // Meters
  trainer?: boolean;
  commute?: boolean;
}

/** Strava webhook event (POST from Strava) */
export interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  owner_id: number; // Strava athlete ID
  subscription_id: number;
  event_time: number; // Unix timestamp
  updates?: Record<string, string>; // Only for "update" aspect
}

/** Strava API error response */
export interface StravaApiError {
  message: string;
  errors: {
    resource: string;
    field: string;
    code: string;
  }[];
}
