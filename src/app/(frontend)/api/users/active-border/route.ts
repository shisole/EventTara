import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** GET /api/users/active-border — list all earned borders for the current user */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [bordersResult, activeResult] = await Promise.all([
    supabase
      .from("user_avatar_borders")
      .select("id, border_id, awarded_at, avatar_borders(*)")
      .eq("user_id", user.id)
      .order("awarded_at", { ascending: true }),
    supabase.from("users").select("active_border_id").eq("id", user.id).single(),
  ]);

  return NextResponse.json({
    earned_borders: bordersResult.data ?? [],
    active_border_id: activeResult.data?.active_border_id ?? null,
  });
}

/** PATCH /api/users/active-border — set or clear the active border */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { border_id } = await request.json();

  // Allow null to clear border
  if (border_id !== null) {
    // Verify user owns this border
    const { data: owned } = await supabase
      .from("user_avatar_borders")
      .select("id")
      .eq("user_id", user.id)
      .eq("border_id", border_id)
      .single();

    if (!owned) {
      return NextResponse.json({ error: "Border not earned" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ active_border_id: border_id })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ active_border_id: border_id });
}
