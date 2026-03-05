import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("cms_homepage_sections")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { sections } = body;

  if (!Array.isArray(sections)) {
    return NextResponse.json({ error: "sections must be an array" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("cms_homepage_sections")
    .update({ sections })
    .eq("id", 1)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("homepage-sections");

  return NextResponse.json(data);
}
