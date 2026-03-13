import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const category = request.nextUrl.searchParams.get("category") as
    | "accessory"
    | "animal"
    | "background"
    | "border"
    | "skin"
    | null;

  let query = supabase.from("shop_items").select("*").eq("is_active", true).order("sort_order");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // For animal items, resolve avatar_animal_id from avatar_animals by slug
  const animalItems = (data ?? []).filter((item) => item.category === "animal");
  if (animalItems.length > 0) {
    const slugs = animalItems.map((item) => item.slug);
    const { data: animals } = await supabase
      .from("avatar_animals")
      .select("id, slug")
      .in("slug", slugs);

    const slugToAnimalId = new Map((animals ?? []).map((a) => [a.slug, a.id]));
    for (const item of data ?? []) {
      if (item.category === "animal") {
        (item as Record<string, unknown>).avatar_animal_id = slugToAnimalId.get(item.slug) ?? null;
      }
    }
  }

  return NextResponse.json({ items: data });
}
