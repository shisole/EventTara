import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
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

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Only owner can change roles
  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.promote_roles);
  if (!role) {
    return NextResponse.json({ error: "Only the club owner can change roles" }, { status: 403 });
  }

  const body = await request.json();
  const { user_id, role: newRole } = body;

  if (!user_id || !newRole) {
    return NextResponse.json({ error: "user_id and role are required" }, { status: 400 });
  }

  // Cannot change owner role
  const validRoles = ["member", "moderator", "admin"];
  if (!validRoles.includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Cannot change own role
  if (user_id === user.id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("club_members")
    .update({ role: newRole })
    .eq("club_id", club.id)
    .eq("user_id", user_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Admin+ can remove members
  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.remove_members);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { user_id } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  // Cannot remove yourself
  if (user_id === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // Cannot remove the owner
  const { data: targetMember } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user_id)
    .single();

  if (targetMember?.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the club owner" }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", club.id)
    .eq("user_id", user_id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
