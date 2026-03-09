import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cancelled } = await request.json();
  if (typeof cancelled !== "boolean") {
    return NextResponse.json(
      { error: "Invalid request. Provide { cancelled: boolean }" },
      { status: 400 },
    );
  }

  // Get booking with event info to verify club permission
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, events:event_id(club_id)")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const clubId = (booking.events as any)?.club_id;
  if (!clubId) {
    return NextResponse.json({ error: "Event has no club" }, { status: 400 });
  }

  // Verify user is owner/admin/moderator of the event's club
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "moderator"])
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("bookings")
    .update({ participant_cancelled: cancelled })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: cancelled ? "Participant cancelled" : "Participant restored",
  });
}
