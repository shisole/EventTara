import { NextResponse } from "next/server";

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

  return NextResponse.json({ message: "Proof uploaded", payment_proof_url: proofUrl });
}
