import { NextResponse } from "next/server";

import { type ClubRole } from "@/lib/clubs/types";
import { createClient } from "@/lib/supabase/server";

const ROLE_HIERARCHY: Record<ClubRole, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
};

const VALID_ASSIGNABLE_ROLES = new Set<ClubRole>(["admin", "moderator", "member"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> },
) {
  const { slug, userId } = await params;
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
    .select("id")
    .eq("slug", slug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Check that the current user is an owner
  const { data: currentMember } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (currentMember?.role !== "owner") {
    return NextResponse.json(
      { error: "Only club owners can change member roles" },
      { status: 403 },
    );
  }

  // Parse and validate new role
  const body = await request.json();
  const newRole: string = body.role;

  if (!newRole || !VALID_ASSIGNABLE_ROLES.has(newRole as ClubRole)) {
    return NextResponse.json(
      { error: "Invalid role. Must be one of: admin, moderator, member" },
      { status: 400 },
    );
  }

  // Owner cannot demote themselves
  if (userId === user.id) {
    return NextResponse.json({ error: "Owners cannot change their own role" }, { status: 400 });
  }

  // Look up the target member
  const { data: targetMember } = await supabase
    .from("club_members")
    .select("id, role")
    .eq("club_id", club.id)
    .eq("user_id", userId)
    .single();

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot change another owner's role
  if (targetMember.role === "owner") {
    return NextResponse.json({ error: "Cannot change another owner's role" }, { status: 403 });
  }

  // Update the role
  const { data: updated, error: updateError } = await supabase
    .from("club_members")
    .update({ role: newRole })
    .eq("id", targetMember.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ member: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; userId: string }> },
) {
  const { slug, userId } = await params;
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
    .select("id")
    .eq("slug", slug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const isSelfLeave = userId === user.id;

  // Get the current user's membership
  const { data: currentMember } = await supabase
    .from("club_members")
    .select("id, role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!currentMember) {
    return NextResponse.json({ error: "You are not a member of this club" }, { status: 403 });
  }

  if (isSelfLeave) {
    // Owner cannot leave if they're the only owner
    if (currentMember.role === "owner") {
      const { count } = await supabase
        .from("club_members")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          {
            error:
              "You are the only owner. Transfer ownership to another member before leaving the club.",
          },
          { status: 400 },
        );
      }
    }

    // Delete own membership
    const { error: deleteError } = await supabase
      .from("club_members")
      .delete()
      .eq("id", currentMember.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Removing another member — requires owner or admin role
  if (currentMember.role !== "owner" && currentMember.role !== "admin") {
    return NextResponse.json(
      { error: "Only owners and admins can remove members" },
      { status: 403 },
    );
  }

  // Look up the target member
  const { data: targetMember } = await supabase
    .from("club_members")
    .select("id, role")
    .eq("club_id", club.id)
    .eq("user_id", userId)
    .single();

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Cannot remove someone with equal or higher role
  const currentRank = ROLE_HIERARCHY[currentMember.role as ClubRole] ?? 0;
  const targetRank = ROLE_HIERARCHY[targetMember.role as ClubRole] ?? 0;

  if (targetRank >= currentRank) {
    return NextResponse.json(
      { error: "Cannot remove a member with equal or higher role" },
      { status: 403 },
    );
  }

  // Delete the target member
  const { error: deleteError } = await supabase
    .from("club_members")
    .delete()
    .eq("id", targetMember.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
