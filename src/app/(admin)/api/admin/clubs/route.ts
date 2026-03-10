import crypto from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { generateSlug } from "@/lib/clubs/slug";
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
    .select(
      "id, name, slug, logo_url, visibility, is_claimed, claim_token, claim_expires_at, created_at",
    )
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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, logo_url, activity_types, visibility } = body as {
    name?: string;
    description?: string;
    logo_url?: string;
    activity_types?: string[];
    visibility?: "public" | "private";
  };

  if (!name || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Club name is required (min 2 characters)" },
      { status: 400 },
    );
  }

  // Generate slug with uniqueness fallback
  let slug = generateSlug(name);
  if (!slug) {
    return NextResponse.json({ error: "Invalid club name" }, { status: 400 });
  }

  const { data: existing } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (existing) {
    slug = `${slug}-${Date.now()}`.slice(0, 60);
  }

  // Generate claim token and 30-day expiry
  const claimToken = crypto.randomBytes(16).toString("hex");
  const claimExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() ?? null,
      logo_url: logo_url?.trim() ?? null,
      activity_types: activity_types ?? [],
      visibility: visibility ?? "public",
      is_claimed: false,
      claim_token: claimToken,
      claim_expires_at: claimExpiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(club, { status: 201 });
}
