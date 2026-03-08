import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ROLE_ORDER: Record<string, number> = {
  owner: 0,
  admin: 1,
  moderator: 2,
  member: 3,
};

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Look up club by slug
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Query members with user data
  const { data: members, error } = await supabase
    .from("club_members")
    .select("id, club_id, user_id, role, joined_at, users(id, full_name, username, avatar_url)")
    .eq("club_id", club.id)
    .order("joined_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort by role hierarchy (owner first), then by joined_at
  const sorted = (members ?? []).sort((a, b) => {
    const roleA = ROLE_ORDER[a.role] ?? 99;
    const roleB = ROLE_ORDER[b.role] ?? 99;
    if (roleA !== roleB) return roleA - roleB;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  // Flatten user data into each member
  const result = sorted.map((m) => {
    const user = Array.isArray(m.users) ? m.users[0] : m.users;
    return {
      id: m.id,
      club_id: m.club_id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      user: user ?? null,
    };
  });

  return NextResponse.json({ members: result });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up club by slug
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, visibility")
    .eq("slug", slug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("club_members")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already a member of this club" }, { status: 409 });
  }

  // For private clubs, require a valid invite code
  if (club.visibility === "private") {
    let body: { invite_code?: string } = {};
    try {
      body = await request.json();
    } catch {
      // No body provided
    }

    if (!body.invite_code) {
      return NextResponse.json(
        { error: "This club is private. An invite code is required to join." },
        { status: 403 },
      );
    }

    // Validate the invite code
    const { data: invite, error: inviteError } = await supabase
      .from("club_invites")
      .select("*")
      .eq("club_id", club.id)
      .eq("invite_code", body.invite_code)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    // Check expiration
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invite code has expired" }, { status: 400 });
    }

    // Check max uses
    if (invite.max_uses !== null && invite.uses >= invite.max_uses) {
      return NextResponse.json(
        { error: "This invite code has reached its maximum uses" },
        { status: 400 },
      );
    }

    // Increment uses
    const { error: updateError } = await supabase
      .from("club_invites")
      .update({ uses: invite.uses + 1 })
      .eq("id", invite.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  // Insert the new member
  const { data: member, error: insertError } = await supabase
    .from("club_members")
    .insert({
      club_id: club.id,
      user_id: user.id,
      role: "member",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ member }, { status: 201 });
}
