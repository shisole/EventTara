import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/server";

const PARTICIPANT_CAP = 250;
const ORGANIZER_CAP = 50;

export async function GET() {
  const supabase = createServiceClient();

  const [usersResult, organizersResult] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }).neq("role", "guest"),
    supabase.from("organizer_profiles").select("id", { count: "exact", head: true }),
  ]);

  const participants = Math.min(usersResult.count ?? 0, PARTICIPANT_CAP);
  const organizers = Math.min(organizersResult.count ?? 0, ORGANIZER_CAP);

  return NextResponse.json(
    { participants, organizers, participantCap: PARTICIPANT_CAP, organizerCap: ORGANIZER_CAP },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } },
  );
}
