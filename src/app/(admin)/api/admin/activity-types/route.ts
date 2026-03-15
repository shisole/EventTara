import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await (supabase as AnyClient)
    .from("activity_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    slug,
    label,
    short_label,
    plural_label,
    icon,
    color_preset,
    supports_distance,
    category,
    sort_order,
  } = body;

  if (!slug || !label || !short_label || !plural_label) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check slug uniqueness
  const { data: existing } = await (supabase as AnyClient)
    .from("activity_types")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
  }

  const { data, error } = await (supabase as AnyClient)
    .from("activity_types")
    .insert({
      slug,
      label,
      short_label,
      plural_label,
      icon: icon || "🏃",
      color_preset: color_preset || "gray",
      supports_distance: supports_distance ?? false,
      category: category || "outdoor",
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("activity-types");
  return NextResponse.json(data, { status: 201 });
}
