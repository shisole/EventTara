import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch club by slug
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  // Check permission: must be owner or admin
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse body
  const body = (await request.json()) as {
    title?: string;
    num_winners?: number;
    duration_seconds?: number;
    badge_id?: string | null;
  };

  const title = body.title || "Duck Race";
  const numWinners = body.num_winners && body.num_winners >= 1 ? body.num_winners : 1;
  const durationSeconds = Math.max(5, Math.min(60, body.duration_seconds ?? 10));
  const badgeId = body.badge_id ?? null;

  // Insert race
  const { data: race, error: insertError } = await supabase
    .from("club_races")
    .insert({
      club_id: club.id,
      title,
      num_winners: numWinners,
      duration_seconds: durationSeconds,
      badge_id: badgeId,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (insertError || !race) {
    console.error("[races/create] Insert error:", insertError?.message);
    return NextResponse.json({ error: "Failed to create race" }, { status: 500 });
  }

  return NextResponse.json(race, { status: 201 });
}
