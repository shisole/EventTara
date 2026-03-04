import { NextResponse } from "next/server";

import { getStravaClient } from "@/lib/strava/client";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/strava/activities
 * Fetches recent Strava activities for the authenticated user.
 * Accepts optional `after` query param (unix timestamp) to filter activities.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check that the user has a Strava connection
  const { data: connection } = await supabase
    .from("strava_connections")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Strava not connected" }, { status: 400 });
  }

  // Parse optional `after` query param
  const { searchParams } = new URL(request.url);
  const afterParam = searchParams.get("after");
  const after = afterParam ? Number(afterParam) : undefined;

  try {
    const strava = await getStravaClient(user.id);
    const activities = await strava.getActivities({
      per_page: 20,
      ...(after != null && !Number.isNaN(after) ? { after } : {}),
    });

    // Return a formatted subset of activity data
    const formatted = activities.map((activity) => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      sport_type: activity.sport_type,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      start_date: activity.start_date,
      start_date_local: activity.start_date_local,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      summary_polyline: activity.map?.summary_polyline ?? null,
    }));

    return NextResponse.json({ activities: formatted });
  } catch (error) {
    console.error("[Strava] Failed to fetch activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities from Strava" }, { status: 500 });
  }
}
