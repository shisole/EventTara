import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the club
  const { data: club } = await supabase.from("clubs").select("id, name").eq("slug", slug).single();
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Verify caller is owner
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (membership?.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can transfer ownership" }, { status: 403 });
  }

  const body = await request.json();
  const { new_owner_user_id, confirm_club_name } = body as {
    new_owner_user_id?: string;
    confirm_club_name?: string;
  };

  if (!new_owner_user_id || !confirm_club_name) {
    return NextResponse.json(
      { error: "New owner and club name confirmation are required" },
      { status: 400 },
    );
  }

  // Verify confirmation matches exact club name
  if (confirm_club_name !== club.name) {
    return NextResponse.json({ error: "Club name confirmation does not match" }, { status: 400 });
  }

  // Cannot transfer to yourself
  if (new_owner_user_id === user.id) {
    return NextResponse.json({ error: "Cannot transfer ownership to yourself" }, { status: 400 });
  }

  // Target must be an existing member
  const { data: targetMember } = await supabase
    .from("club_members")
    .select("id, role")
    .eq("club_id", club.id)
    .eq("user_id", new_owner_user_id)
    .single();

  if (!targetMember) {
    return NextResponse.json(
      { error: "Target user must be a member of this club" },
      { status: 400 },
    );
  }

  // Promote target to owner first (momentary two-owner state is harmless)
  const { error: promoteError } = await supabase
    .from("club_members")
    .update({ role: "owner" })
    .eq("club_id", club.id)
    .eq("user_id", new_owner_user_id);

  if (promoteError) {
    return NextResponse.json({ error: "Failed to promote new owner" }, { status: 500 });
  }

  // Demote current owner to admin
  const { error: demoteError } = await supabase
    .from("club_members")
    .update({ role: "admin" })
    .eq("club_id", club.id)
    .eq("user_id", user.id);

  if (demoteError) {
    // Rollback: demote the target back to their previous role
    await supabase
      .from("club_members")
      .update({ role: targetMember.role })
      .eq("club_id", club.id)
      .eq("user_id", new_owner_user_id);
    return NextResponse.json({ error: "Failed to transfer ownership" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
