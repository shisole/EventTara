import { NextResponse } from "next/server";

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

  // Verify user is the organizer (organizer_id references organizer_profiles, not users)
  const { data: orgProfile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id")
    .eq("id", eventId)
    .single();

  if (!event || event.organizer_id !== orgProfile?.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json();
  const { manualStatus } = body as { manualStatus: "paid" | "reserved" | "pending" };

  if (!["paid", "reserved", "pending"].includes(manualStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const isPaid = manualStatus === "paid";

  const { data: booking, error } = await supabase
    .from("bookings")
    .update({
      manual_status: manualStatus,
      status: isPaid ? ("confirmed" as const) : ("pending" as const),
      payment_status: isPaid ? ("paid" as const) : ("pending" as const),
    })
    .eq("id", bookingId)
    .eq("event_id", eventId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ booking });
}
