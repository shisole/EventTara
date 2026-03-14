import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify club exists and get slug for redirect
  const { data: club } = await supabase.from("clubs").select("id, slug").eq("id", id).single();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Use service client to bypass RLS and upsert admin into club_members
  const serviceClient = createServiceClient();
  const { error } = await serviceClient.from("club_members").upsert(
    {
      club_id: id,
      user_id: user.id,
      role: "admin",
      joined_at: new Date().toISOString(),
    },
    { onConflict: "club_id,user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slug: club.slug });
}
