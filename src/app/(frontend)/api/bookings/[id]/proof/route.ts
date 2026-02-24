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

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${booking.event_id}/${booking.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from("payment-proofs").getPublicUrl(path);

  // Update booking
  const { error } = await supabase
    .from("bookings")
    .update({
      payment_proof_url: publicUrl.publicUrl,
      payment_status: "pending",
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Proof uploaded", payment_proof_url: publicUrl.publicUrl });
}
