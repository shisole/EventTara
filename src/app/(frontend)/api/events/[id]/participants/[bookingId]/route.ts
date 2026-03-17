import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; bookingId: string }> },
) {
  const { id: eventId, bookingId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch event and verify club permission
  const { data: event } = await supabase
    .from("events")
    .select("id, club_id")
    .eq("id", eventId)
    .single();

  if (!event?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Verify user has permission to manage bookings in this club (moderator+)
  const role = await checkClubPermissionServer(
    user.id,
    event.club_id,
    CLUB_PERMISSIONS.manage_bookings,
  );
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { manualStatus, organizerNotes } = body as {
    manualStatus?: "paid" | "reserved" | "pending";
    organizerNotes?: string;
  };

  // At least one field must be provided
  if (manualStatus === undefined && organizerNotes === undefined) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Build update payload
  const updateData: Record<string, unknown> = {};

  if (manualStatus !== undefined) {
    if (!["paid", "reserved", "pending"].includes(manualStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updateData.manual_status = manualStatus;
    updateData.status =
      manualStatus === "paid" ? "confirmed" : manualStatus === "reserved" ? "reserved" : "pending";
    updateData.payment_status = manualStatus === "paid" ? "paid" : "pending";
  }

  if (organizerNotes !== undefined) {
    // Allow empty string to clear notes, store as null
    updateData.organizer_notes = organizerNotes.trim() || null;
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ booking });
}
