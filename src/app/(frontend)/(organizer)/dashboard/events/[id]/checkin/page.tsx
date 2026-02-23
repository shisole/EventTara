import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import QRScanner from "@/components/checkin/QRScanner";
import CheckinList from "@/components/checkin/CheckinList";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!event) notFound();

  // Get all bookings with check-in status
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id, participant_cancelled, users:user_id(full_name, avatar_url)")
    .eq("event_id", id)
    .in("status", ["confirmed", "pending"])
    .eq("participant_cancelled", false);

  const { data: checkins } = await supabase
    .from("event_checkins")
    .select("user_id, checked_in_at")
    .eq("event_id", id);

  const checkinMap = new Map(
    (checkins || []).map((c) => [c.user_id, c.checked_in_at])
  );

  const participants: { id: string; type: "user" | "companion"; fullName: string; avatarUrl: string | null; checkedIn: boolean; checkedInAt: string | null }[] = (bookings || []).map((b: any) => ({
    id: b.user_id,
    type: "user" as const,
    fullName: b.users?.full_name || "Guest",
    avatarUrl: b.users?.avatar_url || null,
    checkedIn: checkinMap.has(b.user_id),
    checkedInAt: checkinMap.get(b.user_id) || null,
  }));

  // Fetch companions for all active bookings
  const bookingIds = (bookings || []).map((b: any) => b.id);
  if (bookingIds.length > 0) {
    const { data: companions } = await supabase
      .from("booking_companions")
      .select("id, full_name, checked_in, checked_in_at, booking_id, status")
      .in("booking_id", bookingIds)
      .neq("status", "cancelled");

    if (companions) {
      for (const comp of companions) {
        participants.push({
          id: comp.id,
          type: "companion" as const,
          fullName: `${comp.full_name} (companion)`,
          avatarUrl: null,
          checkedIn: comp.checked_in,
          checkedInAt: comp.checked_in_at,
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold dark:text-white">
        Check-in: {event.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">QR Scanner</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
            <QRScanner eventId={id} />
          </div>
        </div>

        <CheckinList eventId={id} initialParticipants={participants} />
      </div>
    </div>
  );
}
