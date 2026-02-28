import { NextResponse } from "next/server";

import type { ActivityType, EmojiType } from "@/lib/feed/types";
import { createClient } from "@/lib/supabase/server";

interface ReactionBody {
  activityType: ActivityType;
  activityId: string;
  emoji: EmojiType;
}

const VALID_TYPES = new Set(["booking", "checkin", "badge", "border"]);
const VALID_EMOJIS = new Set(["fire", "clap", "green_heart", "mountain"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as ReactionBody;
  if (!VALID_TYPES.has(body.activityType) || !VALID_EMOJIS.has(body.emoji) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { error } = await supabase.from("feed_reactions").insert({
    user_id: user.id,
    activity_type: body.activityType,
    activity_id: body.activityId,
    emoji: body.emoji,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "Already reacted" }, { status: 200 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Reacted" }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as ReactionBody;
  if (!VALID_TYPES.has(body.activityType) || !VALID_EMOJIS.has(body.emoji) || !body.activityId) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  await supabase
    .from("feed_reactions")
    .delete()
    .eq("user_id", user.id)
    .eq("activity_type", body.activityType)
    .eq("activity_id", body.activityId)
    .eq("emoji", body.emoji);

  return NextResponse.json({ message: "Removed" }, { status: 200 });
}
