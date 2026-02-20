import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import BadgeGrid from "@/components/badges/BadgeGrid";
import UpcomingBookings from "@/components/participant/UpcomingBookings";
import PastEvents from "@/components/participant/PastEvents";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .eq("username", username)
    .single();

  if (!user) return { title: "Profile Not Found" };

  const { count: badgeCount } = await supabase
    .from("user_badges")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const title = `${user.full_name}'s Adventure Profile`;
  const description =
    badgeCount && badgeCount > 0
      ? `${user.full_name} has earned ${badgeCount} badge${badgeCount !== 1 ? "s" : ""} on EventTara. Check out their adventure profile!`
      : `Check out ${user.full_name}'s adventure profile on EventTara!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(user.avatar_url && {
        images: [{ url: user.avatar_url, width: 400, height: 400, alt: user.full_name }],
      }),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(user.avatar_url && { images: [user.avatar_url] }),
    },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!user) notFound();

  // Check if the viewer is the profile owner
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const isOwnProfile = authUser?.id === user.id;

  // Fetch bookings data for own profile
  let upcoming: any[] = [];
  let past: any[] = [];
  const isGuest = isOwnProfile ? !!user.is_guest : false;

  if (isOwnProfile) {
    const { data: bookingData } = await supabase
      .from("bookings")
      .select("id, qr_code, payment_status, payment_method, payment_proof_url, events(id, title, type, date, location, price)")
      .eq("user_id", user.id)
      .in("status", ["confirmed", "pending"])
      .order("booked_at", { ascending: false });

    const upcomingBookings = (bookingData || [])
      .filter((b: any) => b.events && new Date(b.events.date) >= new Date());

    // Fetch companions for upcoming bookings
    const upcomingBookingIds = upcomingBookings.map((b: any) => b.id);
    let companionsByBooking: Record<string, any[]> = {};
    if (upcomingBookingIds.length > 0) {
      const { data: companions } = await supabase
        .from("booking_companions")
        .select("booking_id, full_name, qr_code")
        .in("booking_id", upcomingBookingIds);

      if (companions) {
        for (const c of companions) {
          if (!companionsByBooking[c.booking_id]) companionsByBooking[c.booking_id] = [];
          companionsByBooking[c.booking_id].push({ full_name: c.full_name, qr_code: c.qr_code });
        }
      }
    }

    upcoming = upcomingBookings.map((b: any) => ({
      id: b.id,
      qrCode: b.qr_code || "",
      eventTitle: b.events.title,
      eventType: b.events.type,
      eventDate: b.events.date,
      eventLocation: b.events.location,
      eventId: b.events.id,
      eventPrice: b.events.price,
      paymentStatus: b.payment_status,
      paymentMethod: b.payment_method,
      paymentProofUrl: b.payment_proof_url,
      companions: companionsByBooking[b.id] || [],
    }));

    const pastBookings = (bookingData || [])
      .filter((b: any) => b.events && new Date(b.events.date) < new Date());

    const pastEventIds = pastBookings.map((b: any) => b.events.id);

    let checkins: any[] = [];
    let pastBadges: any[] = [];

    if (pastEventIds.length > 0) {
      const { data: c } = await supabase
        .from("event_checkins")
        .select("event_id")
        .eq("user_id", user.id)
        .in("event_id", pastEventIds);
      checkins = c || [];

      const { data: ub } = await supabase
        .from("user_badges")
        .select("badges(event_id, title, image_url)")
        .eq("user_id", user.id);
      pastBadges = ub || [];
    }

    const checkinSet = new Set(checkins.map((c: any) => c.event_id));
    const badgeMap = new Map(
      pastBadges.map((ub: any) => [ub.badges?.event_id, { title: ub.badges?.title, imageUrl: ub.badges?.image_url }])
    );

    past = pastBookings.map((b: any) => ({
      eventId: b.events.id,
      eventTitle: b.events.title,
      eventType: b.events.type,
      eventDate: b.events.date,
      badgeTitle: badgeMap.get(b.events.id)?.title || null,
      badgeImageUrl: badgeMap.get(b.events.id)?.imageUrl || null,
      checkedIn: checkinSet.has(b.events.id),
    }));
  }

  // Get user badges with event info
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("badge_id, awarded_at, badges(title, image_url, events(title))")
    .eq("user_id", user.id)
    .order("awarded_at", { ascending: false });

  // Get booking history for stats
  const { data: bookings } = await supabase
    .from("bookings")
    .select("events(type)")
    .eq("user_id", user.id)
    .in("status", ["confirmed", "pending"]);

  const totalEvents = bookings?.length || 0;
  const badgeCount = userBadges?.length || 0;

  // Type breakdown
  const typeBreakdown: Record<string, number> = {};
  bookings?.forEach((b: any) => {
    const type = b.events?.type;
    if (type) typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
  });

  // Format badges for BadgeGrid
  const badges = (userBadges || []).map((ub: any) => ({
    id: ub.badge_id,
    title: ub.badges?.title || "Badge",
    eventName: ub.badges?.events?.title || "Event",
    imageUrl: ub.badges?.image_url || null,
    awardedAt: ub.awarded_at,
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
      <ProfileHeader
        fullName={user.full_name}
        username={user.username}
        avatarUrl={user.avatar_url}
        createdAt={user.created_at}
        isOwnProfile={isOwnProfile}
      />

      <ProfileStats
        totalEvents={totalEvents}
        badgeCount={badgeCount}
        typeBreakdown={typeBreakdown}
      />

      {isOwnProfile && isGuest && (
        <div className="bg-golden-50 border border-golden-200 rounded-2xl p-5 text-center">
          <p className="font-medium mb-2">Create an account to keep your badges forever!</p>
          <Link href="/signup"><Button size="sm">Create Account</Button></Link>
        </div>
      )}

      {isOwnProfile && (
        <section>
          <h2 className="text-xl font-heading font-bold mb-4">Upcoming Events</h2>
          <UpcomingBookings bookings={upcoming} />
        </section>
      )}

      {isOwnProfile && (
        <section>
          <h2 className="text-xl font-heading font-bold mb-4">Past Adventures</h2>
          <PastEvents events={past} />
        </section>
      )}

      <div>
        <h2 className="text-xl font-heading font-bold mb-4 text-center">Badge Collection</h2>
        <BadgeGrid badges={badges} />
      </div>

      {!isOwnProfile && (
        <div className="text-center pt-6 border-t border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 mb-3">Want to earn badges too?</p>
          <Link href="/signup">
            <Button>Join EventTara</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
