import { NextResponse } from "next/server";

import { createNotification } from "@/lib/notifications/create";
import { pickWinners } from "@/lib/races/pick-winners";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch race
  const { data: race, error: raceError } = await supabase
    .from("club_races")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (raceError || !race) {
    return NextResponse.json({ error: "Race not found" }, { status: 404 });
  }

  if (race.status !== "pending") {
    return NextResponse.json({ error: "Race already completed" }, { status: 400 });
  }

  // Check user has admin/owner role in the race's club
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", race.club_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all club members
  const { data: members } = await supabase
    .from("club_members")
    .select("user_id")
    .eq("club_id", race.club_id);

  const memberIds = (members ?? []).map((m) => m.user_id);

  // Pick winners
  const winnerIds = pickWinners(memberIds, race.num_winners);

  // Update race
  const { error: updateError } = await supabase
    .from("club_races")
    .update({
      status: "completed" as const,
      winner_ids: winnerIds,
      participant_ids: memberIds,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("[races/start] Update error:", updateError.message);
    return NextResponse.json({ error: "Failed to update race" }, { status: 500 });
  }

  // Award badges to winners if badge_id is set
  if (race.badge_id) {
    for (const winnerId of winnerIds) {
      // Check if they already have the badge
      const { data: existing } = await supabase
        .from("user_badges")
        .select("id")
        .eq("user_id", winnerId)
        .eq("badge_id", race.badge_id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("user_badges").insert({
          user_id: winnerId,
          badge_id: race.badge_id,
        });
      }

      // Send notification
      await createNotification(supabase, {
        userId: winnerId,
        type: "badge_earned",
        title: "You won the race!",
        body: `You won "${race.title}" and earned a badge!`,
        href: "/achievements",
      });
    }
  }

  // Fetch participant user details
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, username, avatar_url")
    .in("id", memberIds);

  const participants = (users ?? []).map((u) => ({
    user_id: u.id,
    full_name: u.full_name ?? "Unknown",
    username: u.username,
    avatar_url: u.avatar_url,
    isWinner: winnerIds.includes(u.id),
  }));

  return NextResponse.json({
    success: true,
    winners: winnerIds,
    participants,
  });
}
