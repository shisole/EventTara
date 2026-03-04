import { createServiceClient } from "@/lib/supabase/server";

import { getStravaClient } from "./client";
import { STRAVA_TO_EVENT_TYPE } from "./constants";

const LOG_PREFIX = "[Strava Webhook]";

/** 24 hours in milliseconds — used for matching activity start_date to event date. */
const MATCH_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Handle a newly created Strava activity.
 *
 * 1. Look up the user by `strava_athlete_id` in `strava_connections`.
 * 2. Fetch the activity details from Strava.
 * 3. Find confirmed bookings where the event date is within 24h of the activity start_date
 *    and the activity type matches the event type.
 * 4. If a match is found, insert a `strava_activities` row with `matched_automatically: true`.
 */
export async function handleActivityCreate(
  ownerStravaId: number,
  activityId: number,
): Promise<void> {
  const supabase = createServiceClient();

  // 1. Look up user by Strava athlete ID
  const { data: connection, error: connError } = await supabase
    .from("strava_connections")
    .select("user_id")
    .eq("strava_athlete_id", ownerStravaId)
    .single();

  if (connError || !connection) {
    console.log(
      `${LOG_PREFIX} No user found for Strava athlete ${String(ownerStravaId)}, skipping`,
    );
    return;
  }

  const userId = connection.user_id;

  // 2. Get Strava client and fetch the activity
  let client;
  try {
    client = await getStravaClient(userId);
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to get Strava client for user ${userId}:`, error);
    return;
  }

  let activity;
  try {
    activity = await client.getActivity(activityId);
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Failed to fetch activity ${String(activityId)} from Strava:`,
      error,
    );
    return;
  }

  // 3. Check if this activity was already imported (idempotency)
  const { data: existing } = await supabase
    .from("strava_activities")
    .select("id")
    .eq("strava_activity_id", activityId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    console.log(
      `${LOG_PREFIX} Activity ${String(activityId)} already imported for user ${userId}, skipping`,
    );
    return;
  }

  // 4. Map Strava activity type to EventTara event type
  const eventType =
    STRAVA_TO_EVENT_TYPE[activity.sport_type] ?? STRAVA_TO_EVENT_TYPE[activity.type];

  if (!eventType) {
    console.log(
      `${LOG_PREFIX} Activity type "${activity.sport_type}" / "${activity.type}" has no EventTara mapping, skipping`,
    );
    return;
  }

  // 5. Find confirmed bookings for this user whose event date is within 24h of the activity
  const activityStartMs = new Date(activity.start_date).getTime();
  const windowStart = new Date(activityStartMs - MATCH_WINDOW_MS).toISOString();
  const windowEnd = new Date(activityStartMs + MATCH_WINDOW_MS).toISOString();

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, event_id, events!inner(id, date, type)")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .gte("events.date", windowStart)
    .lte("events.date", windowEnd)
    .eq("events.type", eventType);

  if (bookingsError) {
    console.error(`${LOG_PREFIX} Failed to query bookings for user ${userId}:`, bookingsError);
    return;
  }

  if (!bookings || bookings.length === 0) {
    console.log(
      `${LOG_PREFIX} No matching bookings for activity ${String(activityId)} (type: ${eventType}), skipping auto-match`,
    );
    return;
  }

  // Use the first matching booking
  const matchedBooking = bookings[0];

  // 6. Insert the strava_activities row
  const { error: insertError } = await supabase.from("strava_activities").insert({
    user_id: userId,
    strava_activity_id: activityId,
    booking_id: matchedBooking.id,
    name: activity.name,
    type: activity.sport_type || activity.type,
    distance: activity.distance,
    moving_time: activity.moving_time,
    elapsed_time: activity.elapsed_time,
    total_elevation_gain: activity.total_elevation_gain,
    start_date: activity.start_date,
    summary_polyline: activity.map?.summary_polyline ?? null,
    matched_automatically: true,
  });

  if (insertError) {
    console.error(
      `${LOG_PREFIX} Failed to insert strava_activities for activity ${String(activityId)}:`,
      insertError,
    );
    return;
  }

  console.log(
    `${LOG_PREFIX} Auto-matched activity ${String(activityId)} to booking ${matchedBooking.id}`,
  );
}
