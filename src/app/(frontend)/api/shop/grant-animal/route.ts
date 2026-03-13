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

  const body = (await request.json()) as { animal_id?: string };
  const { animal_id } = body;

  if (!animal_id) {
    return NextResponse.json({ error: "animal_id is required" }, { status: 400 });
  }

  // Look up the avatar_animals row to get the slug
  const { data: animal } = await supabase
    .from("avatar_animals")
    .select("slug")
    .eq("id", animal_id)
    .single();

  if (!animal) {
    return NextResponse.json({ error: "Animal not found" }, { status: 404 });
  }

  // Find the corresponding shop_item
  const { data: shopItem } = await supabase
    .from("shop_items")
    .select("id")
    .eq("slug", animal.slug)
    .eq("category", "animal")
    .single();

  if (!shopItem) {
    return NextResponse.json({ error: "Shop item not found" }, { status: 404 });
  }

  // Check if already owned
  const { data: existing } = await supabase
    .from("user_inventory")
    .select("id")
    .eq("user_id", user.id)
    .eq("shop_item_id", shopItem.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ already_owned: true });
  }

  // Grant for free (no token deduction)
  const { error } = await supabase.from("user_inventory").insert({
    user_id: user.id,
    shop_item_id: shopItem.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ granted: true });
}
