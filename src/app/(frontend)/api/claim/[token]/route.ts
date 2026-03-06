import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();

  // Parse and validate body
  const body = await request.json();
  const { email, password, full_name, org_name } = body as {
    email: string;
    password: string;
    full_name: string;
    org_name: string;
  };

  if (!email || !password || !full_name || !org_name) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  // Look up the organizer profile by claim token
  const { data: profile, error: profileError } = await supabase
    .from("organizer_profiles")
    .select("id, claim_expires_at, is_claimed, pending_username")
    .eq("claim_token", token)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Invalid claim link" }, { status: 404 });
  }

  if (profile.is_claimed) {
    return NextResponse.json({ error: "This account has already been claimed" }, { status: 400 });
  }

  if (profile.claim_expires_at && new Date(profile.claim_expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This claim link has expired. Please contact the admin for a new one." },
      { status: 400 },
    );
  }

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role: "organizer",
      },
    },
  });

  if (authError) {
    if (authError.message?.includes("already registered")) {
      return NextResponse.json(
        { error: "This email is already registered. Please use a different email or log in." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const userId = authData.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }

  // Update the users table
  const { error: userError } = await supabase
    .from("users")
    .update({
      full_name,
      role: "organizer" as const,
      username: profile.pending_username,
    })
    .eq("id", userId);

  if (userError) {
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
  }

  // Update the organizer profile
  const { error: orgError } = await supabase
    .from("organizer_profiles")
    .update({
      user_id: userId,
      org_name,
      is_claimed: true,
      claim_token: null,
      claim_expires_at: null,
      pending_username: null,
    })
    .eq("id", profile.id);

  if (orgError) {
    return NextResponse.json({ error: "Failed to update organizer profile" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
