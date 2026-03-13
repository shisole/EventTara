import { type Metadata } from "next";
import { redirect } from "next/navigation";

import FeedList from "@/components/feed/FeedList";
import NextEventCard from "@/components/home/NextEventCard";
import OrganizerAlertStrip from "@/components/home/OrganizerAlertStrip";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Home",
  description: "Your upcoming events, organizer alerts, and activity feed.",
};

interface UpcomingBookingRow {
  id: string;
  status: string;
  payment_status: string;
  event_id: string;
}

interface NextEventRow {
  id: string;
  title: string;
  date: string;
  location: string;
  cover_image_url: string | null;
  type: string;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel fetches: upcoming booking + club memberships
  const [bookingResult, membershipsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, status, payment_status, event_id")
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed"])
      .order("booked_at", { ascending: false })
      .limit(10),
    supabase
      .from("club_members")
      .select("club_id, role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin", "moderator"]),
  ]);

  const bookings = (bookingResult.data ?? []) as UpcomingBookingRow[];

  // Fetch the next upcoming event from user's bookings
  let nextEvent:
    | (NextEventRow & { booking: { id: string; status: string; payment_status: string } })
    | null = null;

  if (bookings.length > 0) {
    const eventIds = [...new Set(bookings.map((b) => b.event_id))];
    const { data: events } = await supabase
      .from("events")
      .select("id, title, date, location, cover_image_url, type")
      .in("id", eventIds)
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(1);

    const event = (events as NextEventRow[] | null)?.[0];
    if (event) {
      const booking = bookings.find((b) => b.event_id === event.id);
      if (booking) {
        nextEvent = {
          ...event,
          booking: {
            id: booking.id,
            status: booking.status,
            payment_status: booking.payment_status,
          },
        };
      }
    }
  }

  const managedClubIds = (membershipsResult.data ?? []).map((m) => m.club_id);

  // Fetch pending booking count if user manages clubs
  let pendingCount = 0;
  if (managedClubIds.length > 0) {
    const { data: managedEvents } = await supabase
      .from("events")
      .select("id")
      .in("club_id", managedClubIds);

    const managedEventIds = (managedEvents ?? []).map((e) => e.id);
    if (managedEventIds.length > 0) {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .in("event_id", managedEventIds);
      pendingCount = count ?? 0;
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-4">
      {nextEvent && <NextEventCard event={nextEvent} />}
      {pendingCount > 0 && (
        <OrganizerAlertStrip pendingCount={pendingCount} clubCount={managedClubIds.length} />
      )}
      <FeedList
        initialItems={[]}
        initialHasMore={true}
        isAuthenticated={true}
        currentUserId={user.id}
      />
    </main>
  );
}
