import { type NextRequest, NextResponse } from "next/server";

import { generateSlug } from "@/lib/clubs/slug";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const activity = searchParams.get("activity") || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") || "12", 10)));
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // Count query
  let countQuery = supabase
    .from("clubs")
    .select("id", { count: "exact", head: true })
    .eq("visibility", "public");

  // Data query
  let dataQuery = supabase
    .from("clubs")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (search) {
    const pattern = `%${search.trim().replaceAll(/\s+/g, "%")}%`;
    countQuery = countQuery.ilike("name", pattern);
    dataQuery = dataQuery.ilike("name", pattern);
  }

  if (activity) {
    countQuery = countQuery.contains("activity_types", [activity]);
    dataQuery = dataQuery.contains("activity_types", [activity]);
  }

  dataQuery = dataQuery.range(offset, offset + limit - 1);

  const [{ count }, { data: clubs, error }] = await Promise.all([countQuery, dataQuery]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    clubs: clubs ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "Club name is required" }, { status: 400 });
  }

  // Generate slug from name
  let slug = generateSlug(body.name);

  if (!slug) {
    return NextResponse.json({ error: "Invalid club name" }, { status: 400 });
  }

  // Check slug uniqueness — if taken, append timestamp suffix
  const { data: existing } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${Date.now()}`.slice(0, 60);
  }

  const clubId = crypto.randomUUID();

  const { error } = await supabase.from("clubs").insert({
    id: clubId,
    name: body.name.trim(),
    slug,
    description: body.description ?? null,
    logo_url: body.logo_url ?? null,
    cover_url: body.cover_url ?? null,
    activity_types: body.activity_types ?? [],
    visibility: body.visibility ?? "public",
    location: body.location ?? null,
  });

  if (error) {
    console.error("Club insert error:", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add the creator as owner
  const { error: memberError } = await supabase.from("club_members").insert({
    club_id: clubId,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    // Rollback: delete the club if member creation failed
    console.error("Club member insert error:", memberError.message, memberError.code);
    await supabase.from("clubs").delete().eq("id", clubId);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Auto-generate a welcome page for the club (fire-and-forget)
  supabase
    .from("welcome_pages")
    .insert({
      code: slug,
      title: `Welcome to ${body.name.trim()}!`,
      subtitle: "Scan to join the crew",
      club_id: clubId,
      redirect_url: `/clubs/${slug}`,
      is_active: true,
      created_by: user.id,
    })
    .then(({ error: wpError }) => {
      if (wpError) {
        console.error("Welcome page auto-create error:", wpError.message, wpError.code);
      }
    });

  // SELECT after owner is added so the SELECT policy passes (private clubs need membership)
  const { data: club } = await supabase.from("clubs").select().eq("id", clubId).single();

  return NextResponse.json({ club }, { status: 201 });
}
