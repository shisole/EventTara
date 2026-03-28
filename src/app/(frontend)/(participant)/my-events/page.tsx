import { redirect } from "next/navigation";

import PastEvents from "@/components/participant/PastEvents";
import UpcomingBookings from "@/components/participant/UpcomingBookings";
import { Breadcrumbs } from "@/components/ui";
import { splitBookingsByDate } from "@/lib/data/bookings";
import { fetchCompanionsByBooking } from "@/lib/data/companions";
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
      "id, qr_code, payment_status, payment_method, payment_proof_url, expires_at, events(id, title, type, date, end_date, location, price)",
    )
    .eq("user_id", user.id)
    .in("status", ["confirmed", "pending"])
    .order("booked_at", { ascending: false });

  const { upcoming: upcomingBookings, past: pastBookings } = splitBookingsByDate(
    (bookingData || []) as any[],
  );

  // Fetch companions for upcoming bookings
  const upcomingBookingIds = upcomingBookings.map((b: any) => b.id);
  const companionsByBooking = await fetchCompanionsByBooking<{
    booking_id: string;
    full_name: string;
    qr_code: string | null;
  }>(supabase, upcomingBookingIds, "booking_id, full_name, qr_code");

  // Fetch check-in status for upcoming events
  const upcomingEventIds = upcomingBookings.map((b: any) => b.events.id);
  let upcomingCheckins: any[] = [];
  if (upcomingEventIds.length > 0) {
    const { data: uc } = await supabase
      .from("event_checkins")
      .select("event_id")
      .eq("user_id", user.id)
      .in("event_id", upcomingEventIds);
    upcomingCheckins = uc || [];
  }
  const upcomingCheckinSet = new Set(upcomingCheckins.map((c: any) => c.event_id));

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
    checkedIn: upcomingCheckinSet.has(b.events.id),
    userId: user.id,
    expiresAt: b.expires_at || null,
  }));

  const pastEventIds = pastBookings.map((b: any) => b.events.id);
  const pastBookingIds = pastBookings.map((b: any) => b.id);

  let checkins: any[] = [];
  let pastBadges: any[] = [];
  let stravaActivities: any[] = [];

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

  // Fetch Strava activities linked to user's past bookings
  if (pastBookingIds.length > 0) {
    const { data: sa } = await supabase
      .from("strava_activities")
      .select(
        "id, booking_id, name, distance, moving_time, total_elevation_gain, matched_automatically",
      )
      .eq("user_id", user.id)
      .in("booking_id", pastBookingIds);
    stravaActivities = sa || [];
  }

  // Check if user has Strava connected
  const { data: stravaConnection } = await supabase
    .from("strava_connections")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const hasStravaConnected = !!stravaConnection;

  const checkinSet = new Set(checkins.map((c: any) => c.event_id));
  const badgeMap = new Map(
    pastBadges.map((ub: any) => [
      ub.badges?.event_id,
      { title: ub.badges?.title, imageUrl: ub.badges?.image_url },
    ]),
  );

  // Build a map of booking_id -> linked strava activity
  const stravaByBooking = new Map(
    stravaActivities.map((sa: any) => [
      sa.booking_id,
      {
        id: sa.id as string,
        name: sa.name as string,
        distance: sa.distance as number,
        movingTime: sa.moving_time as number,
        totalElevationGain: sa.total_elevation_gain as number,
        matchedAutomatically: sa.matched_automatically as boolean,
      },
    ]),
  );

  const past = pastBookings.map((b: any) => ({
    bookingId: b.id as string,
    eventId: b.events.id,
    eventTitle: b.events.title,
    eventType: b.events.type,
    eventDate: b.events.date,
    eventEndDate: b.events.end_date,
    eventPrice: b.events.price,
    badgeTitle: badgeMap.get(b.events.id)?.title || null,
    badgeImageUrl: badgeMap.get(b.events.id)?.imageUrl || null,
    checkedIn: checkinSet.has(b.events.id),
    linkedActivity: stravaByBooking.get(b.id) || null,
    hasStravaConnected,
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <Breadcrumbs />
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
