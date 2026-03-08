import Link from "next/link";

import EventsTable from "@/components/dashboard/EventsTable";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My Events — EventTara" };

export default async function EventsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find clubs where user is owner or admin
  const { data: memberships } = await supabase
    .from("club_members")
    .select("club_id")
    .eq("user_id", user!.id)
    .in("role", ["owner", "admin"]);

  const clubIds = (memberships ?? []).map((m) => m.club_id);

  let events: any[] = [];
  if (clubIds.length > 0) {
    const { data } = await supabase
      .from("events")
      .select("*, bookings(count)")
      .in("club_id", clubIds)
      .order("date", { ascending: true });
    events = data || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold dark:text-white">My Events</h1>
        <Link href="/dashboard/events/new">
          <Button>Create Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
          <h2 className="text-lg font-heading font-bold mb-2 dark:text-white">No events yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first adventure event!
          </p>
          <Link href="/dashboard/events/new">
            <Button>Create Event</Button>
          </Link>
        </div>
      ) : (
        <EventsTable events={events} />
      )}
    </div>
  );
}
