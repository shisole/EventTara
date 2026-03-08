import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
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

  // Check permission: admin+ to view invites
  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.invite_members);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: invites, error } = await supabase
    .from("club_invites")
    .select("id, invite_code, max_uses, uses, expires_at, created_at")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: invites ?? [] });
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

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Check permission: admin+ to create invites
  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.invite_members);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { max_uses?: number | null; expires_in_days?: number | null } = {};
  try {
    body = await request.json();
  } catch {
    // Default values
  }

  const inviteCode = crypto.randomBytes(6).toString("hex");
  const expiresAt = body.expires_in_days
    ? new Date(Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data: invite, error } = await supabase
    .from("club_invites")
    .insert({
      club_id: club.id,
      invited_by: user.id,
      invite_code: inviteCode,
      max_uses: body.max_uses ?? null,
      uses: 0,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invite }, { status: 201 });
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

  // Check permission: admin+ to delete invites
  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.invite_members);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.invite_id) {
    return NextResponse.json({ error: "invite_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("club_invites")
    .delete()
    .eq("id", body.invite_id)
    .eq("club_id", club.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
