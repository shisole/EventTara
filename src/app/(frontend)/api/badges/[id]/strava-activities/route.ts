import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: badge } = await supabase
    .from("badges")
    .select("criteria_key")
    .eq("id", id)
    .single();

  if (!badge) {
    return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's confirmed bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "confirmed");

  const bookingIds = (bookings ?? []).map((b) => b.id);

  if (bookingIds.length === 0) {
    return NextResponse.json({ activities: [] });
  }

  const { data: activities } = await supabase
    .from("strava_activities")
    .select("id, strava_activity_id, name, distance, start_date, moving_time, total_elevation_gain")
    .in("booking_id", bookingIds)
    .order("start_date", { ascending: false })
    .limit(5);

  const formatted = (activities ?? []).map((act) => ({
    id: act.id,
    name: act.name,
    distance: act.distance,
    date: act.start_date,
    moving_time: act.moving_time,
    elevation_gain: act.total_elevation_gain,
    strava_url: `https://www.strava.com/activities/${act.strava_activity_id}`,
  }));

  return NextResponse.json({ activities: formatted });
}
