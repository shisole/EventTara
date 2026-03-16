import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
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

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.edit_settings);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Support ?event_id= query to fetch event-specific welcome page
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");

  let query = supabase
    .from("welcome_pages")
    .select("*")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false })
    .limit(1);

  query = eventId ? query.eq("event_id", eventId) : query.is("event_id", null);

  const { data: welcomePage, error } = await query.maybeSingle();

  if (error) {
    console.error("Welcome page fetch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!welcomePage) {
    return NextResponse.json({ welcome_page: null, claim_count: 0 });
  }

  const { count } = await supabase
    .from("welcome_page_claims")
    .select("id", { count: "exact", head: true })
    .eq("welcome_page_id", welcomePage.id);

  return NextResponse.json({ welcome_page: welcomePage, claim_count: count ?? 0 });
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

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.edit_settings);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Support ?event_id= query to target event-specific welcome page
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("event_id");

  let query = supabase
    .from("welcome_pages")
    .select("id")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false })
    .limit(1);

  query = eventId ? query.eq("event_id", eventId) : query.is("event_id", null);

  const { data: welcomePage } = await query.maybeSingle();

  if (!welcomePage) {
    return NextResponse.json({ error: "Welcome page not found" }, { status: 404 });
  }

  const body = await request.json();

  const allowedFields = [
    "title",
    "subtitle",
    "description",
    "hero_image_url",
    "redirect_url",
    "max_claims",
    "expires_at",
    "is_active",
    "badge_id",
    "event_id",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("welcome_pages")
    .update(updates)
    .eq("id", welcomePage.id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("Welcome page update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: "Update failed — check permissions" }, { status: 403 });
  }

  return NextResponse.json({ welcome_page: updated });
}
