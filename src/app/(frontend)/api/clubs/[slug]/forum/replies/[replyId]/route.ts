import { NextResponse } from "next/server";

import { checkClubPermissionServer, CLUB_PERMISSIONS } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ slug: string; replyId: string }>;
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { slug, replyId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: reply } = await supabase
    .from("club_forum_replies")
    .select("id, user_id, thread_id")
    .eq("id", replyId)
    .single();
  if (!reply) return NextResponse.json({ error: "Reply not found" }, { status: 404 });

  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("club_id")
    .eq("id", reply.thread_id)
    .single();
  if (!thread || thread.club_id !== club.id) {
    return NextResponse.json({ error: "Reply not found" }, { status: 404 });
  }

  const isAuthor = reply.user_id === user.id;
  if (!isAuthor) {
    const modRole = await checkClubPermissionServer(
      user.id,
      club.id,
      CLUB_PERMISSIONS.delete_any_reply,
    );
    if (!modRole) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("club_forum_replies").delete().eq("id", replyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
