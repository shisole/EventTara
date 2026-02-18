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
    .select("user_id, users:user_id(full_name, avatar_url)")
    .eq("event_id", id)
    .in("status", ["confirmed", "pending"]);

  const { data: checkins } = await supabase
    .from("event_checkins")
    .select("user_id, checked_in_at")
    .eq("event_id", id);

  const checkinMap = new Map(
    (checkins || []).map((c) => [c.user_id, c.checked_in_at])
  );

  const participants = (bookings || []).map((b: any) => ({
    userId: b.user_id,
    fullName: b.users?.full_name || "Guest",
    avatarUrl: b.users?.avatar_url || null,
    checkedIn: checkinMap.has(b.user_id),
    checkedInAt: checkinMap.get(b.user_id) || null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">
        Check-in: {event.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-heading font-bold mb-4">QR Scanner</h2>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <QRScanner eventId={id} onCheckin={() => {}} />
          </div>
        </div>

        <CheckinList eventId={id} initialParticipants={participants} />
      </div>
    </div>
  );
}
