import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications/create";
import { createClient } from "@/lib/supabase/server";

interface LikeBody {
  commentId: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as LikeBody;
  if (!body.commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  const { error } = await supabase.from("feed_comment_likes").insert({
    user_id: user.id,
    comment_id: body.commentId,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already liked" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify comment owner (fire-and-forget)
  void (async () => {
    try {
      const { data: comment } = await supabase
        .from("feed_comments")
        .select("user_id, activity_id")
        .eq("id", body.commentId)
        .single();
      if (!comment) return;
      await createNotification(supabase, {
        userId: comment.user_id,
        type: "feed_comment_like",
        title: "Comment Liked",
        body: `${user.user_metadata?.full_name || "Someone"} liked your comment.`,
        href: `/post/${comment.activity_id}`,
        actorId: user.id,
      });
    } catch {
      // Ignore notification errors
    }
  })();

  return NextResponse.json({ message: "Liked" }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as LikeBody;
  if (!body.commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  await supabase
    .from("feed_comment_likes")
    .delete()
    .eq("user_id", user.id)
    .eq("comment_id", body.commentId);

  return NextResponse.json({ message: "Removed" }, { status: 200 });
}
