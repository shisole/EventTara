import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, UIBadge } from "@/components/ui";
import EventDashboardTabs from "@/components/dashboard/EventDashboardTabs";

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) notFound();

  // Get bookings with user info
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, users:user_id(full_name, email, avatar_url)")
    .eq("event_id", id)
    .order("booked_at", { ascending: false });

  // Get companions per booking
  const bookingIds = (bookings || []).map((b: any) => b.id);
  let companionsByBooking: Record<string, any[]> = {};
  if (bookingIds.length > 0) {
    const { data: companions } = await supabase
      .from("booking_companions")
      .select("id, booking_id, full_name")
      .in("booking_id", bookingIds);

    if (companions) {
      for (const c of companions) {
        if (!companionsByBooking[c.booking_id]) companionsByBooking[c.booking_id] = [];
        companionsByBooking[c.booking_id].push(c);
      }
    }
  }

  // Total participants = bookings + companions
  const totalCompanions = Object.values(companionsByBooking).reduce((sum, arr) => sum + arr.length, 0);
  const totalParticipants = (bookings?.length || 0) + totalCompanions;

  // Get check-in count
  const { count: checkinCount } = await supabase
    .from("event_checkins")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  // Revenue: (1 + companion_count) * price for paid bookings
  const revenue = (bookings || [])
    .filter((b: any) => b.payment_status === "paid")
    .reduce((sum: number, b: any) => {
      const compCount = companionsByBooking[b.id]?.length || 0;
      return sum + (1 + compCount) * Number(event.price);
    }, 0);

  const handlePublish = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.from("events").update({ status: "published" }).eq("id", id);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">{event.title}</h1>
          <UIBadge variant={event.status === "published" ? "hiking" : "default"} className="mt-2">
            {event.status}
          </UIBadge>
        </div>
        <div className="flex gap-3">
          <Link href={`/dashboard/events/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href={`/dashboard/events/${id}/checkin`}>
            <Button variant="secondary">Check-in Tool</Button>
          </Link>
          {event.status === "draft" && (
            <form action={handlePublish}>
              <Button type="submit">Publish</Button>
            </form>
          )}
        </div>
      </div>

      <EventDashboardTabs eventId={id} eventPrice={Number(event.price)}>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
            <p className="text-2xl font-bold">{totalParticipants}/{event.max_participants}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">Checked In</p>
            <p className="text-2xl font-bold">{checkinCount || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
            <p className="text-2xl font-bold">
              PHP {revenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Participant List */}
        <div className="mt-8">
          <h2 className="text-xl font-heading font-bold mb-4">Participants</h2>
          {bookings && bookings.length > 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Payment</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">Booked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {bookings.map((booking: any) => {
                    const comps = companionsByBooking[booking.id] || [];
                    return (
                      <>
                        <tr key={booking.id}>
                          <td className="px-6 py-4 font-medium">{booking.users?.full_name || "Guest"}</td>
                          <td className="px-6 py-4">
                            <UIBadge variant={booking.status === "confirmed" ? "hiking" : "default"}>
                              {booking.status}
                            </UIBadge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{booking.payment_method?.toUpperCase()}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(booking.booked_at).toLocaleDateString("en-PH")}
                          </td>
                        </tr>
                        {comps.map((comp: any) => (
                          <tr key={comp.id} className="bg-gray-50/50 dark:bg-gray-800/50">
                            <td className="px-6 py-3 pl-12 text-sm text-gray-600 dark:text-gray-400">
                              ↳ {comp.full_name} <span className="text-gray-400 dark:text-gray-500">(companion)</span>
                            </td>
                            <td className="px-6 py-3">
                              <UIBadge variant={booking.status === "confirmed" ? "hiking" : "default"}>
                                {booking.status}
                              </UIBadge>
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">—</td>
                            <td className="px-6 py-3 text-sm text-gray-400 dark:text-gray-500">—</td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No participants yet.</p>
          )}
        </div>
      </EventDashboardTabs>
    </div>
  );
}
