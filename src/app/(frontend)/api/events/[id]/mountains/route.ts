import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: eventMountains, error } = await supabase
    .from("event_mountains")
    .select("id, mountain_id, route_name, difficulty_override, sort_order, created_at")
    .eq("event_id", id)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!eventMountains || eventMountains.length === 0) {
    return NextResponse.json({ mountains: [] });
  }

  const mountainIds = eventMountains.map((em) => em.mountain_id);
  const { data: mountains } = await supabase
    .from("mountains")
    .select("id, name, province, difficulty_level, elevation_masl")
    .in("id", mountainIds);

  const mountainMap = new Map((mountains || []).map((m) => [m.id, m]));

  const result = eventMountains.map((em) => {
    const mountain = mountainMap.get(em.mountain_id);
    return {
      event_mountain_id: em.id,
      mountain_id: em.mountain_id,
      name: mountain?.name ?? "",
      province: mountain?.province ?? "",
      difficulty_level: mountain?.difficulty_level ?? 0,
      elevation_masl: mountain?.elevation_masl ?? null,
      route_name: em.route_name,
      difficulty_override: em.difficulty_override,
      sort_order: em.sort_order,
    };
  });

  return NextResponse.json({ mountains: result });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mountain_id, route_name, difficulty_override, sort_order } = body;

  // Check for existing link
  const { data: existing } = await supabase
    .from("event_mountains")
    .select("id")
    .eq("event_id", id)
    .eq("mountain_id", mountain_id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Mountain already linked to this event" }, { status: 409 });
  }

  const { data: eventMountain, error } = await supabase
    .from("event_mountains")
    .insert({
      event_id: id,
      mountain_id,
      route_name: route_name || null,
      difficulty_override: difficulty_override || null,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event_mountain: eventMountain });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mountain_id } = body;

  const { error } = await supabase
    .from("event_mountains")
    .delete()
    .eq("event_id", id)
    .eq("mountain_id", mountain_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
