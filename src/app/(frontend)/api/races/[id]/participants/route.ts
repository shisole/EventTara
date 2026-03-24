import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch race
  const { data: race } = await supabase
    .from("club_races")
    .select("club_id, event_id")
    .eq("id", id)
    .maybeSingle();

  if (!race) {
    return NextResponse.json({ error: "Race not found" }, { status: 404 });
  }

  // Check admin/owner role
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", race.club_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch participants: check-ins if event-linked, else club members
  let userIds: string[];
  if (race.event_id) {
    const { data: checkins } = await supabase
      .from("event_checkins")
      .select("user_id")
      .eq("event_id", race.event_id);
    userIds = (checkins ?? []).map((c) => c.user_id);
  } else {
    const { data: members } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", race.club_id);
    userIds = (members ?? []).map((m) => m.user_id);
  }

  if (userIds.length === 0) {
    return NextResponse.json({ names: [] });
  }

  const { data: users } = await supabase.from("users").select("full_name").in("id", userIds);

  const names = (users ?? []).map((u) => u.full_name ?? "Unknown");

  return NextResponse.json({ names });
}
