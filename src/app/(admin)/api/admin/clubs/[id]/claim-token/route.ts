import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify club exists and is unclaimed
  const { data: club } = await supabase
    .from("clubs")
    .select("id, is_claimed")
    .eq("id", id)
    .single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  if (club.is_claimed) {
    return NextResponse.json({ error: "Club is already claimed" }, { status: 400 });
  }

  const claimToken = crypto.randomBytes(16).toString("hex");
  const claimExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("clubs")
    .update({ claim_token: claimToken, claim_expires_at: claimExpiresAt })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claim_token: claimToken, claim_expires_at: claimExpiresAt });
}
