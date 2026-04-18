import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: categories, error } = await supabase
    .from("club_forum_categories")
    .select("*")
    .eq("club_id", club.id)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[forum-categories GET] DB error:", error.message);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
  return NextResponse.json({ categories });
}

export async function POST(req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(
    user.id,
    club.id,
    CLUB_PERMISSIONS.manage_categories,
  );
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim();
  if (!name || name.length === 0 || name.length > 50) {
    return NextResponse.json({ error: "Name is required (1-50 chars)" }, { status: 400 });
  }

  const categorySlug = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");

  const { count } = await supabase
    .from("club_forum_categories")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id);

  const { data: category, error } = await supabase
    .from("club_forum_categories")
    .insert({
      club_id: club.id,
      name,
      slug: categorySlug,
      sort_order: (count ?? 0) + 1,
    })
    .select()
    .single();

  if (error) {
    console.error("[forum-categories POST] DB error:", error.message);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
  return NextResponse.json({ category }, { status: 201 });
}
