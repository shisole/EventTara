import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("user_avatar_config")
    .select("*, avatar_animals(*)")
    .eq("user_id", user.id)
    .single();

  // Resolve equipped item image URLs
  let accessoryImageUrl: string | null = null;
  let backgroundImageUrl: string | null = null;
  let skinImageUrl: string | null = null;

  const equippedIds = [
    data?.equipped_accessory_id,
    data?.equipped_background_id,
    data?.equipped_skin_id,
  ].filter(Boolean) as string[];

  if (equippedIds.length > 0) {
    const { data: items } = await supabase
      .from("shop_items")
      .select("id, image_url")
      .in("id", equippedIds);

    const itemMap = new Map((items ?? []).map((i) => [i.id, i.image_url]));
    if (data?.equipped_accessory_id)
      accessoryImageUrl = itemMap.get(data.equipped_accessory_id) ?? null;
    if (data?.equipped_background_id)
      backgroundImageUrl = itemMap.get(data.equipped_background_id) ?? null;
    if (data?.equipped_skin_id) skinImageUrl = itemMap.get(data.equipped_skin_id) ?? null;
  }

  const animalImageUrl = (data?.avatar_animals as Record<string, string> | null)?.image_url ?? null;

  return NextResponse.json({
    config: data,
    animal_image_url: animalImageUrl,
    accessory_image_url: accessoryImageUrl,
    background_image_url: backgroundImageUrl,
    skin_image_url: skinImageUrl,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    animal_id,
    equipped_accessory_id,
    equipped_background_id,
    equipped_border_id,
    equipped_skin_id,
  } = body as {
    animal_id?: string | null;
    equipped_accessory_id?: string | null;
    equipped_background_id?: string | null;
    equipped_border_id?: string | null;
    equipped_skin_id?: string | null;
  };

  const { data, error } = await supabase
    .from("user_avatar_config")
    .upsert(
      {
        user_id: user.id,
        ...(animal_id !== undefined && { animal_id }),
        ...(equipped_accessory_id !== undefined && { equipped_accessory_id }),
        ...(equipped_background_id !== undefined && { equipped_background_id }),
        ...(equipped_border_id !== undefined && { equipped_border_id }),
        ...(equipped_skin_id !== undefined && { equipped_skin_id }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*, avatar_animals(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}
