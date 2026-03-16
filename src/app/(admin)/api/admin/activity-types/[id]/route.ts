import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  // If slug is being changed, check uniqueness
  if (body.slug) {
    const { data: existing } = await (supabase as AnyClient)
      .from("activity_types")
      .select("id")
      .eq("slug", body.slug)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
  }

  const { data, error } = await (supabase as AnyClient)
    .from("activity_types")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("activity-types");
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { error } = await (supabase as AnyClient).from("activity_types").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("activity-types");
  return NextResponse.json({ success: true });
}
