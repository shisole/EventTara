import { NextResponse } from "next/server";

import { checkClubPermissionServer } from "@/lib/clubs/permissions";
import { createNotifications } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ slug: string; threadId: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
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

  const { data: replies, error } = await supabase
    .from("club_forum_replies")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch author profiles separately (FK references auth.users, not public.users)
  const userIds = [...new Set((replies ?? []).map((r) => r.user_id))];
  const { data: users } =
    userIds.length > 0
      ? await supabase.from("users").select("id, full_name, username, avatar_url").in("id", userIds)
      : { data: [] };
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const mapped = (replies ?? []).map((r) => ({
    id: r.id,
    thread_id: r.thread_id,
    user_id: r.user_id,
    text: r.text,
    created_at: r.created_at,
    author: userMap.get(r.user_id) ?? null,
  }));

  return NextResponse.json({ replies: mapped });
}

export async function POST(req: Request, { params }: RouteContext) {
  const { slug, threadId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await checkClubPermissionServer(user.id, club.id, "member");
  if (!role) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { data: thread } = await supabase
    .from("club_forum_threads")
    .select("id, user_id, title, is_locked")
    .eq("id", threadId)
    .eq("club_id", club.id)
    .single();
  if (!thread) return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  if (thread.is_locked) {
    return NextResponse.json({ error: "Thread is locked" }, { status: 403 });
  }

  const body = (await req.json()) as { text?: string };
  const text = body.text?.trim();
  if (!text || text.length === 0 || text.length > 2000) {
    return NextResponse.json({ error: "Text is required (1-2000 chars)" }, { status: 400 });
  }

  const { data: reply, error } = await supabase
    .from("club_forum_replies")
    .insert({ thread_id: threadId, user_id: user.id, text })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: authorProfile } = await supabase
    .from("users")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .single();
  const authorName = authorProfile?.full_name ?? authorProfile?.username ?? "Someone";

  // Notify thread author
  if (thread.user_id !== user.id) {
    void createNotifications(supabase, [
      {
        userId: thread.user_id,
        type: "forum_reply",
        title: `New reply on "${thread.title}"`,
        body: `${authorName}: ${text.slice(0, 100)}`,
        href: `/clubs/${club.slug}/forum/${threadId}`,
        actorId: user.id,
      },
    ]);
  }

  // Handle @mentions
  const mentionRegex = /@(\w+)/g;
  const mentions = [...text.matchAll(mentionRegex)].map((m) => m[1]);
  if (mentions.length > 0) {
    const { data: mentionedUsers } = await supabase
      .from("users")
      .select("id, username")
      .in("username", mentions);

    if (mentionedUsers && mentionedUsers.length > 0) {
      void createNotifications(
        supabase,
        mentionedUsers
          .filter((u) => u.id !== user.id && u.id !== thread.user_id)
          .map((u) => ({
            userId: u.id,
            type: "forum_mention" as const,
            title: `${authorName} mentioned you`,
            body: `In "${thread.title}": ${text.slice(0, 100)}`,
            href: `/clubs/${club.slug}/forum/${threadId}`,
            actorId: user.id,
          })),
      );
    }
  }

  const replyWithAuthor = {
    ...reply,
    author: {
      id: user.id,
      full_name: authorProfile?.full_name ?? null,
      username: authorProfile?.username ?? null,
      avatar_url: authorProfile?.avatar_url ?? null,
    },
  };

  return NextResponse.json({ reply: replyWithAuthor }, { status: 201 });
}
