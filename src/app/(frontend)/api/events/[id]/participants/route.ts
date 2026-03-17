import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
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
    .select("id, club_id, max_participants, price")
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
  const { userId, manualName, manualContact, manualStatus, eventDistanceId } = body as {
    userId?: string;
    manualName?: string;
    manualContact?: string;
    manualStatus: "paid" | "reserved" | "pending";
    eventDistanceId?: string;
  };

  if (!userId && !manualName) {
    return NextResponse.json({ error: "Either a user or a name is required" }, { status: 400 });
  }

  // Check if the user already has a booking for this event
  if (userId) {
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "This user already has a booking for this event" },
        { status: 409 },
      );
    }
  }

  // Check capacity
  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("participant_cancelled", false);

  const { count: companionCount } = await supabase
    .from("booking_companions")
    .select("*", { count: "exact", head: true })
    .in(
      "booking_id",
      (await supabase.from("bookings").select("id").eq("event_id", eventId)).data?.map(
        (b) => b.id,
      ) ?? [],
    )
    .neq("status", "cancelled");

  const totalParticipants = (bookingCount ?? 0) + (companionCount ?? 0);
  if (totalParticipants >= event.max_participants) {
    return NextResponse.json({ error: "Event is at full capacity" }, { status: 409 });
  }

  // Map manual_status to booking fields
  const isPaid = manualStatus === "paid";
  const qrCode = isPaid ? `eventtara:checkin:${eventId}:${userId || randomUUID()}` : null;

  // Default new manually-added participants to "reserved" (not "confirmed")
  const bookingStatus =
    manualStatus === "paid"
      ? ("confirmed" as const)
      : manualStatus === "reserved"
        ? ("reserved" as const)
        : ("pending" as const);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      event_id: eventId,
      user_id: userId || null,
      status: bookingStatus,
      payment_status: isPaid ? ("paid" as const) : ("pending" as const),
      added_by: user.id,
      manual_status: manualStatus,
      manual_name: userId ? null : (manualName ?? null),
      manual_contact: userId ? null : (manualContact ?? null),
      qr_code: qrCode,
      event_distance_id: eventDistanceId || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ booking }, { status: 201 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
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

  const role = await checkClubPermissionServer(
    user.id,
    event.club_id,
    CLUB_PERMISSIONS.manage_bookings,
  );
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { bookingId, userId } = body as { bookingId: string; userId: string };

  if (!bookingId || !userId) {
    return NextResponse.json({ error: "bookingId and userId are required" }, { status: 400 });
  }

  // Verify booking is unclaimed and belongs to this event
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, event_id")
    .eq("id", bookingId)
    .eq("event_id", eventId)
    .is("user_id", null)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found or already linked" }, { status: 404 });
  }

  // Check if user already has a booking for this event
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This user already has a booking for this event" },
      { status: 409 },
    );
  }

  const qrCode = `eventtara:checkin:${eventId}:${userId}:${randomUUID().slice(0, 8)}`;

  // Link user to booking without overriding the current status
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({
      user_id: userId,
      qr_code: qrCode,
    })
    .eq("id", bookingId)
    .is("user_id", null)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ booking: updated });
}
