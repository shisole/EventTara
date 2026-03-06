import { randomUUID } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const claimToken = randomUUID();
  const claimExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("organizer_profiles")
    .update({
      claim_token: claimToken,
      claim_expires_at: claimExpiresAt,
    })
    .eq("id", id)
    .eq("is_claimed", false)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Profile not found or already claimed" }, { status: 404 });
  }

  return NextResponse.json(data);
}
