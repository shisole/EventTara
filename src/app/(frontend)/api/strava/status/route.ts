import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/strava/status
 * Returns the Strava connection status for the authenticated user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connection } = await supabase
    .from("strava_connections")
    .select("strava_athlete_id, athlete_data")
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    return NextResponse.json({ connected: false });
  }

  // Extract athlete info from the stored athlete_data JSON
  const athleteData = connection.athlete_data as Record<string, unknown> | null;

  const firstName = typeof athleteData?.firstname === "string" ? athleteData.firstname : "";
  const lastName = typeof athleteData?.lastname === "string" ? athleteData.lastname : "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Strava Athlete";

  const profileUrl = typeof athleteData?.profile === "string" ? athleteData.profile : null;
  const profileMediumUrl =
    typeof athleteData?.profile_medium === "string" ? athleteData.profile_medium : null;
  const avatar = profileUrl ?? profileMediumUrl;

  return NextResponse.json({
    connected: true,
    athlete: {
      id: connection.strava_athlete_id,
      name,
      avatar,
    },
  });
}
