import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";

const PARTICIPANT_CAP = 250;
const CLUB_CAP = 50;

export async function GET() {
  const supabase = createServiceClient();

  const [usersResult, clubsResult] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).neq("role", "guest"),
    supabase.from("clubs").select("id", { count: "exact", head: true }),
  ]);

  const participants = Math.min(usersResult.count ?? 0, PARTICIPANT_CAP);
  const clubs = Math.min(clubsResult.count ?? 0, CLUB_CAP);

  return NextResponse.json(
    { participants, clubs, participantCap: PARTICIPANT_CAP, clubCap: CLUB_CAP },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } },
  );
}
