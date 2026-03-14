import { encode } from "@mapbox/polyline";
import { type NextRequest, NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { getStravaClient } from "@/lib/strava/client";
import { parseGPX } from "@/lib/strava/gpx";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// GET /api/events/[id]/route-data — public, returns route data for an event
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  const { data: route, error } = await supabase
    .from("event_routes")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ route });
}

// ---------------------------------------------------------------------------
// POST /api/events/[id]/route-data — organizer only
// Accepts:
//   { source: "strava", strava_route_url: string }
//   { source: "gpx", gpx_data: string }
// ---------------------------------------------------------------------------

interface StravaBody {
  source: "strava";
  strava_route_url: string;
}

interface GpxBody {
  source: "gpx";
  gpx_data: string;
}

type PostBody = StravaBody | GpxBody;

/** Extract a numeric route ID from a Strava route URL. */
function extractStravaRouteId(url: string): number | null {
  // Supports: https://www.strava.com/routes/12345 or strava.com/routes/12345
  const match = /strava\.com\/routes\/(\d+)/i.exec(url);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has permission to edit this event's routes
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as PostBody;

  // -------------------------------------------------------------------------
  // Strava source
  // -------------------------------------------------------------------------
  if (body.source === "strava") {
    if (!body.strava_route_url) {
      return NextResponse.json({ error: "strava_route_url is required" }, { status: 400 });
    }

    const routeId = extractStravaRouteId(body.strava_route_url);
    if (!routeId) {
      return NextResponse.json(
        {
          error:
            "Invalid Strava route URL. Expected format: https://www.strava.com/routes/ROUTE_ID",
        },
        { status: 400 },
      );
    }

    // Fetch route data from Strava API (requires user to have Strava connected)
    let stravaRoute;
    try {
      const client = await getStravaClient(user.id);
      stravaRoute = await client.getRoute(routeId);
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "Failed to fetch Strava route";
      const isNoConnection = message.includes("No Strava connection");
      return NextResponse.json(
        {
          error: isNoConnection
            ? "Please connect your Strava account in Profile Settings to import routes."
            : message,
        },
        { status: isNoConnection ? 400 : 502 },
      );
    }

    // Pick the best polyline available
    const summaryPolyline = stravaRoute.map.polyline ?? stravaRoute.map.summary_polyline ?? null;

    // Delete any existing route for this event, then insert the new one
    await supabase.from("event_routes").delete().eq("event_id", eventId);

    const { data: route, error: insertError } = await supabase
      .from("event_routes")
      .insert({
        event_id: eventId,
        source: "strava" as const,
        strava_route_id: routeId,
        name: stravaRoute.name,
        distance: stravaRoute.distance,
        elevation_gain: stravaRoute.elevation_gain,
        summary_polyline: summaryPolyline,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ route }, { status: 201 });
  }

  // -------------------------------------------------------------------------
  // GPX source
  // -------------------------------------------------------------------------
  if (body.source === "gpx") {
    if (!body.gpx_data) {
      return NextResponse.json({ error: "gpx_data is required" }, { status: 400 });
    }

    let parsed;
    try {
      parsed = parseGPX(body.gpx_data);
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : "Failed to parse GPX data";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Encode coordinates to a polyline string
    const encodedPolyline = encode(parsed.coordinates);

    // Delete any existing route for this event, then insert the new one
    await supabase.from("event_routes").delete().eq("event_id", eventId);

    const { data: route, error: insertError } = await supabase
      .from("event_routes")
      .insert({
        event_id: eventId,
        source: "gpx" as const,
        name: "GPX Route",
        distance: parsed.distance,
        elevation_gain: parsed.elevationGain,
        summary_polyline: encodedPolyline,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ route }, { status: 201 });
  }

  return NextResponse.json(
    { error: "Invalid source — must be 'strava' or 'gpx'" },
    { status: 400 },
  );
}

// ---------------------------------------------------------------------------
// DELETE /api/events/[id]/route-data — organizer only
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has permission to edit this event's routes
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("club_id")
    .eq("id", eventId)
    .single();

  if (eventError || !event?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, event.club_id, CLUB_PERMISSIONS.edit_event);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("event_routes").delete().eq("event_id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
