import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/strava/activities/[id]/unlink
 * Unlinks (deletes) a strava_activities row by its database ID.
 * Verifies ownership (user_id must match the authenticated user).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing activity ID" }, { status: 400 });
  }

  // Verify the activity exists and belongs to this user
  const { data: activity } = await supabase
    .from("strava_activities")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  if (activity.user_id !== user.id) {
    return NextResponse.json({ error: "You do not own this activity" }, { status: 403 });
  }

  // Delete the row
  const { error } = await supabase.from("strava_activities").delete().eq("id", id);

  if (error) {
    console.error("[Strava] Failed to unlink activity:", error);
    return NextResponse.json({ error: "Failed to unlink activity" }, { status: 500 });
  }

  return NextResponse.json({ unlinked: true });
}
