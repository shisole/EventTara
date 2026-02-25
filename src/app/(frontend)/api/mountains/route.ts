import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const search = searchParams.get("search");

  let query = supabase
    .from("mountains")
    .select("*")
    .order("name");

  if (province) {
    query = query.eq("province", province);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: mountains, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mountains });
}
