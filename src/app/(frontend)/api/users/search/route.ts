import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const limit = Math.min(Number(searchParams.get("limit") || 5), 10);

  if (!query || query.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url")
    .not("username", "is", null)
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data || []).map((u) => ({
    id: u.id,
    username: u.username!,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
  }));

  return NextResponse.json({ users });
}
