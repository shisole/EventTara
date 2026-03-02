import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10);
  const limit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const unreadOnly = searchParams.get("unread_only") === "true";

  let query = supabase
    .from("notifications")
    .select("*, actor:actor_id(full_name, avatar_url, username)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "All notifications marked as read" });
}
