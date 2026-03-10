import { NextResponse } from "next/server";

import { checkClubPermissionServer } from "@/lib/clubs/permissions";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ slug: string; threadId: string }>;
}

export async function POST(req: Request, { params }: RouteContext) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("id, type, poll_options")
    .eq("id", threadId)
    .eq("club_id", club.id)
    .single();
  if (thread?.type !== "poll") {
    return NextResponse.json({ error: "Not a poll thread" }, { status: 400 });
  }

  const body = (await req.json()) as { option_index?: number };
  const optionIndex = body.option_index;
  const options = thread.poll_options ?? [];

  if (optionIndex === undefined || optionIndex < 0 || optionIndex >= options.length) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  await supabase
    .from("club_forum_poll_votes")
    .delete()
    .eq("thread_id", threadId)
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("club_forum_poll_votes")
    .insert({ thread_id: threadId, user_id: user.id, option_index: optionIndex });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, option_index: optionIndex });
}
