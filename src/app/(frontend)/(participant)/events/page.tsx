import type { SupabaseClient } from "@supabase/supabase-js";

import EventsPageClient from "@/components/events/EventsPageClient";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type EventType = Database["public"]["Tables"]["events"]["Row"]["type"];

const BATCH_SIZE = 9;

export const metadata = {
  title: "Explore Events \u2014 EventTara",
  description: "Find your next adventure. Browse hiking, biking, running, and trail events.",
};

function getEventStatus(eventDate: string, today: string): "upcoming" | "happening_now" | "past" {
  const dateOnly = eventDate.split("T")[0];
  if (dateOnly === today) return "happening_now";
  return dateOnly > today ? "upcoming" : "past";
}

/** Fetch organizer options: organizers that have at least one published event */
async function fetchOrganizerOptions(
  supabase: SupabaseClient<Database>,
): Promise<{ id: string; name: string }[]> {
  const { data } = await supabase
    .from("organizer_profiles")
    .select("id, org_name, events!inner(id)")
    .eq("events.status", "published");

  if (!data) return [];

  // Inner join can return duplicate rows — dedupe by organizer id
  const seen = new Set<string>();
  const result: { id: string; name: string }[] = [];
  for (const row of data) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      result.push({ id: row.id, name: row.org_name });
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
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Count query for total
  let countQuery = supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .in("status", ["published", "completed"]);

  // Data query for first batch
  let dataQuery = supabase
    .from("events")
    .select("*, bookings(count), organizer_profiles!inner(org_name)")
    .in("status", ["published", "completed"])
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

    // Also match organizer names
    const { data: matchingOrgs } = await supabase
      .from("organizer_profiles")
      .select("id")
      .ilike("org_name", `%${pattern}%`);
    const orgIds = matchingOrgs?.map((o) => o.id) ?? [];

    let filter = `title.ilike.%${pattern}%,location.ilike.%${pattern}%`;
    if (orgIds.length > 0) {
      filter += `,organizer_id.in.(${orgIds.join(",")})`;
    }
    countQuery = countQuery.or(filter);
    dataQuery = dataQuery.or(filter);
  }

  if (params.org) {
    const orgs = params.org.split(",").filter(Boolean);
    if (orgs.length === 1) {
      countQuery = countQuery.eq("organizer_id", orgs[0]);
      dataQuery = dataQuery.eq("organizer_id", orgs[0]);
    } else if (orgs.length > 1) {
      countQuery = countQuery.in("organizer_id", orgs);
      dataQuery = dataQuery.in("organizer_id", orgs);
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
      const organizers = await fetchOrganizerOptions(supabase);
      const guides = await fetchGuideOptions(supabase);
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EventsPageClient
            initialEvents={[]}
            totalCount={0}
            organizers={organizers}
            guides={guides}
          />
        </div>
      );
    }

    countQuery = countQuery.in("id", eventIds);
    dataQuery = dataQuery.in("id", eventIds);
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

  // Fetch review stats for completed events
  const completedIds = events.filter((e) => e.status === "completed").map((e) => e.id);
  const reviewStats: Record<string, { avg: number; count: number }> = {};

  if (completedIds.length > 0) {
    const { data: allRatings } = await supabase
      .from("event_reviews")
      .select("rating, event_id")
      .in("event_id", completedIds);

    if (allRatings) {
      const perEvent: Record<string, { sum: number; count: number }> = {};
      for (const r of allRatings) {
        if (!perEvent[r.event_id]) perEvent[r.event_id] = { sum: 0, count: 0 };
        perEvent[r.event_id].sum += r.rating;
        perEvent[r.event_id].count++;
      }
      for (const [eid, stats] of Object.entries(perEvent)) {
        reviewStats[eid] = { avg: stats.sum / stats.count, count: stats.count };
      }
    }
  }

  const gridEvents = events.map((event: any) => {
    const stats = reviewStats[event.id];
    return {
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      location: event.location,
      price: Number(event.price),
      cover_image_url: event.cover_image_url,
      max_participants: event.max_participants,
      booking_count: event.bookings?.[0]?.count || 0,
      status: getEventStatus(event.date, today),
      organizer_name: event.organizer_profiles?.org_name,
      organizer_id: event.organizer_id,
      coordinates: event.coordinates as { lat: number; lng: number } | null,
      avg_rating: stats?.avg,
      review_count: stats?.count,
    };
  });

  const totalCount = count ?? 0;

  // Fetch filter dropdown options in parallel
  const [organizers, guides] = await Promise.all([
    fetchOrganizerOptions(supabase),
    fetchGuideOptions(supabase),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EventsPageClient
        initialEvents={gridEvents}
        totalCount={totalCount}
        organizers={organizers}
        guides={guides}
      />
    </div>
  );
}
