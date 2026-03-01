import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { normalizeMountainName, stripMountainPrefix } from "@/lib/utils/normalize-mountain-name";

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
  let { mountain_id } = body;
  const {
    name,
    province,
    difficulty_level,
    elevation_masl,
    route_name,
    difficulty_override,
    sort_order,
  } = body;

  // Handle custom mountains (mountain_id starts with "custom-")
  if (typeof mountain_id === "string" && mountain_id.startsWith("custom-")) {
    if (!name) {
      return NextResponse.json({ error: "Name is required for custom mountains" }, { status: 400 });
    }

    const normalizedName = normalizeMountainName(name);
    const stripped = stripMountainPrefix(normalizedName);

    // Search for an existing mountain with the same base name
    const { data: matches } = await supabase
      .from("mountains")
      .select("id, name")
      .ilike("name", `%${stripped}%`);

    const exactMatch = (matches || []).find((m) => stripMountainPrefix(m.name) === stripped);

    if (exactMatch) {
      mountain_id = exactMatch.id;
    } else {
      // Create a new mountain row
      const { data: newMountain, error: createError } = await supabase
        .from("mountains")
        .insert({
          name: normalizedName,
          province: province || "",
          difficulty_level: difficulty_level ?? 2,
          elevation_masl: elevation_masl ?? null,
        })
        .select("id")
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      mountain_id = newMountain.id;
    }
  }

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
