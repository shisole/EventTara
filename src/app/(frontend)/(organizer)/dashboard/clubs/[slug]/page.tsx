import Link from "next/link";
import { notFound } from "next/navigation";

import { Button, UIBadge } from "@/components/ui";
import { isDuckRaceEnabled } from "@/lib/cms/cached";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/format-date";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("name").eq("slug", slug).single();
  return { title: club ? `${club.name} — Dashboard` : "Club Dashboard" };
}

export default async function ClubOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  // Fetch stats in parallel
  const [{ count: memberCount }, { count: eventCount }, { data: recentEvents }] = await Promise.all(
    [
      supabase
        .from("club_members")
        .select("id", { count: "exact", head: true })
        .eq("club_id", club.id),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("club_id", club.id),
      supabase
        .from("events")
        .select("id, title, date, end_date, status, type")
        .eq("club_id", club.id)
        .order("date", { ascending: false })
        .limit(5),
    ],
  );

  // Count upcoming events
  const now = new Date().toISOString();
  const upcomingCount = (recentEvents ?? []).filter(
    (e) => e.status === "published" && e.date >= now,
  ).length;

  // Fetch total bookings for this club's events
  const { data: clubEvents } = await supabase.from("events").select("id").eq("club_id", club.id);

  let totalBookings = 0;
  if (clubEvents && clubEvents.length > 0) {
    const eventIds = clubEvents.map((e) => e.id);
    const { count: bookingCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("event_id", eventIds);
    totalBookings = bookingCount ?? 0;
  }

  const duckRaceEnabled = await isDuckRaceEnabled();

  const statusStyles: Record<string, string> = {
    draft: "default",
    published: "hiking",
    completed: "running",
    cancelled: "default",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold dark:text-white">{club.name}</h1>
        <Link href={`/dashboard/clubs/${slug}/events/new`}>
          <Button>Create Event</Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
          <p className="text-3xl font-heading font-bold dark:text-white">{memberCount ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
          <p className="text-3xl font-heading font-bold dark:text-white">{eventCount ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming</p>
          <p className="text-3xl font-heading font-bold dark:text-white">{upcomingCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
          <p className="text-3xl font-heading font-bold dark:text-white">{totalBookings}</p>
        </div>
      </div>

      {/* Recent events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-bold dark:text-white">Recent Events</h2>
          <Link
            href={`/dashboard/clubs/${slug}/events`}
            className="text-sm text-lime-600 dark:text-lime-400 hover:underline"
          >
            View all
          </Link>
        </div>

        {recentEvents && recentEvents.length > 0 ? (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/clubs/${slug}/events/${event.id}`}
                className="block bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-950/30 p-4 hover:shadow-md dark:hover:shadow-gray-950/50 transition-shadow"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium dark:text-white truncate">{event.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatEventDate(event.date, event.end_date, { short: true })}
                    </p>
                  </div>
                  <UIBadge variant={statusStyles[event.status]}>{event.status}</UIBadge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
            <h3 className="text-lg font-heading font-bold mb-2 dark:text-white">No events yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first event for this club!
            </p>
            <Link href={`/dashboard/clubs/${slug}/events/new`}>
              <Button>Create Event</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Link
            href={`/dashboard/clubs/${slug}/members`}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-950/30 p-4 hover:shadow-md transition-shadow text-center"
          >
            <p className="font-medium dark:text-white">Manage Members</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">View and manage club members</p>
          </Link>
          <Link
            href={`/dashboard/clubs/${slug}/invites`}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-950/30 p-4 hover:shadow-md transition-shadow text-center"
          >
            <p className="font-medium dark:text-white">Invite Members</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create and share invite links
            </p>
          </Link>
          <Link
            href={`/dashboard/clubs/${slug}/settings`}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-950/30 p-4 hover:shadow-md transition-shadow text-center"
          >
            <p className="font-medium dark:text-white">Club Settings</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update club info and preferences
            </p>
          </Link>
          {duckRaceEnabled && (
            <Link
              href={`/dashboard/clubs/${slug}/races/new`}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-950/30 p-4 hover:shadow-md transition-shadow text-center"
            >
              <p className="font-medium dark:text-white">Duck Race</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Run a raffle for club members
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
