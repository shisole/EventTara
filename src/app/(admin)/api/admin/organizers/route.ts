import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("organizer_profiles")
    .select(
      "id, org_name, logo_url, user_id, claim_token, claim_expires_at, is_claimed, pending_username, created_at, users(username, email)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    org_name?: string;
    username?: string;
    logo_url?: string;
  };

  const { org_name, username, logo_url } = body;

  if (!org_name?.trim() || !username?.trim()) {
    return NextResponse.json({ error: "org_name and username are required" }, { status: 400 });
  }

  // Check username uniqueness in users table
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  // Check for duplicate unclaimed profile with same pending_username
  const { data: existingProfile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("pending_username", username.trim())
    .eq("is_claimed", false)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json(
      { error: "An unclaimed profile with this username already exists" },
      { status: 409 },
    );
  }

  const claimToken = randomUUID();
  const claimExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("organizer_profiles")
    .insert({
      user_id: null,
      org_name: org_name.trim(),
      logo_url: logo_url?.trim() || null,
      claim_token: claimToken,
      claim_expires_at: claimExpiresAt,
      is_claimed: false,
      pending_username: username.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
