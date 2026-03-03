import { createServiceClient } from "@/lib/supabase/server";

import { STRAVA_API_BASE, STRAVA_TOKEN_URL } from "./constants";
import {
  type CreateActivityParams,
  type GetActivitiesParams,
  type StravaActivity,
  type StravaApiError,
  type StravaAthlete,
  type StravaAthleteStats,
  type StravaRoute,
  type StravaTokenResponse,
} from "./types";

/** Buffer (in seconds) before considering a token expired. Refresh 5 min early. */
const EXPIRY_BUFFER_SECONDS = 300;

class StravaApiClient {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: number; // Unix timestamp (seconds)
  private userId: string;
  private stravaAthleteId: number;

  constructor(
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
    userId: string,
    stravaAthleteId: number,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.userId = userId;
    this.stravaAthleteId = stravaAthleteId;
  }

  // ---------------------------------------------------------------------------
  // Token management
  // ---------------------------------------------------------------------------

  private isTokenExpired(): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now >= this.expiresAt - EXPIRY_BUFFER_SECONDS;
  }

  /**
   * Refresh the access token using the stored refresh token.
   * Updates the database row and local state.
   */
  private async refreshAccessToken(): Promise<void> {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("[Strava] STRAVA_CLIENT_ID or STRAVA_CLIENT_SECRET is not configured");
    }

    const response = await fetch(STRAVA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as StravaApiError | null;
      throw new Error(
        `[Strava] Token refresh failed (${String(response.status)}): ${errorBody?.message ?? response.statusText}`,
      );
    }

    const data = (await response.json()) as StravaTokenResponse;

    // Update local state
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.expiresAt = data.expires_at;

    // Persist new tokens to database
    const supabase = createServiceClient();
    const { error } = await supabase
      .from("strava_connections")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: new Date(data.expires_at * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", this.userId);

    if (error) {
      console.error("[Strava] Failed to persist refreshed tokens:", error);
      // Don't throw — the in-memory tokens are still valid for this request
    }
  }

  /**
   * Ensure we have a valid access token, refreshing if necessary.
   */
  private async ensureValidToken(): Promise<string> {
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }
    return this.accessToken;
  }

  // ---------------------------------------------------------------------------
  // HTTP helpers
  // ---------------------------------------------------------------------------

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.ensureValidToken();
    const url = `${STRAVA_API_BASE}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Merge any additional headers from options
    if (options.headers) {
      const extra = new Headers(options.headers);
      for (const [key, value] of extra.entries()) {
        headers[key] = value;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as StravaApiError | null;
      throw new Error(
        `[Strava] API error ${String(response.status)} on ${path}: ${errorBody?.message ?? response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  // ---------------------------------------------------------------------------
  // API methods
  // ---------------------------------------------------------------------------

  /** Get the authenticated athlete's profile. */
  async getAthlete(): Promise<StravaAthlete> {
    return this.request<StravaAthlete>("/athlete");
  }

  /** List the authenticated athlete's activities. */
  async getActivities(params: GetActivitiesParams = {}): Promise<StravaActivity[]> {
    const searchParams = new URLSearchParams();
    if (params.before != null) searchParams.set("before", String(params.before));
    if (params.after != null) searchParams.set("after", String(params.after));
    if (params.page != null) searchParams.set("page", String(params.page));
    if (params.per_page != null) searchParams.set("per_page", String(params.per_page));

    const query = searchParams.toString();
    return this.request<StravaActivity[]>(`/athlete/activities${query ? `?${query}` : ""}`);
  }

  /** Get a single activity by ID. */
  async getActivity(activityId: number): Promise<StravaActivity> {
    return this.request<StravaActivity>(`/activities/${String(activityId)}`);
  }

  /** Get a route by ID. */
  async getRoute(routeId: number): Promise<StravaRoute> {
    return this.request<StravaRoute>(`/routes/${String(routeId)}`);
  }

  /** Get athlete statistics (totals, recent, YTD). */
  async getAthleteStats(athleteId: number): Promise<StravaAthleteStats> {
    return this.request<StravaAthleteStats>(`/athletes/${String(athleteId)}/stats`);
  }

  /** Create a manual activity on Strava. */
  async createActivity(data: CreateActivityParams): Promise<StravaActivity> {
    return this.request<StravaActivity>("/activities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /** List the authenticated athlete's routes. */
  async getRoutes(params: { page?: number; per_page?: number } = {}): Promise<StravaRoute[]> {
    const searchParams = new URLSearchParams();
    if (params.page != null) searchParams.set("page", String(params.page));
    if (params.per_page != null) searchParams.set("per_page", String(params.per_page));

    const query = searchParams.toString();
    return this.request<StravaRoute[]>(
      `/athletes/${String(this.stravaAthleteId)}/routes${query ? `?${query}` : ""}`,
    );
  }
}

// -----------------------------------------------------------------------------
// Factory function
// -----------------------------------------------------------------------------

/**
 * Create an authenticated Strava API client for the given user.
 * Fetches the user's tokens from `strava_connections` and returns a client
 * that automatically refreshes expired tokens.
 *
 * @throws If the user has no Strava connection or tokens are missing.
 */
export async function getStravaClient(userId: string): Promise<StravaApiClient> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("strava_connections")
    .select("access_token, refresh_token, expires_at, strava_athlete_id")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(`[Strava] No Strava connection found for user ${userId}: ${error.message}`);
  }

  const expiresAtUnix = Math.floor(new Date(data.expires_at).getTime() / 1000);

  return new StravaApiClient(
    data.access_token,
    data.refresh_token,
    expiresAtUnix,
    userId,
    data.strava_athlete_id,
  );
}
