import Link from "next/link";
import { notFound } from "next/navigation";

import BadgeAwarder from "@/components/dashboard/BadgeAwarder";
import CompleteEventButton from "@/components/dashboard/CompleteEventButton";
import EventDashboardTabs from "@/components/dashboard/EventDashboardTabs";
import ParticipantsTable from "@/components/dashboard/ParticipantsTable";
import PublishButton from "@/components/dashboard/PublishButton";
import { ChevronLeftIcon } from "@/components/icons";
import { Button, UIBadge } from "@/components/ui";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import { BreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { createClient } from "@/lib/supabase/server";

export default async function ManageEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();

  if (!event) notFound();

  // Get bookings with user info
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, users:user_id(full_name, email, avatar_url, active_border_id)")
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

  // Get check-ins
  const { data: checkins } = await supabase
    .from("event_checkins")
    .select("user_id")
    .eq("event_id", id);

  const checkedInUserIds = new Set((checkins ?? []).map((c) => c.user_id));
  const checkinCount = checkedInUserIds.size;

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

  // Fetch event badge (if any)
  const { data: eventBadge } = await supabase
    .from("badges")
    .select("id")
    .eq("event_id", id)
    .eq("type", "event")
    .maybeSingle();

  // If badge exists, fetch which users already have it
  let awardedUserIds = new Set<string>();
  if (eventBadge) {
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("user_id")
      .eq("badge_id", eventBadge.id);

    awardedUserIds = new Set((userBadges ?? []).map((ub) => ub.user_id));
  }

  // Fetch active border info for badge awarder participants
  const allUserIds = (bookings || [])
    .filter((b: any) => !b.participant_cancelled)
    .map((b: any) => b.user_id);

  const bordersByUserId: Record<string, { tier: BorderTier | null; color: string | null }> = {};
  if (allUserIds.length > 0) {
    const borderIds = (bookings || []).map((b: any) => b.users?.active_border_id).filter(Boolean);

    if (borderIds.length > 0) {
      const { data: borders } = await supabase
        .from("avatar_borders")
        .select("id, tier, border_color")
        .in("id", borderIds);

      if (borders) {
        const borderMap = new Map(borders.map((b) => [b.id, b]));
        for (const booking of bookings || []) {
          const user = (booking as any).users;
          if (user?.active_border_id) {
            const border = borderMap.get(user.active_border_id);
            if (border) {
              bordersByUserId[(booking as any).user_id] = {
                tier: border.tier as BorderTier | null,
                color: border.border_color,
              };
            }
          }
        }
      }
    }
  }

  // Build participants array for BadgeAwarder
  const badgeParticipants = eventBadge
    ? (bookings || [])
        .filter((b: any) => !b.participant_cancelled)
        .map((b: any) => ({
          userId: b.user_id as string,
          fullName: (b.users?.full_name as string) || "Unknown",
          avatarUrl: (b.users?.avatar_url as string | null) ?? null,
          checkedIn: checkedInUserIds.has(b.user_id),
          alreadyAwarded: awardedUserIds.has(b.user_id),
          borderTier: bordersByUserId[b.user_id]?.tier ?? null,
          borderColor: bordersByUserId[b.user_id]?.color ?? null,
        }))
    : [];

  const showBadgeAwarder =
    eventBadge && (event.status === "published" || event.status === "completed");

  return (
    <div className="space-y-8">
      <BreadcrumbTitle title={event.title} />
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to Events
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold dark:text-white">{event.title}</h1>
          <UIBadge variant={event.status === "published" ? "hiking" : "default"} className="mt-2">
            {event.status}
          </UIBadge>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/dashboard/events/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link href={`/dashboard/events/${id}/checkin`}>
            <Button variant="secondary">Check-in Tool</Button>
          </Link>
          {event.status === "draft" && <PublishButton eventId={id} />}
          {event.status === "published" && <CompleteEventButton eventId={id} />}
        </div>
      </div>

      {event.status === "completed" && (
        <div className="bg-forest-50 dark:bg-forest-900/40 border border-forest-200 dark:border-forest-700 rounded-xl p-4 text-sm text-forest-700 dark:text-forest-200">
          Badges were automatically awarded to checked-in participants when this event was marked as
          completed.
        </div>
      )}

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
            <p className="text-2xl font-bold dark:text-white">{checkinCount}</p>
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
            checkedInUserIds={checkedInUserIds}
          />
        </div>

        {/* Badge Awarder */}
        {showBadgeAwarder && (
          <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm dark:shadow-gray-950/30">
            <BadgeAwarder badgeId={eventBadge.id} participants={badgeParticipants} />
          </div>
        )}
      </EventDashboardTabs>
    </div>
  );
}
