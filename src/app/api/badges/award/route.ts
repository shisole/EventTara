import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { badge_id, user_ids } = await request.json();

  if (!badge_id || !user_ids || !Array.isArray(user_ids)) {
    return NextResponse.json({ error: "Missing badge_id or user_ids" }, { status: 400 });
  }

  const records = user_ids.map((userId: string) => ({
    badge_id,
    user_id: userId,
  }));

  const { error } = await supabase
    .from("user_badges")
    .upsert(records, { onConflict: "user_id,badge_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ awarded: user_ids.length });
}
