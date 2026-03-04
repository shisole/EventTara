import { NextResponse } from "next/server";

import { getStravaClient } from "@/lib/strava/client";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/strava/activities/link
 * Links a Strava activity to a booking (manual linking).
 * Body: { strava_activity_id: number, booking_id: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { strava_activity_id, booking_id } = body as {
    strava_activity_id: number;
    booking_id: string;
  };

  if (!strava_activity_id || !booking_id) {
    return NextResponse.json(
      { error: "Missing strava_activity_id or booking_id" },
      { status: 400 },
    );
  }

  // Verify the user owns the booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id")
    .eq("id", booking_id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "You do not own this booking" }, { status: 403 });
  }

  // Check if this activity is already linked
  const { data: existing } = await supabase
    .from("strava_activities")
    .select("id")
    .eq("strava_activity_id", strava_activity_id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "This activity is already linked" }, { status: 409 });
  }

  // Fetch activity details from Strava
  try {
    const strava = await getStravaClient(user.id);
    const activity = await strava.getActivity(strava_activity_id);

    // Insert strava_activities row
    const { data: inserted, error: insertError } = await supabase
      .from("strava_activities")
      .insert({
        user_id: user.id,
        strava_activity_id: activity.id,
        booking_id,
        name: activity.name,
        type: activity.type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        total_elevation_gain: activity.total_elevation_gain,
        start_date: activity.start_date,
        summary_polyline: activity.map?.summary_polyline ?? null,
        matched_automatically: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Strava] Failed to insert activity:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ activity: inserted });
  } catch (error) {
    console.error("[Strava] Failed to fetch/link activity:", error);
    return NextResponse.json({ error: "Failed to link Strava activity" }, { status: 500 });
  }
}
