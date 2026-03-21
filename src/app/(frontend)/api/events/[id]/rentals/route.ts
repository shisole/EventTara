import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const supabase = await createClient();

  // Get event with club info and dates
  const { data: event } = await supabase
    .from("events")
    .select("id, club_id, date, end_date, clubs(id, name, slug, location, logo_url)")
    .eq("id", eventId)
    .single();

  if (!event?.club_id) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const club = event.clubs as unknown as {
    id: string;
    name: string;
    slug: string;
    location: string | null;
    logo_url: string | null;
  };

  // Get own club's active rental items
  const { data: ownItems } = await supabase
    .from("club_rental_items")
    .select("*")
    .eq("club_id", event.club_id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  // Get booked quantities for this event's date range (active bookings only)
  const bookedQuantities = await getBookedQuantities(
    supabase,
    eventId,
    (ownItems || []).map((i) => i.id),
  );

  const ownRentals = (ownItems || []).map((item) => ({
    ...item,
    available_quantity: item.quantity_total - (bookedQuantities[item.id] || 0),
  }));

  // Get nearby clubs' rental items (match by location)
  const nearbyClubs: {
    club: { id: string; name: string; slug: string; logo_url: string | null };
    items: (typeof ownRentals)[number][];
  }[] = [];

  if (club.location) {
    const { data: nearbyClubsData } = await supabase
      .from("clubs")
      .select("id, name, slug, logo_url")
      .eq("location", club.location)
      .neq("id", event.club_id);

    if (nearbyClubsData && nearbyClubsData.length > 0) {
      for (const nearbyClub of nearbyClubsData) {
        const { data: nearbyItems } = await supabase
          .from("club_rental_items")
          .select("*")
          .eq("club_id", nearbyClub.id)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (nearbyItems && nearbyItems.length > 0) {
          const nearbyBooked = await getBookedQuantities(
            supabase,
            eventId,
            nearbyItems.map((i) => i.id),
          );

          nearbyClubs.push({
            club: nearbyClub,
            items: nearbyItems.map((item) => ({
              ...item,
              available_quantity: item.quantity_total - (nearbyBooked[item.id] || 0),
            })),
          });
        }
      }
    }
  }

  return NextResponse.json({
    own_club: {
      club: { id: club.id, name: club.name, slug: club.slug, logo_url: club.logo_url },
      items: ownRentals,
    },
    nearby_clubs: nearbyClubs,
  });
}

async function getBookedQuantities(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  itemIds: string[],
): Promise<Record<string, number>> {
  if (itemIds.length === 0) return {};

  // Count booked quantities for active bookings on this event
  const { data: bookedRows } = await supabase
    .from("booking_rentals")
    .select("rental_item_id, quantity, bookings!inner(event_id, status)")
    .in("rental_item_id", itemIds)
    .eq("bookings.event_id", eventId)
    .in("bookings.status", ["pending", "confirmed", "reserved"]);

  const quantities: Record<string, number> = {};
  if (bookedRows) {
    for (const row of bookedRows) {
      quantities[row.rental_item_id] = (quantities[row.rental_item_id] || 0) + row.quantity;
    }
  }
  return quantities;
}
