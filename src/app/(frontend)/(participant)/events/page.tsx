import type { SupabaseClient } from "@supabase/supabase-js";

import EventsPageClient from "@/components/events/EventsPageClient";
import { Breadcrumbs } from "@/components/ui";
import { isEventsTwoColMobileEnabled } from "@/lib/cms/cached";
import { fetchEventEnrichments, mapEventToCard } from "@/lib/events/map-event-card";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type EventType = Database["public"]["Tables"]["events"]["Row"]["type"];

const BATCH_SIZE = 9;

export const metadata = {
  title: "Explore Events \u2014 EventTara",
  description: "Find your next adventure. Browse hiking, biking, running, and trail events.",
};

/** Fetch club options: clubs that have at least one published event */
async function fetchClubOptions(
  supabase: SupabaseClient<Database>,
): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase
    .from("clubs")
    .select("id, name, events!inner(id)")
    .eq("visibility", "public")
    .eq("events.status", "published");

  if (!data) return [];

  // Inner join can return duplicate rows — dedupe by club id
  const seen = new Set<string>();
  const result: { id: string; name: string }[] = [];
  for (const row of data) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      result.push({ id: row.id, name: row.name });
    }
  }
  return result;
}

/** Fetch guide options: guides linked to at least one published hiking event */
async function fetchGuideOptions(
  supabase: SupabaseClient<Database>,
): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase
    .from("event_guides")
    .select("guide_id, guides!inner(full_name), events!inner(status, type)")
    .eq("events.status", "published")
    .eq("events.type", "hiking");

  if (!data) return [];

  // Dedupe by guide_id
  const seen = new Set<string>();
  const result: { id: string; name: string }[] = [];
  for (const row of data) {
    if (!seen.has(row.guide_id)) {
      seen.add(row.guide_id);
      result.push({
        id: row.guide_id,
        name: (row.guides as any).full_name,
      });
    }
  }
  return result;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    search?: string;
    when?: string;
    org?: string;
    guide?: string;
    from?: string;
    to?: string;
    distance?: string;
    difficulty?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Count query for total (inner join clubs to exclude private club events)
  let countQuery = supabase
    .from("events")
    .select("id, clubs!inner(id)", { count: "exact", head: true })
    .in("status", ["published", "completed"])
    .eq("clubs.visibility", "public");

  // Data query for first batch (inner join clubs to exclude private club events)
  let dataQuery = supabase
    .from("events")
    .select("*, bookings(count), clubs!inner(name, slug, logo_url)")
    .in("status", ["published", "completed"])
    .eq("clubs.visibility", "public")
    .order("date", { ascending: true });

  // Apply filters to both
  switch (params.when) {
    case "upcoming": {
      countQuery = countQuery.gt("date", today);
      dataQuery = dataQuery.gt("date", today);

      break;
    }
    case "now": {
      countQuery = countQuery.gte("date", today).lte("date", `${today}T23:59:59`);
      dataQuery = dataQuery.gte("date", today).lte("date", `${today}T23:59:59`);

      break;
    }
    case "past": {
      countQuery = countQuery.lt("date", today);
      dataQuery = dataQuery.lt("date", today);

      break;
    }
    // No default
  }

  if (params.type) {
    const types = params.type.split(",").filter(Boolean) as EventType[];
    if (types.length === 1) {
      countQuery = countQuery.eq("type", types[0]);
      dataQuery = dataQuery.eq("type", types[0]);
    } else if (types.length > 1) {
      countQuery = countQuery.in("type", types);
      dataQuery = dataQuery.in("type", types);
    }
  }

  if (params.search) {
    const pattern = params.search.trim().replaceAll(/\s+/g, "%");

    // Also match club names
    const { data: matchingClubs } = await supabase
      .from("clubs")
      .select("id")
      .ilike("name", `%${pattern}%`);
    const clubIds = matchingClubs?.map((c) => c.id) ?? [];

    let filter = `title.ilike.%${pattern}%,location.ilike.%${pattern}%`;
    if (clubIds.length > 0) {
      filter += `,club_id.in.(${clubIds.join(",")})`;
    }
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  if (params.org) {
    const clubs = params.org.split(",").filter(Boolean);
    if (clubs.length === 1) {
      countQuery = countQuery.eq("club_id", clubs[0]);
      dataQuery = dataQuery.eq("club_id", clubs[0]);
    } else if (clubs.length > 1) {
      countQuery = countQuery.in("club_id", clubs);
      dataQuery = dataQuery.in("club_id", clubs);
    }
  }

  if (params.from) {
    countQuery = countQuery.gte("date", params.from);
    dataQuery = dataQuery.gte("date", params.from);
  }

  if (params.to) {
    countQuery = countQuery.lte("date", `${params.to}T23:59:59`);
    dataQuery = dataQuery.lte("date", `${params.to}T23:59:59`);
  }

  // Guide filter: fetch linked event IDs first, then constrain both queries
  if (params.guide) {
    const guideIds = params.guide.split(",").filter(Boolean);
    const linksQuery =
      guideIds.length === 1
        ? supabase.from("event_guides").select("event_id").eq("guide_id", guideIds[0])
        : supabase.from("event_guides").select("event_id").in("guide_id", guideIds);
    const { data: links } = await linksQuery;

    const eventIds = links?.map((l) => l.event_id) ?? [];
    if (eventIds.length === 0) {
      // No events linked to this guide — short-circuit with empty results
      const clubs = await fetchClubOptions(supabase);
      const guides = await fetchGuideOptions(supabase);
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />
          <EventsPageClient initialEvents={[]} totalCount={0} clubs={clubs} guides={guides} />
        </div>
      );
    }

    countQuery = countQuery.in("id", eventIds);
    dataQuery = dataQuery.in("id", eventIds);
  }

  // Distance filter: fetch event IDs from event_distances, then constrain both queries
  if (params.distance) {
    const distanceKms = params.distance.split(",").map(Number).filter(Boolean);
    const { data: distLinks } = await supabase
      .from("event_distances")
      .select("event_id")
      .in("distance_km", distanceKms);

    const distEventIds = distLinks?.map((l) => l.event_id) ?? [];
    if (distEventIds.length === 0) {
      const clubs = await fetchClubOptions(supabase);
      const guides = await fetchGuideOptions(supabase);
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />
          <EventsPageClient initialEvents={[]} totalCount={0} clubs={clubs} guides={guides} />
        </div>
      );
    }

    countQuery = countQuery.in("id", distEventIds);
    dataQuery = dataQuery.in("id", distEventIds);
  }

  // Difficulty filter: range-based (e.g. "1-4", "5-7", "8-9")
  if (params.difficulty) {
    const [minStr, maxStr] = params.difficulty.split("-");
    const min = Number.parseInt(minStr, 10);
    const max = Number.parseInt(maxStr, 10);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      countQuery = countQuery
        .not("difficulty_level", "is", null)
        .gte("difficulty_level", min)
        .lte("difficulty_level", max);
      dataQuery = dataQuery
        .not("difficulty_level", "is", null)
        .gte("difficulty_level", min)
        .lte("difficulty_level", max);
    }
  }

  // For "no when filter" we need all events to sort upcoming-first, then slice
  const [{ count }, { data: allEvents }] = await Promise.all([
    countQuery,
    params.when ? dataQuery.range(0, BATCH_SIZE - 1) : dataQuery,
  ]);

  let events = allEvents || [];

  if (!params.when && events.length > 0) {
    const upcoming = events.filter((e) => e.date.split("T")[0] >= today);
    const past = events.filter((e) => e.date.split("T")[0] < today).reverse();
    events = [...upcoming, ...past].slice(0, BATCH_SIZE);
  }

  const enrichments = await fetchEventEnrichments(supabase, events);
  const gridEvents = events.map((event: any) => mapEventToCard(event, today, enrichments));

  const totalCount = count ?? 0;

  // Fetch matching users when searching
  let matchingUsers: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  }[] = [];
  if (params.search) {
    const userPattern = params.search.trim().replaceAll(/\s+/g, "%");
    const { data: users } = await supabase
      .from("users")
      .select("id, username, full_name, avatar_url")
      .eq("is_guest", false)
      .or(`username.ilike.%${userPattern}%,full_name.ilike.%${userPattern}%`)
      .limit(5);
    matchingUsers = (users ?? []).filter((u): u is typeof u & { username: string } => !!u.username);
  }

  // Fetch filter dropdown options + feature flags in parallel
  const [clubs, guides, twoColMobile] = await Promise.all([
    fetchClubOptions(supabase),
    fetchGuideOptions(supabase),
    isEventsTwoColMobileEnabled(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs />
      <EventsPageClient
        initialEvents={gridEvents}
        totalCount={totalCount}
        clubs={clubs}
        guides={guides}
        initialUsers={matchingUsers}
        twoColMobile={twoColMobile}
      />
    </div>
  );
}
