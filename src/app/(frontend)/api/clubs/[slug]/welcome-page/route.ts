import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const role = await checkClubPermissionServer(user.id, club.id, CLUB_PERMISSIONS.edit_settings);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { event_id, code, title, subtitle } = body as {
    event_id?: string;
    code: string;
    title: string;
    subtitle?: string;
  };

  if (!code || !title) {
    return NextResponse.json({ error: "code and title are required" }, { status: 400 });
  }

  // Insert without event_id first (column may not be available via PostgREST)
  const { error } = await supabase.from("welcome_pages").insert({
    code,
    title,
    subtitle: subtitle ?? null,
    club_id: club.id,
    redirect_url: event_id ? `/events/${event_id}` : `/clubs/${club.slug}`,
    is_active: true,
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Welcome page already exists", code: "DUPLICATE" },
        { status: 409 },
      );
    }
    console.error("[welcome-page POST]", error.message, error.code);
    return NextResponse.json({ error: "Failed to create welcome page" }, { status: 500 });
  }

  // Best-effort: set event_id
  if (event_id) {
    await supabase.from("welcome_pages").update({ event_id }).eq("code", code);
  }

  // Fetch the created row to return
  const { data: created } = await supabase
    .from("welcome_pages")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  return NextResponse.json({ welcome_page: created }, { status: 201 });
}

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
    console.error("[welcome-page GET] DB error:", error.message);
    return NextResponse.json({ error: "Failed to fetch welcome page" }, { status: 500 });
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
    console.error("[welcome-page PATCH] DB error:", error.message);
    return NextResponse.json({ error: "Failed to update welcome page" }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: "Update failed — check permissions" }, { status: 403 });
  }

  return NextResponse.json({ welcome_page: updated });
}
