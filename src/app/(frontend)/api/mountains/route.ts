import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { stripMountainPrefix } from "@/lib/utils/normalize-mountain-name";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const search = searchParams.get("search");

  let query = supabase.from("mountains").select("*").order("name");

  if (province) {
    query = query.eq("province", province);
  }

  if (search) {
    const stripped = stripMountainPrefix(search);
    const searchTerm = stripped || search;
    query = query.ilike("name", `%${searchTerm}%`);
  }

  const { data: mountains, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mountains });
}
