import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify batch exists
  const { data: batch, error: batchError } = await supabase
    .from("qr_claim_batches")
    .select("*, badges(title, image_url, rarity)")
    .eq("id", id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  // Get all codes with claim info
  const { data: codes, error: codesError } = await supabase
    .from("qr_claim_codes")
    .select("*, users:claimed_by(full_name, username, email)")
    .eq("batch_id", id)
    .order("serial_number", { ascending: true });

  if (codesError) {
    return NextResponse.json({ error: codesError.message }, { status: 500 });
  }

  return NextResponse.json({ batch, codes });
}
