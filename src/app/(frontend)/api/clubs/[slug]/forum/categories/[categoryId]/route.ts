import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string; categoryId: string }> };

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { slug, categoryId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(
    user.id,
    club.id,
    CLUB_PERMISSIONS.manage_categories,
  );
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("club_forum_categories")
    .delete()
    .eq("id", categoryId)
    .eq("club_id", club.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
