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

  return NextResponse.json({ config: data });
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
