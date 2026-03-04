import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Returns users the current user follows, for @mention autocomplete.
 * Only returns id, username, full_name, avatar_url.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ users: [] });
  }

  const { data: follows } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (!follows || follows.length === 0) {
    return NextResponse.json({ users: [] });
  }

  const followingIds = follows.map((f) => f.following_id);

  const { data: users } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url")
    .in("id", followingIds)
    .not("username", "is", null);

  const result = (users || []).map((u) => ({
    id: u.id,
    username: u.username!,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
  }));

  return NextResponse.json({ users: result });
}
