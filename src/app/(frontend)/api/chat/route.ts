import Anthropic from "@anthropic-ai/sdk";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { buildSearchSystemPrompt, buildSuggestionPrompt } from "@/lib/ai/search-prompt";
import type { ParsedSearchParams } from "@/lib/ai/search-prompt";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/types";

type EventType = Database["public"]["Tables"]["events"]["Row"]["type"];

// Hard daily cap per user/IP to prevent abuse (session limit is enforced client-side)
const DAILY_HARD_CAP = 30;

export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth: get user, fallback to IP
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Parse request body
  let message: string;
  try {
    const body = await request.json();
    message = body.message;
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }
    if (message.length > 500) {
      return NextResponse.json({ error: "Message too long (max 500 characters)" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Hard daily cap check (abuse prevention — session limit is client-side)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  let countQuery = supabase
    .from("chat_queries")
    .select("id", { count: "exact", head: true })
    .gte("created_at", todayISO);

  countQuery = user ? countQuery.eq("user_id", user.id) : countQuery.eq("ip_address", ip);

  const { count: queryCount } = await countQuery;

  if ((queryCount ?? 0) >= DAILY_HARD_CAP) {
    return NextResponse.json(
      {
        error: "rate_limit",
        reply:
          "You've reached the maximum number of searches for today. Please try again tomorrow!",
      },
      { status: 429 },
    );
  }

  // Call Claude Haiku
  const apiKey = process.env.ANTHROPIC_CHAT_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Chat service not configured" }, { status: 503 });
  }

  const anthropic = new Anthropic({ apiKey });

  let parsed: ParsedSearchParams;
  try {
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: buildSearchSystemPrompt(),
      messages: [{ role: "user", content: message.trim() }],
    });

    const text = completion.content[0].type === "text" ? completion.content[0].text : "";
    // Strip markdown code fences if Haiku wraps the JSON
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned) as ParsedSearchParams;
  } catch (error) {
    console.error("[chat] Haiku call or parse failed:", error);
    return NextResponse.json(
      {
        reply: "Sorry, I had trouble understanding that. Could you try rephrasing your search?",
        events: [],
        totalCount: 0,
        filterUrl: "/events",
      },
      { status: 200 },
    );
  }

  // Build event query using same patterns as /api/events
  const today = new Date().toISOString().split("T")[0];

  let countQ = supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .in("status", ["published", "completed"] as const);

  let dataQ = supabase
    .from("events")
    .select("id, title, type, date, location, price, cover_image_url")
    .in("status", ["published", "completed"] as const);

  // Apply parsed filters
  if (parsed.type) {
    const validTypes: EventType[] = ["hiking", "mtb", "road_bike", "running", "trail_run"];
    if (validTypes.includes(parsed.type)) {
      countQ = countQ.eq("type", parsed.type);
      dataQ = dataQ.eq("type", parsed.type);
    }
  }

  if (parsed.search) {
    const pattern = parsed.search.trim().replaceAll(/\s+/g, "%");

    // Also match organizer names (same pattern as /api/events)
    const { data: matchingOrgs } = await supabase
      .from("organizer_profiles")
      .select("id")
      .ilike("org_name", `%${pattern}%`);
    const orgIds = matchingOrgs?.map((o) => o.id) ?? [];

    // Also match guide names → get their linked event IDs
    const { data: matchingGuides } = await supabase
      .from("guides")
      .select("id")
      .ilike("full_name", `%${pattern}%`);
    let guideEventIds: string[] = [];
    if (matchingGuides && matchingGuides.length > 0) {
      const guideIds = matchingGuides.map((g) => g.id);
      const { data: links } = await supabase
        .from("event_guides")
        .select("event_id")
        .in("guide_id", guideIds);
      guideEventIds = links?.map((l) => l.event_id) ?? [];
    }

    let filter = `title.ilike.%${pattern}%,location.ilike.%${pattern}%`;
    if (orgIds.length > 0) {
      filter += `,organizer_id.in.(${orgIds.join(",")})`;
    }
    if (guideEventIds.length > 0) {
      filter += `,id.in.(${guideEventIds.join(",")})`;
    }
    countQ = countQ.or(filter);
    dataQ = dataQ.or(filter);
  }

  if (parsed.duration === "single") {
    countQ = countQ.is("end_date", null);
    dataQ = dataQ.is("end_date", null);
  } else if (parsed.duration === "multi") {
    countQ = countQ.not("end_date", "is", null);
    dataQ = dataQ.not("end_date", "is", null);
  }

  // Distance filter: query event_distances table for matching distance
  if (parsed.distance) {
    const { data: distanceRows } = await supabase
      .from("event_distances")
      .select("event_id")
      .eq("distance_km", parsed.distance);
    const distanceEventIds = distanceRows?.map((d) => d.event_id) ?? [];
    if (distanceEventIds.length === 0) {
      // No events match this distance — return empty results early
      const emptyFilterParts: string[] = [];
      if (parsed.search) emptyFilterParts.push(`search=${encodeURIComponent(parsed.search)}`);
      if (parsed.type) emptyFilterParts.push(`type=${parsed.type}`);
      if (parsed.distance) emptyFilterParts.push(`distance=${parsed.distance}`);
      if (parsed.difficulty) emptyFilterParts.push(`difficulty=${parsed.difficulty}`);
      const emptyFilterUrl = `/events${emptyFilterParts.length > 0 ? `?${emptyFilterParts.join("&")}` : ""}`;

      // Log query even for empty distance results
      await supabase.from("chat_queries").insert({
        user_id: user?.id ?? null,
        ip_address: user ? null : ip,
        query: message.trim(),
        parsed_params: parsed as unknown as Json,
        result_count: 0,
      });

      const searchTerm = parsed.search ?? message.trim();
      return NextResponse.json({
        reply: `Sorry, but there are no results for "${searchTerm}". Try a different search or browse all events!`,
        events: [],
        totalCount: 0,
        filterUrl: emptyFilterUrl,
      });
    }
    countQ = countQ.in("id", distanceEventIds);
    dataQ = dataQ.in("id", distanceEventIds);
  }

  // Difficulty filter: range-based (e.g. "1-4", "5-7", "8-9")
  if (parsed.difficulty) {
    const [minStr, maxStr] = parsed.difficulty.split("-");
    const min = Number.parseInt(minStr, 10);
    const max = Number.parseInt(maxStr, 10);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      countQ = countQ
        .not("difficulty_level", "is", null)
        .gte("difficulty_level", min)
        .lte("difficulty_level", max);
      dataQ = dataQ
        .not("difficulty_level", "is", null)
        .gte("difficulty_level", min)
        .lte("difficulty_level", max);
    }
  }

  if (parsed.dateFrom) {
    countQ = countQ.gte("date", parsed.dateFrom);
    dataQ = dataQ.gte("date", parsed.dateFrom);
  }

  if (parsed.dateTo) {
    countQ = countQ.lte("date", `${parsed.dateTo}T23:59:59`);
    dataQ = dataQ.lte("date", `${parsed.dateTo}T23:59:59`);
  }

  if (parsed.when) {
    switch (parsed.when) {
      case "upcoming": {
        countQ = countQ.gt("date", today);
        dataQ = dataQ.gt("date", today);
        break;
      }
      case "now": {
        countQ = countQ.gte("date", today).lte("date", `${today}T23:59:59`);
        dataQ = dataQ.gte("date", today).lte("date", `${today}T23:59:59`);
        break;
      }
      case "past": {
        countQ = countQ.lt("date", today);
        dataQ = dataQ.lt("date", today);
        break;
      }
    }
  }

  dataQ = dataQ.order("date", { ascending: true }).limit(3);

  const [{ count: totalCount }, { data: events }] = await Promise.all([countQ, dataQ]);

  const miniEvents = (events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date,
    location: e.location,
    price: e.price,
    cover_image_url: e.cover_image_url,
  }));

  const count = totalCount ?? 0;

  // Build filter URL for "View all results"
  const filterParts: string[] = [];
  if (parsed.search) filterParts.push(`search=${encodeURIComponent(parsed.search)}`);
  if (parsed.type) filterParts.push(`type=${parsed.type}`);
  if (parsed.dateFrom) filterParts.push(`from=${parsed.dateFrom}`);
  if (parsed.dateTo) filterParts.push(`to=${parsed.dateTo}`);
  if (parsed.when) filterParts.push(`when=${parsed.when}`);
  if (parsed.distance) filterParts.push(`distance=${parsed.distance}`);
  if (parsed.difficulty) filterParts.push(`difficulty=${parsed.difficulty}`);
  const filterUrl = `/events${filterParts.length > 0 ? `?${filterParts.join("&")}` : ""}`;

  // Log query for rate limiting + analytics
  const { error: insertErr } = await supabase.from("chat_queries").insert({
    user_id: user?.id ?? null,
    ip_address: user ? null : ip,
    query: message.trim(),
    parsed_params: parsed as unknown as Json,
    result_count: count,
  });
  if (insertErr) {
    console.error("[chat] Failed to log query:", insertErr.message);
  }

  // When no results found, run fallback query and suggest nearest events
  if (count === 0) {
    // Fallback: keep type + search, drop date/distance/difficulty, find nearest upcoming
    let fallbackQ = supabase
      .from("events")
      .select("id, title, type, date, location, price, cover_image_url")
      .eq("status", "published")
      .gt("date", today);

    if (parsed.type) {
      fallbackQ = fallbackQ.eq("type", parsed.type);
    }
    if (parsed.search) {
      const pattern = parsed.search.trim().replaceAll(/\s+/g, "%");
      fallbackQ = fallbackQ.or(`title.ilike.%${pattern}%,location.ilike.%${pattern}%`);
    }

    fallbackQ = fallbackQ.order("date", { ascending: true }).limit(3);
    const { data: fallbackEvents } = await fallbackQ;

    if (fallbackEvents && fallbackEvents.length > 0) {
      // Second Claude call to generate a natural suggestion
      try {
        const suggestionCompletion = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: buildSuggestionPrompt(message.trim(), parsed.type, fallbackEvents),
          messages: [{ role: "user", content: "Suggest the nearest events." }],
        });

        const suggestionText =
          suggestionCompletion.content[0].type === "text"
            ? suggestionCompletion.content[0].text
            : "";
        const cleanedSuggestion = suggestionText
          .replace(/^```(?:json)?\s*\n?/i, "")
          .replace(/\n?```\s*$/i, "")
          .trim();
        const suggestionParsed = JSON.parse(cleanedSuggestion) as { reply: string };

        const fallbackMini = fallbackEvents.map((e) => ({
          id: e.id,
          title: e.title,
          type: e.type,
          date: e.date,
          location: e.location,
          price: e.price,
          cover_image_url: e.cover_image_url,
        }));

        // Build broader filter URL for "View all results"
        const fallbackFilterParts: string[] = [];
        if (parsed.type) fallbackFilterParts.push(`type=${parsed.type}`);
        if (parsed.search) fallbackFilterParts.push(`search=${encodeURIComponent(parsed.search)}`);
        fallbackFilterParts.push("when=upcoming");
        const fallbackFilterUrl = `/events?${fallbackFilterParts.join("&")}`;

        return NextResponse.json({
          reply: suggestionParsed.reply,
          events: fallbackMini,
          totalCount: fallbackEvents.length,
          filterUrl: fallbackFilterUrl,
        });
      } catch {
        // If suggestion call fails, fall through to generic empty response
      }
    }

    // No fallback events found either, or suggestion call failed
    const searchTerm = parsed.search ?? message.trim();
    return NextResponse.json({
      reply: `Sorry, but there are no results for "${searchTerm}". Try a different search or browse all events!`,
      events: [],
      totalCount: 0,
      filterUrl,
    });
  }

  return NextResponse.json({
    reply: parsed.reply,
    events: miniEvents,
    totalCount: count,
    filterUrl,
  });
}
