import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event_id, user_id } = await request.json();

  if (!event_id || !user_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify booking exists
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, users:user_id(full_name)")
    .eq("event_id", event_id)
    .eq("user_id", user_id)
    .in("status", ["confirmed", "pending"])
    .single();

  if (!booking) {
    return NextResponse.json(
      { error: "No booking found for this participant" },
      { status: 404 }
    );
  }

  // Check if already checked in
  const { data: existingCheckin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", event_id)
    .eq("user_id", user_id)
    .single();

  if (existingCheckin) {
    const userName = (booking.users as any)?.full_name || "Participant";
    return NextResponse.json(
      { message: `${userName} is already checked in`, userName },
      { status: 200 }
    );
  }

  // Create check-in
  const { error } = await supabase.from("event_checkins").insert({
    event_id,
    user_id,
    method: "qr",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userName = (booking.users as any)?.full_name || "Participant";
  return NextResponse.json({ message: `${userName} checked in!`, userName });
}
