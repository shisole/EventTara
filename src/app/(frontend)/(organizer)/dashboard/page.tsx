import dynamic from "next/dynamic";
import Link from "next/link";

import DashboardStats from "@/components/dashboard/DashboardStats";
import { type CalendarEvent } from "@/components/dashboard/EventsCalendar";
import ScannerButton from "@/components/dashboard/ScannerButton";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const EventsCalendar = dynamic(() => import("@/components/dashboard/EventsCalendar"));

export const metadata = {
  title: "Dashboard — EventTara",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get organizer profile
  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  let totalEvents = 0;
  let totalBookings = 0;
  let upcomingEvents = 0;
  let calendarEvents: CalendarEvent[] = [];

  if (profile) {
    // Fetch all events for stats + calendar
    const { data: events } = await supabase
      .from("events")
      .select("id, title, date, end_date, type, status")
      .eq("organizer_id", profile.id)
      .order("date", { ascending: true });

    if (events && events.length > 0) {
      totalEvents = events.length;
      calendarEvents = events as CalendarEvent[];

      // Count upcoming published events
      const now = new Date().toISOString();
      upcomingEvents = events.filter((e) => e.status === "published" && e.date >= now).length;

      // Count total bookings across all events
      const eventIds = events.map((e) => e.id);
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .in("event_id", eventIds);
      totalBookings = bookingCount || 0;
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-heading font-bold dark:text-white">Dashboard</h1>
        <div className="flex items-center gap-2">
          <ScannerButton />
          <Link href="/dashboard/events/new">
            <Button>Create Event</Button>
          </Link>
        </div>
      </div>

      <DashboardStats
        totalEvents={totalEvents}
        totalBookings={totalBookings}
        upcomingEvents={upcomingEvents}
      />

      {calendarEvents.length > 0 && <EventsCalendar events={calendarEvents} />}

      {!profile && (
        <div className="bg-golden-50 dark:bg-golden-900/20 border border-golden-200 dark:border-golden-800 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-heading font-bold mb-2 dark:text-white">
            Set Up Your Organizer Profile
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete your profile to start creating events.
          </p>
          <Link href="/dashboard/settings">
            <Button variant="secondary">Complete Profile</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
