import Link from "next/link";
import { notFound } from "next/navigation";

import EventDashboardTabs from "@/components/dashboard/EventDashboardTabs";
import ParticipantsTable from "@/components/dashboard/ParticipantsTable";
import PublishButton from "@/components/dashboard/PublishButton";
import { Button, UIBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();

  if (!event) notFound();

  // Get bookings with user info
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, users:user_id(full_name, email, avatar_url)")
    .eq("event_id", id)
    .order("booked_at", { ascending: false });

  // Get companions per booking
  const bookingIds = (bookings || []).map((b: any) => b.id);
  const companionsByBooking: Record<string, any[]> = {};
  if (bookingIds.length > 0) {
    const { data: companions } = await supabase
      .from("booking_companions")
      .select("id, booking_id, full_name, status")
      .in("booking_id", bookingIds);

    if (companions) {
      for (const c of companions) {
        if (!companionsByBooking[c.booking_id]) companionsByBooking[c.booking_id] = [];
        companionsByBooking[c.booking_id].push(c);
      }
    }
  }

  // Total participants = non-cancelled bookings + non-cancelled companions
  const totalCompanions = Object.values(companionsByBooking).reduce(
    (sum, arr) => sum + arr.filter((c: any) => c.status !== "cancelled").length,
    0,
  );
  const activeBookings = (bookings || []).filter((b: any) => !b.participant_cancelled).length;
  const totalParticipants = activeBookings + totalCompanions;

  // Get check-in count
  const { count: checkinCount } = await supabase
    .from("event_checkins")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  // Revenue: count main participant (if not cancelled) + confirmed companions
  const revenue = (bookings || [])
    .filter((b: any) => b.payment_status === "paid")
    .reduce((sum: number, b: any) => {
      const mainCount = b.participant_cancelled ? 0 : 1;
      const confirmedComps = (companionsByBooking[b.id] || []).filter(
        (c: any) => c.status === "confirmed",
      ).length;
      return sum + (mainCount + confirmedComps) * event.price;
    }, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold dark:text-white">{event.title}</h1>
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
          {event.status === "draft" && <PublishButton eventId={id} />}
        </div>
      </div>

      <EventDashboardTabs eventId={id} eventPrice={event.price}>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">Participants</p>
            <p className="text-2xl font-bold dark:text-white">
              {totalParticipants}/{event.max_participants}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">Checked In</p>
            <p className="text-2xl font-bold dark:text-white">{checkinCount || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/30">
            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
            <p className="text-2xl font-bold dark:text-white">PHP {revenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Participant List */}
        <div className="mt-8">
          <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">Participants</h2>
          <ParticipantsTable
            bookings={(bookings || []) as any}
            companionsByBooking={companionsByBooking}
          />
        </div>
      </EventDashboardTabs>
    </div>
  );
}
