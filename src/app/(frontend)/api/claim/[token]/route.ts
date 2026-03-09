import { type NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = await createClient();

  const body = await request.json();
  const { existing_user_id, email, password, full_name } = body as {
    existing_user_id?: string;
    email?: string;
    password?: string;
    full_name?: string;
  };

  let userId: string;

  if (existing_user_id) {
    // Existing user claiming — verify they are authenticated as this user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id !== existing_user_id) {
      return NextResponse.json({ error: "Authentication mismatch" }, { status: 403 });
    }
    userId = existing_user_id;
  } else {
    // New user — create account
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 },
      );
    }

    const admin = createServiceClient();
    const { data: adminUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!adminUser.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    userId = adminUser.user.id;

    // Upsert public users row (use admin client — new user has no session yet)
    await admin.from("users").upsert(
      {
        id: userId,
        email,
        full_name,
        role: "organizer",
      },
      { onConflict: "id" },
    );
  }

  // Call the SECURITY DEFINER RPC — validates token, marks claimed, inserts owner atomically.
  // This bypasses RLS (new users have no session yet, and no one is a member before claiming).
  const { data: result, error: rpcError } = await supabase.rpc("claim_club", {
    p_token: token,
    p_user_id: userId,
  });

  if (rpcError) {
    console.error("[claim] RPC error:", rpcError.message);
    return NextResponse.json({ error: "Failed to claim club" }, { status: 500 });
  }

  const rpcResult = result as { error?: string; success?: boolean; club_slug?: string };

  if (rpcResult.error) {
    return NextResponse.json({ error: rpcResult.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, club_slug: rpcResult.club_slug });
}
