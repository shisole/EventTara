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

  const { data, error } = await supabase
    .from("user_inventory")
    .select("*, shop_items(*)")
    .eq("user_id", user.id)
    .order("purchased_at", { ascending: false });

  if (error) {
    console.error("[user-inventory GET] DB error:", error.message);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }

  return NextResponse.json({ inventory: data });
}
