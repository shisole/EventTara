import Link from "next/link";
import { notFound } from "next/navigation";

import CheckinList from "@/components/checkin/CheckinList";
import QRScanner from "@/components/checkin/QRScanner";
import { ChevronLeftIcon } from "@/components/icons";
import { type BorderTier } from "@/lib/constants/avatar-borders";
import { BreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { fetchCompanionsByBooking } from "@/lib/data/companions";
import { buildBorderLookupByUserId } from "@/lib/data/enrich-borders";
import { createClient } from "@/lib/supabase/server";

export default async function ClubCheckinPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
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
  const bordersByUserId = await buildBorderLookupByUserId(supabase, (bookings || []) as any);

  const participants: {
    id: string;
    type: "user" | "companion";
    fullName: string;
    avatarUrl: string | null;
    checkedIn: boolean;
    checkedInAt: string | null;
    borderTier?: BorderTier | null;
    borderColor?: string | null;
  }[] = (bookings || []).map((b: any) => ({
    id: b.user_id,
    type: "user" as const,
    fullName: b.users?.full_name || "Guest",
    avatarUrl: b.users?.avatar_url || null,
    checkedIn: checkinMap.has(b.user_id),
    checkedInAt: checkinMap.get(b.user_id) || null,
    borderTier: (bordersByUserId[b.user_id]?.tier as BorderTier) ?? null,
    borderColor: bordersByUserId[b.user_id]?.color ?? null,
  }));

  // Fetch companions for all active bookings
  const bookingIds = (bookings || []).map((b: any) => b.id);
  const companionsByBooking = await fetchCompanionsByBooking<{
    booking_id: string;
    id: string;
    full_name: string;
    checked_in: boolean;
    checked_in_at: string | null;
    status: string;
  }>(supabase, bookingIds, "id, full_name, checked_in, checked_in_at, booking_id, status");

  for (const comps of Object.values(companionsByBooking)) {
    for (const comp of comps) {
      if (comp.status === "cancelled") continue;
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

  const eventsBase = `/dashboard/clubs/${slug}/events`;

  return (
    <div className="space-y-6">
      <BreadcrumbTitle title={event.title} />
      <Link
        href={`${eventsBase}/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Event
      </Link>

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
