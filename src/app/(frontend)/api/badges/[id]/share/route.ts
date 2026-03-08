import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { platform } = body;

  if (!["twitter", "facebook", "link_copy"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Log share analytics
  await supabase.from("badge_shares").insert({
    badge_id: id,
    user_id: user.id,
    platform: platform as "twitter" | "facebook" | "link_copy",
  });

  // Fetch badge and user info for share link
  const { data: badge } = await supabase
    .from("badges")
    .select("id, title, rarity")
    .eq("id", id)
    .single();

  const { data: userData } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .single();

  if (!badge || !userData) {
    return NextResponse.json({ error: "Data not found" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eventtara.com";
  const shareUrl = `${siteUrl}/badges/${id}?user=${userData.username}`;
  const message = `I just earned the "${badge.title}" badge on EventTara!`;

  return NextResponse.json({
    url: shareUrl,
    message,
    platforms: {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
  });
}
