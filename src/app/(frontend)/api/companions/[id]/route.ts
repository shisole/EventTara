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

  const { action } = await request.json();
  if (!action || !["confirm", "cancel"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Use 'confirm' or 'cancel'" },
      { status: 400 },
    );
  }

  // Get companion with booking and event info to verify organizer
  const { data: companion } = await supabase
    .from("booking_companions")
    .select(
      "id, full_name, booking_id, bookings:booking_id(event_id, events:event_id(organizer_id, organizer_profiles:organizer_id(user_id)))",
    )
    .eq("id", id)
    .single();

  if (!companion) {
    return NextResponse.json({ error: "Companion not found" }, { status: 404 });
  }

  // Verify the current user is the organizer
  const organizerUserId = (companion.bookings as any)?.events?.organizer_profiles?.user_id;
  if (organizerUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newStatus = action === "confirm" ? "confirmed" : "cancelled";

  const updateData: Record<string, any> = { status: newStatus };

  // Generate QR code when confirming
  if (action === "confirm") {
    const eventId = (companion.bookings as any)?.event_id;
    updateData.qr_code = `eventtara:checkin:${eventId}:companion:${id}`;
  }

  // Clear QR code when cancelling
  if (action === "cancel") {
    updateData.qr_code = null;
  }

  const { error } = await supabase.from("booking_companions").update(updateData).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `${companion.full_name} ${newStatus}`,
    status: newStatus,
  });
}
