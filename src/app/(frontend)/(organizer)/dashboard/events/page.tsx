import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, UIBadge } from "@/components/ui";

const statusStyles: Record<string, string> = {
  draft: "default",
  published: "hiking",
  completed: "running",
  cancelled: "default",
};

export const metadata = { title: "My Events — EventTara" };

export default async function EventsListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  let events: any[] = [];
  if (profile) {
    const { data } = await supabase
      .from("events")
      .select("*, bookings(count)")
      .eq("organizer_id", profile.id)
      .order("created_at", { ascending: false });
    events = data || [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">My Events</h1>
        <Link href="/dashboard/events/new">
          <Button>Create Event</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
          <h2 className="text-lg font-heading font-bold mb-2">No events yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first adventure event!</p>
          <Link href="/dashboard/events/new">
            <Button>Create Event</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Event</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Bookings</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {events.map((event: any) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/events/${event.id}`} className="font-medium hover:text-lime-600 dark:hover:text-lime-400">
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4">
                    <UIBadge variant={statusStyles[event.status] as any}>{event.status}</UIBadge>
                  </td>
                  <td className="px-6 py-4 text-sm">{event.bookings?.[0]?.count || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/events/${event.id}/edit`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
