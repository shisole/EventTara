import { type Metadata } from "next";
import { redirect } from "next/navigation";

import AchievementsProgressSection, {
  type BadgeWithProgress,
} from "@/components/home/AchievementsProgressSection";
import ClubUpdatesSection, { type ClubUpdateEvent } from "@/components/home/ClubUpdatesSection";
import OrganizerAlertStrip from "@/components/home/OrganizerAlertStrip";
import UpcomingEventsSection, {
  type UpcomingEventItem,
} from "@/components/home/UpcomingEventsSection";
import { calculateBadgeProgress } from "@/lib/badges/calculate-progress";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Home",
  description: "Your upcoming events, achievements, and club updates.",
};

interface BookingRow {
  id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  event_id: string;
}

interface EventRow {
  id: string;
  title: string;
  date: string;
  location: string;
  cover_image_url: string | null;
  type: string;
  price: number;
}

interface ClubEventRow {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  club_id: string;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Round 1: parallel base queries ──
  const [bookingResult, membershipsResult, badgesResult, userBadgesResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, status, payment_status, payment_method, event_id")
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed"])
      .order("booked_at", { ascending: false })
      .limit(20),
    supabase.from("club_members").select("club_id, role").eq("user_id", user.id),
    supabase.from("badges").select("*").eq("type", "system"),
    supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
  ]);

  const bookings = (bookingResult.data ?? []) as BookingRow[];
  const memberships = membershipsResult.data ?? [];
  const badges = badgesResult.data ?? [];
  const earnedBadgeIds = new Set((userBadgesResult.data ?? []).map((ub) => ub.badge_id));

  // Derive club ID sets
  const managedClubIds = memberships
    .filter((m) => ["owner", "admin", "moderator"].includes(m.role))
    .map((m) => m.club_id);
  const memberClubIds = memberships.map((m) => m.club_id);

  // ── Round 2: parallel dependent queries ──
  const bookingEventIds = [...new Set(bookings.map((b) => b.event_id))];
  const now = new Date().toISOString();

  const [eventsResult, pendingCount, clubEventsResult, clubsResult, checkinResult] =
    await Promise.all([
      // Upcoming events from user's bookings
      bookingEventIds.length > 0
        ? supabase
            .from("events")
            .select("id, title, date, location, cover_image_url, type, price")
            .in("id", bookingEventIds)
            .gte("date", now)
            .order("date", { ascending: true })
            .limit(3)
            .then((r) => (r.data ?? []) as EventRow[])
        : Promise.resolve([] as EventRow[]),
      // Pending booking count for organizer strip
      (async () => {
        if (managedClubIds.length === 0) return 0;
        const { data: managedEvents } = await supabase
          .from("events")
          .select("id")
          .in("club_id", managedClubIds);
        const managedEventIds = (managedEvents ?? []).map((e) => e.id);
        if (managedEventIds.length === 0) return 0;
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("event_id", managedEventIds);
        return count ?? 0;
      })(),
      // Upcoming club events
      memberClubIds.length > 0
        ? supabase
            .from("events")
            .select("id, title, date, location, type, club_id")
            .in("club_id", memberClubIds)
            .eq("status", "published")
            .gte("date", now)
            .order("date", { ascending: true })
            .limit(4)
            .then((r) => (r.data ?? []) as ClubEventRow[])
        : Promise.resolve([] as ClubEventRow[]),
      // Club info for display
      memberClubIds.length > 0
        ? supabase
            .from("clubs")
            .select("id, name, slug, logo_url")
            .in("id", memberClubIds)
            .then(
              (r) =>
                (r.data ?? []) as {
                  id: string;
                  name: string;
                  slug: string;
                  logo_url: string | null;
                }[],
            )
        : Promise.resolve(
            [] as { id: string; name: string; slug: string; logo_url: string | null }[],
          ),
      // Check-in status for upcoming events
      bookingEventIds.length > 0
        ? supabase
            .from("event_checkins")
            .select("event_id")
            .eq("user_id", user.id)
            .in("event_id", bookingEventIds)
            .then((r) => new Set((r.data ?? []).map((c) => c.event_id)))
        : Promise.resolve(new Set<string>()),
    ]);

  // Build upcoming events with booking info
  const upcomingEvents: UpcomingEventItem[] = eventsResult.map((event) => {
    const booking = bookings.find((b) => b.event_id === event.id)!;
    return {
      ...event,
      checkedIn: checkinResult.has(event.id),
      userId: user.id,
      booking: {
        id: booking.id,
        status: booking.status,
        payment_status: booking.payment_status,
        payment_method: booking.payment_method,
      },
    };
  });

  // Build club map
  const clubMap = new Map(
    clubsResult.map((c) => [c.id, { name: c.name, slug: c.slug, logo_url: c.logo_url }]),
  );

  const clubUpdateEvents: ClubUpdateEvent[] = clubEventsResult;

  // ── Round 3: badge progress ──
  const unearnedBadges = badges.filter((b) => !earnedBadgeIds.has(b.id));
  const progressResults = await Promise.all(
    unearnedBadges.map((b) =>
      calculateBadgeProgress(user.id, b as Parameters<typeof calculateBadgeProgress>[1], supabase),
    ),
  );

  const inProgressBadges = unearnedBadges
    .map((b, i) => ({
      id: b.id,
      title: b.title,
      image_url: b.image_url,
      rarity: (b.rarity ?? "common") as string,
      progress: progressResults[i],
    }))
    .filter((b): b is BadgeWithProgress => b.progress !== null && b.progress.percent > 0)
    .sort((a, b) => b.progress.percent - a.progress.percent)
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      {pendingCount > 0 && (
        <OrganizerAlertStrip pendingCount={pendingCount} clubCount={managedClubIds.length} />
      )}
      <UpcomingEventsSection events={upcomingEvents} />
      {inProgressBadges.length > 0 && <AchievementsProgressSection badges={inProgressBadges} />}
      {memberClubIds.length > 0 && (
        <ClubUpdatesSection events={clubUpdateEvents} clubMap={clubMap} />
      )}
    </main>
  );
}
