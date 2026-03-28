import { NextResponse } from "next/server";

import { createNotifications } from "@/lib/notifications/create";
import { uploadToR2 } from "@/lib/r2";
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

  // Get booking — must belong to user and be pending/rejected
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, event_id, payment_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!["pending", "rejected"].includes(booking.payment_status)) {
    return NextResponse.json({ error: "Cannot re-upload proof for this booking" }, { status: 400 });
  }

  // Parse FormData
  const formData = await request.formData();
  const file = formData.get("payment_proof") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Upload to R2
  const ext = file.name.split(".").pop() || "jpg";
  const key = `payment-proofs/${booking.event_id}/${booking.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let proofUrl: string;
  try {
    proofUrl = await uploadToR2(key, buffer, file.type || "image/jpeg");
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Update booking
  const { error } = await supabase
    .from("bookings")
    .update({
      payment_proof_url: proofUrl,
      payment_status: "pending",
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify club moderators+ about the re-upload
  const { data: event } = await supabase
    .from("events")
    .select("title, club_id")
    .eq("id", booking.event_id)
    .single();

  if (event) {
    const { data: clubMods } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", event.club_id)
      .in("role", ["owner", "admin", "moderator"]);

    if (clubMods && clubMods.length > 0) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      createNotifications(
        supabase,
        clubMods.map((m) => ({
          userId: m.user_id,
          type: "payment_proof_uploaded" as const,
          title: "Payment Proof Re-uploaded",
          body: `${userProfile?.full_name ?? "A participant"} re-uploaded payment proof for ${event.title}`,
          href: `/dashboard/clubs/${event.club_id}`,
          actorId: user.id,
        })),
      ).catch(() => null);
    }
  }

  return NextResponse.json({ message: "Proof uploaded", payment_proof_url: proofUrl });
}
