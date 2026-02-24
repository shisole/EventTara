import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { event_id, title, description, image_url, category, rarity } = await request.json();

  // Check if badge already exists for event — upsert
  const { data: existing } = await supabase
    .from("badges")
    .select("id")
    .eq("event_id", event_id)
    .single();

  if (existing) {
    const { data: badge, error } = await supabase
      .from("badges")
      .update({ title, description, image_url, category, rarity })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ badge });
  }

  const { data: badge, error } = await supabase
    .from("badges")
    .insert({ event_id, title, description, image_url, category, rarity })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ badge });
}
