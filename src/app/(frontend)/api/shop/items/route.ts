import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const category = request.nextUrl.searchParams.get("category") as
    | "accessory"
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

  return NextResponse.json({ items: data });
}
