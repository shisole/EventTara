import { type Metadata } from "next";
import { notFound } from "next/navigation";

import { type RaceData, type RaceParticipant } from "@/lib/races/types";
import { createClient } from "@/lib/supabase/server";

import RaceClient from "./RaceClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: race } = await supabase
    .from("club_races")
    .select("title")
    .eq("id", id)
    .maybeSingle();
  return {
    title: race ? `${race.title} — EventTara` : "Race — EventTara",
  };
}

export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch race
  const { data: race, error: raceError } = await supabase
    .from("club_races")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (raceError || !race) notFound();

  // Fetch club
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url")
    .eq("id", race.club_id)
    .single();

  if (!club) notFound();

  // Check auth & permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: membership } = await supabase
      .from("club_members")
      .select("role")
      .eq("club_id", club.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = membership?.role === "owner" || membership?.role === "admin";
  }

  // For completed races, fetch participant details
  let participants: RaceParticipant[] = [];
  if (
    race.status === "completed" &&
    Array.isArray(race.participant_ids) &&
    race.participant_ids.length > 0
  ) {
    const participantIds = race.participant_ids;
    const winnerIds = race.winner_ids;
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, username, avatar_url")
      .in("id", participantIds);
    if (users) {
      participants = users.map((u) => ({
        user_id: u.id,
        full_name: u.full_name ?? "Unknown",
        username: u.username,
        avatar_url: u.avatar_url,
        isWinner: winnerIds.includes(u.id),
      }));
      // Sort: winners first
      participants.sort((a, b) => (a.isWinner === b.isWinner ? 0 : a.isWinner ? -1 : 1));
    }
  }

  const raceData: RaceData = {
    id: race.id,
    title: race.title,
    status: race.status,
    num_winners: race.num_winners,
    duration_seconds: race.duration_seconds,
    badge_id: race.badge_id,
    club,
    participants,
    completed_at: race.completed_at,
  };

  return <RaceClient race={raceData} isAdmin={isAdmin} />;
}
