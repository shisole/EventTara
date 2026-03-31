import { type Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import UpcomingEventsSection, {
  type UpcomingEventItem,
} from "@/components/home/UpcomingEventsSection";
import { Skeleton, SkeletonText } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

import HomeAchievements from "./_components/HomeAchievements";
import HomeClubUpdates from "./_components/HomeClubUpdates";
import HomeOrganizerStrip from "./_components/HomeOrganizerStrip";

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

/** Skeleton for the organizer alert strip */
function OrganizerStripSkeleton() {
  return <Skeleton className="h-11 w-full rounded-xl" />;
}

/** Skeleton for achievements section */
function AchievementsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-48 rounded" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <SkeletonText className="w-2/3" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for club updates section */
function ClubUpdatesSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-36 rounded" />
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <SkeletonText className="w-1/2" />
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <SkeletonText className="w-20" />
            <SkeletonText className="w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/events");
  }

  // ── Above-fold data: bookings + memberships (parallel) ──
  const [bookingResult, membershipsResult] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, status, payment_status, payment_method, event_id")
      .eq("user_id", user.id)
      .in("status", ["pending", "confirmed"])
      .order("booked_at", { ascending: false })
      .limit(20),
    supabase.from("club_members").select("club_id, role").eq("user_id", user.id),
  ]);

  const bookings = (bookingResult.data ?? []) as BookingRow[];
  const memberships = membershipsResult.data ?? [];

  const managedClubIds = memberships
    .filter((m) => ["owner", "admin", "moderator"].includes(m.role))
    .map((m) => m.club_id);
  const memberClubIds = memberships.map((m) => m.club_id);

  // ── Upcoming events (above-fold, critical path) ──
  const bookingEventIds = [...new Set(bookings.map((b) => b.event_id))];
  const now = new Date().toISOString();

  const [eventsResult, checkinResult] = await Promise.all([
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
    bookingEventIds.length > 0
      ? supabase
          .from("event_checkins")
          .select("event_id")
          .eq("user_id", user.id)
          .in("event_id", bookingEventIds)
          .then((r) => new Set((r.data ?? []).map((c) => c.event_id)))
      : Promise.resolve(new Set<string>()),
  ]);

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

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Organizer alert — streamed (requires 2 sequential queries) */}
      {managedClubIds.length > 0 && (
        <Suspense fallback={<OrganizerStripSkeleton />}>
          <HomeOrganizerStrip managedClubIds={managedClubIds} />
        </Suspense>
      )}

      {/* Upcoming events — immediate (above-fold, critical) */}
      <UpcomingEventsSection events={upcomingEvents} />

      {/* Achievements — streamed (heaviest: badge progress calculations) */}
      <Suspense fallback={<AchievementsSkeleton />}>
        <HomeAchievements userId={user.id} />
      </Suspense>

      {/* Club updates — streamed (club events + club info queries) */}
      {memberClubIds.length > 0 && (
        <Suspense fallback={<ClubUpdatesSkeleton />}>
          <HomeClubUpdates memberClubIds={memberClubIds} />
        </Suspense>
      )}
    </main>
  );
}
