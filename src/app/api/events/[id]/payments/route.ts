import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
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
    .select("id, status, payment_status, payment_method, payment_proof_url, booked_at, users:user_id(full_name, email, avatar_url)")
    .eq("event_id", id)
    .in("status", ["pending", "confirmed"])
    .order("booked_at", { ascending: false });

  const allBookings = bookings || [];
  const paidCount = allBookings.filter((b) => b.payment_status === "paid").length;
  const pendingCount = allBookings.filter((b) => b.payment_status === "pending").length;
  const rejectedCount = allBookings.filter((b) => b.payment_status === "rejected").length;
  const cashCount = allBookings.filter((b) => b.payment_method === "cash").length;

  return NextResponse.json({
    bookings: allBookings,
    stats: {
      total: allBookings.length,
      paid: paidCount,
      pending: pendingCount,
      rejected: rejectedCount,
      cash: cashCount,
      revenue: paidCount * Number(event.price),
    },
  });
}
