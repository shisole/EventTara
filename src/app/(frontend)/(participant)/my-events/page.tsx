import { redirect } from "next/navigation";

import PastEvents from "@/components/participant/PastEvents";
import UpcomingBookings from "@/components/participant/UpcomingBookings";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My Events — EventTara" };

export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all bookings
  const { data: bookingData } = await supabase
    .from("bookings")
    .select(
      "id, qr_code, payment_status, payment_method, payment_proof_url, events(id, title, type, date, end_date, location, price)",
    )
    .eq("user_id", user.id)
    .in("status", ["confirmed", "pending"])
    .order("booked_at", { ascending: false });

  const now = new Date();

  // Upcoming bookings
  const upcomingBookings = (bookingData || []).filter(
    (b: any) => b.events && new Date(b.events.date) >= now,
  );

  // Fetch companions for upcoming bookings
  const upcomingBookingIds = upcomingBookings.map((b: any) => b.id);
  const companionsByBooking: Record<string, any[]> = {};
  if (upcomingBookingIds.length > 0) {
    const { data: companions } = await supabase
      .from("booking_companions")
      .select("booking_id, full_name, qr_code")
      .in("booking_id", upcomingBookingIds);

    if (companions) {
      for (const c of companions) {
        if (!companionsByBooking[c.booking_id]) companionsByBooking[c.booking_id] = [];
        companionsByBooking[c.booking_id].push({ full_name: c.full_name, qr_code: c.qr_code });
      }
    }
  }

  const upcoming = upcomingBookings.map((b: any) => ({
    id: b.id,
    qrCode: b.qr_code || "",
    eventTitle: b.events.title,
    eventType: b.events.type,
    eventDate: b.events.date,
    eventEndDate: b.events.end_date,
    eventLocation: b.events.location,
    eventId: b.events.id,
    eventPrice: b.events.price,
    paymentStatus: b.payment_status,
    paymentMethod: b.payment_method,
    paymentProofUrl: b.payment_proof_url,
    companions: companionsByBooking[b.id] || [],
  }));

  // Past bookings
  const pastBookings = (bookingData || []).filter(
    (b: any) => b.events && new Date(b.events.date) < now,
  );

  const pastEventIds = pastBookings.map((b: any) => b.events.id);

  let checkins: any[] = [];
  let pastBadges: any[] = [];

  if (pastEventIds.length > 0) {
    const { data: c } = await supabase
      .from("event_checkins")
      .select("event_id")
      .eq("user_id", user.id)
      .in("event_id", pastEventIds);
    checkins = c || [];

    const { data: ub } = await supabase
      .from("user_badges")
      .select("badges(event_id, title, image_url)")
      .eq("user_id", user.id);
    pastBadges = ub || [];
  }

  const checkinSet = new Set(checkins.map((c: any) => c.event_id));
  const badgeMap = new Map(
    pastBadges.map((ub: any) => [
      ub.badges?.event_id,
      { title: ub.badges?.title, imageUrl: ub.badges?.image_url },
    ]),
  );

  const past = pastBookings.map((b: any) => ({
    eventId: b.events.id,
    eventTitle: b.events.title,
    eventType: b.events.type,
    eventDate: b.events.date,
    eventEndDate: b.events.end_date,
    eventPrice: b.events.price,
    badgeTitle: badgeMap.get(b.events.id)?.title || null,
    badgeImageUrl: badgeMap.get(b.events.id)?.imageUrl || null,
    checkedIn: checkinSet.has(b.events.id),
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <h1 className="text-2xl font-heading font-bold">My Events</h1>

      <section>
        <h2 className="text-xl font-heading font-bold mb-4">Upcoming Events</h2>
        <UpcomingBookings bookings={upcoming} />
      </section>

      <section>
        <h2 className="text-xl font-heading font-bold mb-4">Past Adventures</h2>
        <PastEvents events={past} />
      </section>
    </div>
  );
}
