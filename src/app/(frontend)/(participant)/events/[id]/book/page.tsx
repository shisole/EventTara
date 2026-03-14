import { type Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import BookingPageClient from "@/components/booking/BookingPageClient";
import { Breadcrumbs } from "@/components/ui";
import { BreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("title").eq("id", id).single();

  return {
    title: event ? `Book ${event.title}` : "Book Event",
    description: event
      ? `Reserve your spot for ${event.title} on EventTara.`
      : "Reserve your spot for this outdoor adventure event.",
  };
}

export default async function BookEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ for?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const isFriendMode = search.for === "friend";
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id, title, date, end_date, price, max_participants, club_id, waiver_text, members_only, payment_paused, contact_url",
    )
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (eventError) {
    console.error("Book page event query error:", eventError.message, eventError.code);
  }

  if (!event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Members-only gate: redirect non-members back to event page
  if (event.members_only) {
    let isMember = false;
    if (user && event.club_id) {
      const { data: membership } = await supabase
        .from("club_members")
        .select("id")
        .eq("club_id", event.club_id)
        .eq("user_id", user.id)
        .maybeSingle();
      isMember = !!membership;
    }
    if (!isMember) {
      redirect(`/events/${id}`);
    }
  }

  // Check if user already booked
  let existingBooking: { id: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed"])
      .single();
    existingBooking = data;
  }

  // If user already booked and not in friend mode, redirect
  if (existingBooking && !isFriendMode) {
    redirect("/my-events");
  }

  // Fetch event distances (if any)
  const { data: distances } = await supabase
    .from("event_distances")
    .select("id, distance_km, label, price, max_participants")
    .eq("event_id", id)
    .order("distance_km", { ascending: true });

  // Compute per-distance spots remaining
  interface DistanceWithSpots {
    id: string;
    distance_km: number;
    label: string | null;
    price: number;
    max_participants: number;
    spots_left: number;
  }

  let distancesWithSpots: DistanceWithSpots[] | undefined;

  if (distances && distances.length > 0) {
    const distanceIds = distances.map((d) => d.id);

    // Count bookings per distance
    const { data: distanceBookings } = await supabase
      .from("bookings")
      .select("event_distance_id")
      .eq("event_id", id)
      .in("status", ["pending", "confirmed"])
      .in("event_distance_id", distanceIds);

    const bookingsByDistance: Record<string, number> = {};
    for (const b of distanceBookings ?? []) {
      if (b.event_distance_id) {
        bookingsByDistance[b.event_distance_id] =
          (bookingsByDistance[b.event_distance_id] || 0) + 1;
      }
    }

    // Count companions per distance (by their own event_distance_id)
    const { data: distanceCompanions } = await supabase
      .from("booking_companions")
      .select("event_distance_id")
      .in("event_distance_id", distanceIds)
      .in("status", ["pending", "confirmed"]);

    const companionsByDistance: Record<string, number> = {};
    for (const c of distanceCompanions ?? []) {
      if (c.event_distance_id) {
        companionsByDistance[c.event_distance_id] =
          (companionsByDistance[c.event_distance_id] || 0) + 1;
      }
    }

    distancesWithSpots = distances.map((d) => ({
      id: d.id,
      distance_km: d.distance_km,
      label: d.label,
      price: d.price,
      max_participants: d.max_participants,
      spots_left:
        d.max_participants - (bookingsByDistance[d.id] || 0) - (companionsByDistance[d.id] || 0),
    }));
  }

  // Get spots left via RPC (used when no distances)
  const { data: totalParticipants } = await supabase.rpc("get_total_participants", {
    p_event_id: id,
  });
  const spotsLeft = event.max_participants - (totalParticipants || 0);

  // Fetch payment info from club
  const hasNonZeroPrice = event.price > 0 || (distancesWithSpots ?? []).some((d) => d.price > 0);

  let paymentInfo: { gcash_number?: string; maya_number?: string; facebook_url?: string } | null =
    null;
  if ((hasNonZeroPrice || event.payment_paused) && event.club_id) {
    const { data: clubData } = await supabase
      .from("clubs")
      .select("payment_info")
      .eq("id", event.club_id)
      .single();
    paymentInfo = clubData?.payment_info as {
      gcash_number?: string;
      maya_number?: string;
      facebook_url?: string;
    } | null;
  }

  // Resolve contact URL: event-level override > club facebook_url
  const resolvedContactUrl = event.payment_paused
    ? event.contact_url || paymentInfo?.facebook_url || null
    : null;

  const mode = isFriendMode && existingBooking ? "friend" : "self";

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Breadcrumbs />
      <BreadcrumbTitle title={event.title} />
      <h1 className="text-2xl font-heading font-bold mb-8 text-center">
        {mode === "friend" ? "Book for a Friend" : "Book Your Spot"}
      </h1>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-8">
        <BookingPageClient
          isAuthenticated={!!user}
          eventId={event.id}
          eventTitle={event.title}
          eventDate={event.date}
          eventEndDate={event.end_date}
          price={event.price}
          paymentInfo={paymentInfo}
          spotsLeft={spotsLeft}
          distances={distancesWithSpots}
          mode={mode}
          waiverText={event.waiver_text}
          paymentPaused={event.payment_paused}
          contactUrl={resolvedContactUrl}
        />
      </div>
    </div>
  );
}
