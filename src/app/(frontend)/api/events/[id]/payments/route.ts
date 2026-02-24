import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify organizer owns this event
  const { data: event } = await supabase
    .from("events")
    .select("id, price, organizer_id, organizer_profiles:organizer_id(user_id)")
    .eq("id", id)
    .single();

  if (!event || (event.organizer_profiles as any)?.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get bookings with user info
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, status, payment_status, payment_method, payment_proof_url, participant_cancelled, booked_at, users:user_id(full_name, email, avatar_url)",
    )
    .eq("event_id", id)
    .in("status", ["pending", "confirmed"])
    .order("booked_at", { ascending: false });

  const allBookings = bookings || [];
  const bookingIds = allBookings.map((b) => b.id);

  // Fetch companion counts per booking (only non-cancelled)
  const companionCounts: Record<string, number> = {};
  const confirmedCompanionCounts: Record<string, number> = {};
  if (bookingIds.length > 0) {
    const { data: companions } = await supabase
      .from("booking_companions")
      .select("booking_id, status")
      .in("booking_id", bookingIds)
      .neq("status", "cancelled");

    if (companions) {
      for (const c of companions) {
        companionCounts[c.booking_id] = (companionCounts[c.booking_id] || 0) + 1;
        if (c.status === "confirmed") {
          confirmedCompanionCounts[c.booking_id] =
            (confirmedCompanionCounts[c.booking_id] || 0) + 1;
        }
      }
    }
  }

  // Add companion_count to each booking
  const bookingsWithCompanions = allBookings.map((b) => ({
    ...b,
    companion_count: companionCounts[b.id] || 0,
  }));

  const paidCount = allBookings.filter((b) => b.payment_status === "paid").length;
  const pendingCount = allBookings.filter((b) => b.payment_status === "pending").length;
  const rejectedCount = allBookings.filter((b) => b.payment_status === "rejected").length;
  const cashCount = allBookings.filter((b) => b.payment_method === "cash").length;

  // Revenue: count main participant (if not cancelled) + confirmed companions
  const revenue = allBookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => {
      const mainCount = (b as any).participant_cancelled ? 0 : 1;
      const compCount = confirmedCompanionCounts[b.id] || 0;
      return sum + (mainCount + compCount) * event.price;
    }, 0);

  return NextResponse.json({
    bookings: bookingsWithCompanions,
    stats: {
      total: allBookings.length,
      paid: paidCount,
      pending: pendingCount,
      rejected: rejectedCount,
      cash: cashCount,
      revenue,
    },
  });
}
