import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Parse and validate body
  const body = await request.json();
  const { email, password, full_name, org_name, existing_user_id } = body as {
    email?: string;
    password?: string;
    full_name?: string;
    org_name: string;
    existing_user_id?: string;
  };

  if (!org_name) {
    return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
  }

  // Use service client for all operations
  const adminClient = createServiceClient();

  // Look up the organizer profile by claim token
  const { data: profile, error: profileError } = await adminClient
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

  let userId: string;

  if (existing_user_id) {
    // Signed-in user claiming — just upgrade their role, don't overwrite details
    userId = existing_user_id;

    const { error: userError } = await adminClient
      .from("users")
      .update({ role: "organizer" as const })
      .eq("id", userId);

    if (userError) {
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
    }
  } else {
    // New user claiming — validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    // Create user with auto-confirm so they can sign in immediately
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: "organizer",
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

    userId = authData.user?.id ?? "";
    if (!userId) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // Update the users table with claim details
    const { error: userError } = await adminClient
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
  }

  // Update the organizer profile
  const { error: orgError } = await adminClient
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

  return NextResponse.json({ success: true, isExistingUser: !!existing_user_id });
}
