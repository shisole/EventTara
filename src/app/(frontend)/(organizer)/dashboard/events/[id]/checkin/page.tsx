import { notFound } from "next/navigation";

import CheckinList from "@/components/checkin/CheckinList";
import QRScanner from "@/components/checkin/QRScanner";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import { createClient } from "@/lib/supabase/server";

export default async function CheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("id, title").eq("id", id).single();

  if (!event) notFound();

  // Get all bookings with check-in status
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, user_id, participant_cancelled, users:user_id(full_name, avatar_url, active_border_id)",
    )
    .eq("event_id", id)
    .in("status", ["confirmed", "pending"])
    .eq("participant_cancelled", false);

  const { data: checkins } = await supabase
    .from("event_checkins")
    .select("user_id, checked_in_at")
    .eq("event_id", id);

  const checkinMap = new Map((checkins || []).map((c) => [c.user_id, c.checked_in_at]));

  // Fetch border data for participants with active borders
  const borderIds = (bookings || [])
    .map((b: any) => b.users?.active_border_id)
    .filter(Boolean) as string[];

  let borderLookup = new Map<string, { tier: string; border_color: string | null }>();
  if (borderIds.length > 0) {
    const { data: borderDefs } = await supabase
      .from("avatar_borders")
      .select("id, tier, border_color")
      .in("id", borderIds);
    borderLookup = new Map((borderDefs || []).map((b) => [b.id, b]));
  }

  const participants: {
    id: string;
    type: "user" | "companion";
    fullName: string;
    avatarUrl: string | null;
    checkedIn: boolean;
    checkedInAt: string | null;
    borderTier?: BorderTier | null;
    borderColor?: string | null;
  }[] = (bookings || []).map((b: any) => {
    const borderId = b.users?.active_border_id;
    const border = borderId ? borderLookup.get(borderId) : null;
    return {
      id: b.user_id,
      type: "user" as const,
      fullName: b.users?.full_name || "Guest",
      avatarUrl: b.users?.avatar_url || null,
      checkedIn: checkinMap.has(b.user_id),
      checkedInAt: checkinMap.get(b.user_id) || null,
      borderTier: (border?.tier as BorderTier) ?? null,
      borderColor: border?.border_color ?? null,
    };
  });

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
      <h1 className="text-2xl font-heading font-bold dark:text-white">Check-in: {event.title}</h1>

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
