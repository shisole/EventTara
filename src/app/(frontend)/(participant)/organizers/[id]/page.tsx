import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import OrganizerProfileHeader from "@/components/organizers/OrganizerProfileHeader";
import OrganizerStats from "@/components/organizers/OrganizerStats";
import EventCard from "@/components/events/EventCard";
import BadgeGrid from "@/components/badges/BadgeGrid";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("org_name, description")
    .eq("id", id)
    .single();

  if (!profile) return { title: "Organizer Not Found" };

  const title = `${profile.org_name} — Organizer Profile`;
  const description = profile.description
    ? profile.description.slice(0, 160)
    : `Check out events organized by ${profile.org_name} on EventTara!`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile" },
    twitter: { card: "summary", title, description },
  };
}

export default async function OrganizerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch organizer profile with user info
  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("*, users:user_id(full_name, avatar_url, created_at)")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  // Fetch published and completed events with booking counts
  const { data: events } = await supabase
    .from("events")
    .select("*, bookings(count)")
    .eq("organizer_id", id)
    .in("status", ["published", "completed"])
    .order("date", { ascending: true });

  const allEvents = events || [];
  const eventIds = allEvents.map((e) => e.id);

  // Count total participants across all events
  let totalParticipants = 0;
  if (eventIds.length > 0) {
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .in("event_id", eventIds)
      .in("status", ["confirmed", "pending"]);
    totalParticipants = count || 0;
  }

  // Fetch badges for organizer's events
  let badges: { id: string; title: string; eventName: string; imageUrl: string | null; awardedAt: string }[] = [];
  let totalBadgesAwarded = 0;

  if (eventIds.length > 0) {
    const { data: badgeData } = await supabase
      .from("badges")
      .select("*, events!inner(title)")
      .in("event_id", eventIds);

    const allBadges = badgeData || [];
    const badgeIds = allBadges.map((b) => b.id);

    if (badgeIds.length > 0) {
      const { count } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .in("badge_id", badgeIds);
      totalBadgesAwarded = count || 0;
    }

    badges = allBadges.map((b: any) => ({
      id: b.id,
      title: b.title,
      eventName: b.events?.title || "Event",
      imageUrl: b.image_url,
      awardedAt: b.created_at,
    }));
  }

  // Split events into upcoming and past
  const now = new Date().toISOString();
  const upcomingEvents = allEvents.filter((e) => e.date >= now);
  const pastEvents = allEvents.filter((e) => e.date < now).reverse();

  const user = profile.users as any;

  // Check if the viewer is the organizer
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const isOwnProfile = authUser?.id === profile.user_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <OrganizerProfileHeader
        orgName={profile.org_name}
        logoUrl={profile.logo_url}
        description={profile.description}
        createdAt={user?.created_at || profile.created_at}
        isOwnProfile={isOwnProfile}
      />

      <OrganizerStats
        totalEvents={allEvents.length}
        totalParticipants={totalParticipants}
        totalBadgesAwarded={totalBadgesAwarded}
      />

      {/* Upcoming Events */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4">Upcoming Events</h2>
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {upcomingEvents.map((event: any) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                type={event.type}
                date={event.date}
                location={event.location}
                price={Number(event.price)}
                cover_image_url={event.cover_image_url}
                max_participants={event.max_participants}
                booking_count={event.bookings?.[0]?.count || 0}
                status="upcoming"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">&#x1F4C5;</p>
            <p className="text-gray-500 dark:text-gray-400">No upcoming events scheduled.</p>
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-heading font-bold mb-4">Past Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pastEvents.map((event: any) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                type={event.type}
                date={event.date}
                location={event.location}
                price={Number(event.price)}
                cover_image_url={event.cover_image_url}
                max_participants={event.max_participants}
                booking_count={event.bookings?.[0]?.count || 0}
                status="past"
              />
            ))}
          </div>
        </div>
      )}

      {/* Badges & Trophies */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4 text-center">Badges & Trophies</h2>
        <BadgeGrid badges={badges} />
      </div>

      <div className="text-center pt-6 border-t border-gray-100 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400 mb-3">Want to join their events?</p>
        <Link href="/events">
          <Button>Explore Events</Button>
        </Link>
      </div>
    </div>
  );
}
