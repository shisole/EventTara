import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { generateSlug } from "@/lib/clubs/slug";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club, error } = await supabase.from("clubs").select("*").eq("slug", slug).single();

  if (error || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Get member count and event count in parallel
  const [{ count: memberCount }, { count: eventCount }] = await Promise.all([
    supabase
      .from("club_members")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id)
      .in("status", ["published", "completed"]),
  ]);

  return NextResponse.json({
    club,
    member_count: memberCount ?? 0,
    event_count: eventCount ?? 0,
  });
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

  // Look up the club
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Check permission: need admin+ for general settings
  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.edit_settings);

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // payment_info requires owner role
  if (body.payment_info !== undefined) {
    const ownerRole = await checkClubPermissionServer(
      user.id,
      club.id,
      CLUB_PERMISSIONS.manage_payment,
    );
    if (!ownerRole) {
      return NextResponse.json(
        { error: "Only the club owner can update payment info" },
        { status: 403 },
      );
    }
  }

  // Build update payload with only allowed fields
  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) {
    updateData.name = body.name.trim();
  }
  if (body.description !== undefined) {
    updateData.description = body.description;
  }
  if (body.logo_url !== undefined) {
    updateData.logo_url = body.logo_url;
  }
  if (body.cover_url !== undefined) {
    updateData.cover_url = body.cover_url;
  }
  if (body.activity_types !== undefined) {
    updateData.activity_types = body.activity_types;
  }
  if (body.visibility !== undefined) {
    updateData.visibility = body.visibility;
  }
  if (body.location !== undefined) {
    updateData.location = body.location;
  }
  if (body.payment_info !== undefined) {
    updateData.payment_info = body.payment_info;
  }

  // If name changed, regenerate slug
  if (body.name !== undefined && body.name.trim() !== club.name) {
    let newSlug = generateSlug(body.name);
    if (!newSlug) {
      return NextResponse.json({ error: "Invalid club name" }, { status: 400 });
    }

    // Check uniqueness (exclude current club)
    const { data: existingSlug } = await supabase
      .from("clubs")
      .select("id")
      .eq("slug", newSlug)
      .neq("id", club.id)
      .maybeSingle();

    if (existingSlug) {
      newSlug = `${newSlug}-${Date.now()}`.slice(0, 60);
    }

    updateData.slug = newSlug;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updatedClub, error: updateError } = await supabase
    .from("clubs")
    .update(updateData)
    .eq("id", club.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ club: updatedClub });
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

  // Look up the club
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Check permission: owner only
  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.delete_club);

  if (!role) {
    return NextResponse.json({ error: "Only the club owner can delete the club" }, { status: 403 });
  }

  const { error: deleteError } = await supabase.from("clubs").delete().eq("id", club.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
