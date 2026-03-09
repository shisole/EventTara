import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url, visibility, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get member counts and owner info for each club
  const enriched = await Promise.all(
    (clubs || []).map(async (club) => {
      const [{ count: memberCount }, { count: eventCount }, { data: ownerMember }] =
        await Promise.all([
          supabase
            .from("club_members")
            .select("*", { count: "exact", head: true })
            .eq("club_id", club.id),
          supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("club_id", club.id),
          supabase
            .from("club_members")
            .select("user_id, users(username, email)")
            .eq("club_id", club.id)
            .eq("role", "owner")
            .limit(1)
            .maybeSingle(),
        ]);

      const owner = ownerMember?.users
        ? Array.isArray(ownerMember.users)
          ? ownerMember.users[0]
          : ownerMember.users
        : null;

      return {
        ...club,
        member_count: memberCount ?? 0,
        event_count: eventCount ?? 0,
        owner,
      };
    }),
  );

  return NextResponse.json(enriched);
}
