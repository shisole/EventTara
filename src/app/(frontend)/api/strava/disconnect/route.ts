import { NextResponse } from "next/server";

import { STRAVA_API_BASE } from "@/lib/strava/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/strava/disconnect
 * Disconnects the authenticated user's Strava account by deleting
 * the strava_connections row and deauthorizing the token with Strava.
 */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the connection to get the access token for deauthorization
  const { data: connection } = await supabase
    .from("strava_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .single();

  if (!connection) {
    return NextResponse.json({ error: "No Strava connection found" }, { status: 404 });
  }

  // Deauthorize with Strava (best-effort, don't fail if this errors)
  try {
    await fetch(`${STRAVA_API_BASE}/oauth/deauthorize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    });
  } catch (error) {
    console.error("[Strava] Deauthorize request failed:", error);
    // Continue with local cleanup regardless
  }

  // Delete the connection row and all Strava activity data (Strava API compliance)
  const { error } = await supabase.from("strava_connections").delete().eq("user_id", user.id);

  if (error) {
    console.error("[strava-disconnect DELETE] DB error:", error.message);
    return NextResponse.json({ error: "Failed to disconnect Strava" }, { status: 500 });
  }

  // Delete stored Strava activities — required by Strava API Agreement on deauthorization
  await supabase.from("strava_activities").delete().eq("user_id", user.id);

  return NextResponse.json({ disconnected: true });
}
