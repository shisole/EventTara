import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button, UIBadge } from "@/components/ui";

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

  // Get check-in count
  const { count: checkinCount } = await supabase
    .from("event_checkins")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Bookings</p>
          <p className="text-2xl font-bold">{bookings?.length || 0}/{event.max_participants}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Checked In</p>
          <p className="text-2xl font-bold">{checkinCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-bold">PHP {((bookings?.length || 0) * Number(event.price)).toLocaleString()}</p>
        </div>
      </div>

      {/* Participant List */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4">Participants</h2>
        {bookings && bookings.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Payment</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((booking: any) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 font-medium">{booking.users?.full_name || "Guest"}</td>
                    <td className="px-6 py-4">
                      <UIBadge variant={booking.status === "confirmed" ? "hiking" : "default"}>
                        {booking.status}
                      </UIBadge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{booking.payment_method?.toUpperCase()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(booking.booked_at).toLocaleDateString("en-PH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No participants yet.</p>
        )}
      </div>
    </div>
  );
}
