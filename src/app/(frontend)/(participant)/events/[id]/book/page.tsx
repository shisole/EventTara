import { notFound, redirect } from "next/navigation";

import BookingPageClient from "@/components/booking/BookingPageClient";
import { createClient } from "@/lib/supabase/server";

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

  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, end_date, price, max_participants, organizer_id")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    // Get all active bookings for this event that have an event_distance_id
    const { data: distanceBookings } = await supabase
      .from("bookings")
      .select("event_distance_id, id")
      .eq("event_id", id)
      .in("status", ["pending", "confirmed"])
      .not("event_distance_id", "is", null);

    // Get companion counts for each booking
    const bookingIds = (distanceBookings ?? []).map((b) => b.id);
    const companionCounts: Record<string, number> = {};

    if (bookingIds.length > 0) {
      const { data: companions } = await supabase
        .from("booking_companions")
        .select("booking_id")
        .in("booking_id", bookingIds)
        .in("status", ["pending", "confirmed"]);

      if (companions) {
        for (const c of companions) {
          companionCounts[c.booking_id] = (companionCounts[c.booking_id] || 0) + 1;
        }
      }
    }

    // Count total participants per distance (1 per booking + companions)
    const participantsByDistance: Record<string, number> = {};
    for (const booking of distanceBookings ?? []) {
      if (booking.event_distance_id) {
        const companionCount = companionCounts[booking.id] || 0;
        participantsByDistance[booking.event_distance_id] =
          (participantsByDistance[booking.event_distance_id] || 0) + 1 + companionCount;
      }
    }

    distancesWithSpots = distances.map((d) => ({
      id: d.id,
      distance_km: d.distance_km,
      label: d.label,
      price: d.price,
      max_participants: d.max_participants,
      spots_left: d.max_participants - (participantsByDistance[d.id] || 0),
    }));
  }

  // Get spots left via RPC (used when no distances)
  const { data: totalParticipants } = await supabase.rpc("get_total_participants", {
    p_event_id: id,
  });
  const spotsLeft = event.max_participants - (totalParticipants || 0);

  // Fetch organizer payment info — check if any distance has a non-zero price too
  const hasNonZeroPrice = event.price > 0 || (distancesWithSpots ?? []).some((d) => d.price > 0);

  let organizerPaymentInfo = null;
  if (hasNonZeroPrice) {
    const { data: organizer } = await supabase
      .from("organizer_profiles")
      .select("payment_info")
      .eq("id", event.organizer_id)
      .single();

    organizerPaymentInfo = organizer?.payment_info as {
      gcash_number?: string;
      maya_number?: string;
    } | null;
  }

  const mode = isFriendMode && existingBooking ? "friend" : "self";

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
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
          organizerPaymentInfo={organizerPaymentInfo}
          spotsLeft={spotsLeft}
          distances={distancesWithSpots}
          mode={mode}
        />
      </div>
    </div>
  );
}
