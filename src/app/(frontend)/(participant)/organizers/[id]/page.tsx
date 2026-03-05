import Link from "next/link";
import { notFound } from "next/navigation";

import BadgeGrid from "@/components/badges/BadgeGrid";
import EventCard from "@/components/events/EventCard";
import OrganizerProfileHeader from "@/components/organizers/OrganizerProfileHeader";
import OrganizerStats from "@/components/organizers/OrganizerStats";
import OrganizerReviewSection from "@/components/reviews/OrganizerReviewSection";
import StarRating from "@/components/reviews/StarRating";
import { Breadcrumbs, Button } from "@/components/ui";
import { isOrganizerReviewsEnabled } from "@/lib/cms/cached";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import { BreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { createClient } from "@/lib/supabase/server";
import type { OrganizerReviewsResponse } from "@/lib/types/organizer-reviews";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveOrganizerProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  idOrUsername: string,
) {
  // Try UUID lookup first
  if (UUID_REGEX.test(idOrUsername)) {
    const { data } = await supabase
      .from("organizer_profiles")
      .select("id")
      .eq("id", idOrUsername)
      .single();
    if (data) return data.id;
  }

  // Fall back to username lookup via users table
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("username", idOrUsername)
    .single();

  if (!user) return null;

  const { data: orgProfile } = await supabase
    .from("organizer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return orgProfile?.id ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: idOrUsername } = await params;
  const supabase = await createClient();

  const orgId = await resolveOrganizerProfile(supabase, idOrUsername);
  if (!orgId) return { title: "Organizer Not Found" };

  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("org_name, description, logo_url")
    .eq("id", orgId)
    .single();

  if (!profile) return { title: "Organizer Not Found" };

  const title = `${profile.org_name} — Organizer Profile`;
  const description = profile.description
    ? profile.description.slice(0, 160)
    : `Check out events organized by ${profile.org_name} on EventTara!`;

  const images = profile.logo_url ? [{ url: profile.logo_url, width: 200, height: 200 }] : [];

  return {
    title,
    description,
    openGraph: { title, description, type: "profile", images },
    twitter: { card: profile.logo_url ? "summary" : "summary", title, description, images },
  };
}

export default async function OrganizerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idOrUsername } = await params;
  const supabase = await createClient();

  const orgId = await resolveOrganizerProfile(supabase, idOrUsername);
  if (!orgId) notFound();

  // Fetch organizer profile with user info
  const { data: profile } = await supabase
    .from("organizer_profiles")
    .select("*, users:user_id(full_name, avatar_url, created_at, active_border_id)")
    .eq("id", orgId)
    .single();

  if (!profile) notFound();

  // Fetch published and completed events with booking counts
  const { data: events } = await supabase
    .from("events")
    .select("*, bookings(count)")
    .eq("organizer_id", orgId)
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
  let badges: {
    id: string;
    title: string;
    eventName: string;
    imageUrl: string | null;
    awardedAt: string;
  }[] = [];
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

  // Fetch aggregate review stats for organizer's events
  let avgRating = 0;
  let totalReviews = 0;
  let recentReviews: any[] = [];
  const eventReviewStats: Record<string, { avg: number; count: number }> = {};

  if (eventIds.length > 0) {
    const { data: allRatings } = await supabase
      .from("event_reviews")
      .select("rating, event_id")
      .in("event_id", eventIds);

    if (allRatings && allRatings.length > 0) {
      totalReviews = allRatings.length;
      avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

      // Build per-event stats
      const perEvent: Record<string, { sum: number; count: number }> = {};
      for (const r of allRatings) {
        if (!perEvent[r.event_id]) perEvent[r.event_id] = { sum: 0, count: 0 };
        perEvent[r.event_id].sum += r.rating;
        perEvent[r.event_id].count++;
      }
      for (const [eid, stats] of Object.entries(perEvent)) {
        eventReviewStats[eid] = { avg: stats.sum / stats.count, count: stats.count };
      }
    }

    if (totalReviews > 0) {
      const { data: reviewData } = await supabase
        .from("event_reviews")
        .select(
          "id, rating, text, created_at, event_id, users(full_name, avatar_url, username), events(title)",
        )
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
        .limit(5);
      recentReviews = reviewData || [];
    }
  }

  // Split events into upcoming and past
  const now = new Date().toISOString();
  const upcomingEvents = allEvents.filter((e) => e.date >= now);
  const pastEvents = allEvents.filter((e) => e.date < now).reverse();

  const user = profile.users as any;

  // Fetch active border tier for the organizer
  let borderTier: BorderTier | null = null;
  let borderColor: string | null = null;
  if (user?.active_border_id) {
    const { data: border } = await supabase
      .from("avatar_borders")
      .select("tier, border_color")
      .eq("id", user.active_border_id)
      .single();
    if (border) {
      borderTier = border.tier;
      borderColor = border.border_color;
    }
  }

  // Check if the viewer is the organizer
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const isOwnProfile = authUser?.id === profile.user_id;

  // Fetch organizer reviews (if feature flag enabled)
  const orgReviewsEnabled = await isOrganizerReviewsEnabled();
  let orgReviewsData: OrganizerReviewsResponse | null = null;
  let existingOrgReviewId: string | null = null;

  if (orgReviewsEnabled) {
    // Fetch reviews + aggregates
    const { data: orgReviewRows } = await supabase
      .from("organizer_reviews")
      .select("rating, tags")
      .eq("organizer_id", orgId);

    const orgTotalReviews = orgReviewRows?.length ?? 0;
    let orgAvgRating = 0;
    const orgTagCounts: Record<string, number> = {};

    if (orgReviewRows && orgReviewRows.length > 0) {
      orgAvgRating = orgReviewRows.reduce((sum, r) => sum + r.rating, 0) / orgReviewRows.length;
      for (const review of orgReviewRows) {
        if (Array.isArray(review.tags)) {
          for (const tag of review.tags) {
            orgTagCounts[tag] = (orgTagCounts[tag] || 0) + 1;
          }
        }
      }
    }

    // Fetch first page of reviews with user info + photos
    const { data: orgReviews } = await supabase
      .from("organizer_reviews")
      .select(
        "*, users:user_id(full_name, username, avatar_url, active_border_id), organizer_review_photos(id, image_url, sort_order)",
      )
      .eq("organizer_id", orgId)
      .order("created_at", { ascending: false })
      .range(0, 9);

    const mappedReviews = (orgReviews || []).map((r: any) => ({
      id: r.id,
      organizer_id: r.organizer_id,
      user_id: r.is_anonymous ? null : r.user_id,
      rating: r.rating,
      text: r.text,
      is_anonymous: r.is_anonymous,
      tags: r.tags || [],
      created_at: r.created_at,
      updated_at: r.updated_at,
      user: r.is_anonymous
        ? null
        : {
            full_name: r.users?.full_name ?? "User",
            username: r.users?.username ?? null,
            avatar_url: r.users?.avatar_url ?? null,
            active_border_id: r.users?.active_border_id ?? null,
          },
      photos: (r.organizer_review_photos || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((p: any) => ({ id: p.id, image_url: p.image_url, sort_order: p.sort_order })),
    }));

    orgReviewsData = {
      reviews: mappedReviews,
      averageRating: orgAvgRating,
      totalReviews: orgTotalReviews,
      tagCounts: orgTagCounts,
      page: 1,
      hasMore: orgTotalReviews > 10,
    };

    // Check if current user already has a review
    if (authUser) {
      const { data: myReview } = await supabase
        .from("organizer_reviews")
        .select("id")
        .eq("organizer_id", orgId)
        .eq("user_id", authUser.id)
        .single();
      existingOrgReviewId = myReview?.id ?? null;
    }
  }

  // Get current user info for the review form
  let currentUserInfo: { id: string; fullName: string } | null = null;
  if (authUser) {
    const { data: authUserData } = await supabase
      .from("users")
      .select("full_name, is_guest")
      .eq("id", authUser.id)
      .single();
    if (authUserData && !authUserData.is_guest) {
      currentUserInfo = { id: authUser.id, fullName: authUserData.full_name };
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <Breadcrumbs />
      <BreadcrumbTitle title={profile.org_name} />
      <OrganizerProfileHeader
        orgName={profile.org_name}
        logoUrl={profile.logo_url}
        description={profile.description}
        createdAt={user?.created_at || profile.created_at}
        isOwnProfile={isOwnProfile}
        borderTier={borderTier}
        borderColor={borderColor}
      />

      <OrganizerStats
        totalEvents={allEvents.length}
        totalParticipants={totalParticipants}
        totalBadgesAwarded={totalBadgesAwarded}
        avgRating={avgRating}
        totalReviews={totalReviews}
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
            {pastEvents.map((event: any) => {
              const stats = eventReviewStats[event.id];
              return (
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
                  avg_rating={stats?.avg}
                  review_count={stats?.count}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Badges & Trophies */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4 text-center">Badges & Trophies</h2>
        <BadgeGrid badges={badges} />
      </div>

      {/* Organizer Reviews (feature flagged) */}
      {orgReviewsEnabled && orgReviewsData && (
        <OrganizerReviewSection
          organizerId={orgId}
          initialData={orgReviewsData}
          currentUser={currentUserInfo}
          isOwnProfile={isOwnProfile}
          existingReviewId={existingOrgReviewId}
        />
      )}

      {/* Event Reviews (legacy — shown when organizer reviews are disabled, or always as supplement) */}
      {totalReviews > 0 && (
        <div>
          <h2 className="text-xl font-heading font-bold mb-4 text-center">Event Reviews</h2>
          <div className="flex items-center justify-center gap-3 mb-6">
            <StarRating value={Math.round(avgRating)} readonly size="md" />
            <span className="font-bold text-gray-900 dark:text-white">{avgRating.toFixed(1)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({totalReviews} review{totalReviews === 1 ? "" : "s"} across events)
            </span>
          </div>
          <div className="space-y-4">
            {recentReviews.map((review: any) => (
              <div
                key={review.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm dark:shadow-gray-950/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <StarRating value={review.rating} readonly size="sm" />
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    for {review.events?.title || "Event"}
                  </span>
                </div>
                {review.text && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{review.text}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {review.users?.full_name || "Participant"} &middot;{" "}
                  {new Date(review.created_at).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center pt-6 border-t border-gray-100 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400 mb-3">Want to join their events?</p>
        <Link href="/events">
          <Button>Explore Events</Button>
        </Link>
      </div>
    </div>
  );
}
