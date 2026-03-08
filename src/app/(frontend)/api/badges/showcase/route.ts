import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { badge_ids } = body;

  if (!Array.isArray(badge_ids)) {
    return NextResponse.json({ error: "badge_ids must be array" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete existing showcase entries
  await supabase.from("user_badge_showcase").delete().eq("user_id", user.id);

  if (badge_ids.length === 0) {
    return NextResponse.json({ success: true });
  }

  // Insert new showcase entries with sort order
  const entries = badge_ids.map((badge_id: string, index: number) => ({
    user_id: user.id,
    badge_id,
    sort_order: index,
  }));

  const { error } = await supabase.from("user_badge_showcase").insert(entries);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: targetUser } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: showcase } = await supabase
    .from("user_badge_showcase")
    .select("badge_id, sort_order, badges(id, title, image_url, rarity)")
    .eq("user_id", targetUser.id)
    .order("sort_order");

  return NextResponse.json({
    badges: (showcase ?? []).map((item) => ({
      ...(item.badges as unknown as {
        id: string;
        title: string;
        image_url: string | null;
        rarity: string;
      }),
      sort_order: item.sort_order,
    })),
  });
}
