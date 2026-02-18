import { createClient } from "@/lib/supabase/server";
import DashboardStats from "@/components/dashboard/DashboardStats";
import Link from "next/link";
import { Button } from "@/components/ui";

export const metadata = {
  title: "Dashboard — EventTara",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get organizer profile
  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  let totalEvents = 0;
  let totalBookings = 0;
  let upcomingEvents = 0;

  if (profile) {
    // Count total events
    const { count: eventCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("organizer_id", profile.id);
    totalEvents = eventCount || 0;

    // Count total bookings across all events
    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_id", profile.id);

    if (events && events.length > 0) {
      const eventIds = events.map((e) => e.id);
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .in("event_id", eventIds);
      totalBookings = bookingCount || 0;
    }

    // Count upcoming events
    const { count: upcomingCount } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("organizer_id", profile.id)
      .eq("status", "published")
      .gte("date", new Date().toISOString());
    upcomingEvents = upcomingCount || 0;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <Link href="/dashboard/events/new">
          <Button>Create Event</Button>
        </Link>
      </div>

      <DashboardStats
        totalEvents={totalEvents}
        totalBookings={totalBookings}
        upcomingEvents={upcomingEvents}
      />

      {!profile && (
        <div className="bg-golden-50 border border-golden-200 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-heading font-bold mb-2">Set Up Your Organizer Profile</h2>
          <p className="text-gray-600 mb-4">Complete your profile to start creating events.</p>
          <Link href="/dashboard/settings">
            <Button variant="secondary">Complete Profile</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
