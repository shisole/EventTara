import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import BookingButton from "@/components/events/BookingButton";
import DifficultyBadge from "@/components/events/DifficultyBadge";
import EventGallery from "@/components/events/EventGallery";
import OrganizerCard from "@/components/events/OrganizerCard";
import ShareButtons from "@/components/events/ShareButtons";
import GuideCard from "@/components/guides/GuideCard";
import { LocationPinIcon } from "@/components/icons";
import EventLocationMap from "@/components/maps/EventLocationMap";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import { UIBadge } from "@/components/ui";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/format-date";

const typeLabels: Record<string, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title, description, type, cover_image_url, date, location")
    .eq("id", id)
    .single();

  if (!event) return { title: "Event Not Found" };

  const description = event.description
    ? event.description.slice(0, 160)
    : `Join this ${typeLabels[event.type] || event.type} adventure on EventTara!`;

  const images = event.cover_image_url
    ? [{ url: event.cover_image_url, width: 1200, height: 630, alt: event.title }]
    : undefined;

  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "article",
      siteName: "EventTara",
      url: `/events/${id}`,
      ...(images && { images }),
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      ...(images && { images }),
    },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch event with organizer profile
  const { data: event } = await supabase
    .from("events")
    .select("*, organizer_profiles:organizer_id(*, users:user_id(*))")
    .eq("id", id)
    .single();

  if (!event || (event.status !== "published" && event.status !== "completed")) {
    notFound();
  }

  // Fetch distance categories
  const { data: distances } = await supabase
    .from("event_distances")
    .select("id, distance_km, label, price, max_participants")
    .eq("event_id", id)
    .order("distance_km", { ascending: true });

  // Fetch photos
  const { data: photos } = await supabase
    .from("event_photos")
    .select("*")
    .eq("event_id", id)
    .order("sort_order", { ascending: true });

  // Fetch total participant count (bookings + companions)
  const { data: totalParticipants } = await supabase.rpc("get_total_participants", {
    p_event_id: id,
  });
  const bookingCount = totalParticipants || 0;

  // Fetch organizer event count
  const { count: orgEventCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("organizer_id", event.organizer_id)
    .eq("status", "published");

  // Fetch badges for this event
  const { data: badgeData } = await supabase
    .from("badges")
    .select("id, title, image_url")
    .eq("event_id", id);

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Check if user already has an active booking for this event
  let userBooking: { id: string; status: string; payment_status: string } | null = null;
  if (authUser) {
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id, status, payment_status")
      .eq("event_id", id)
      .eq("user_id", authUser.id)
      .in("status", ["pending", "confirmed"])
      .single();
    userBooking = existingBooking;
  }

  const eventBadges = badgeData || [];
  let earnedBadgeIds = new Set<string>();

  if (authUser && eventBadges.length > 0) {
    const { data: userBadgeData } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", authUser.id)
      .in(
        "badge_id",
        eventBadges.map((b) => b.id),
      );

    earnedBadgeIds = new Set((userBadgeData || []).map((ub) => ub.badge_id));
  }

  // Fetch event reviews
  const { data: reviews } = await supabase
    .from("event_reviews")
    .select("id, rating, text, created_at, user_id, users(full_name, avatar_url, username)")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const eventReviews = (reviews || []) as any[];
  const avgRating =
    eventReviews.length > 0
      ? eventReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / eventReviews.length
      : 0;

  // Fetch guides for hiking events
  let eventGuides: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    avg_rating: number | null;
    review_count: number;
  }[] = [];

  if (event.type === "hiking") {
    const { data: eventGuideRows } = await supabase
      .from("event_guides")
      .select("guide_id")
      .eq("event_id", id);

    if (eventGuideRows && eventGuideRows.length > 0) {
      const guideIds = eventGuideRows.map((eg) => eg.guide_id);

      const [{ data: guides }, { data: reviewAggs }] = await Promise.all([
        supabase.from("guides").select("id, full_name, avatar_url, bio").in("id", guideIds),
        supabase.from("guide_reviews").select("guide_id, rating").in("guide_id", guideIds),
      ]);

      // Aggregate reviews per guide
      const reviewMap = new Map<string, { sum: number; count: number }>();
      for (const r of reviewAggs || []) {
        const entry = reviewMap.get(r.guide_id) || { sum: 0, count: 0 };
        entry.sum += r.rating;
        entry.count += 1;
        reviewMap.set(r.guide_id, entry);
      }

      eventGuides = (guides || []).map((g) => {
        const agg = reviewMap.get(g.id);
        return {
          id: g.id,
          full_name: g.full_name,
          avatar_url: g.avatar_url,
          bio: g.bio,
          avg_rating: agg ? agg.sum / agg.count : null,
          review_count: agg ? agg.count : 0,
        };
      });
    }
  }

  // Fetch mountains for hiking events
  let eventMountains: {
    mountain_id: string;
    name: string;
    province: string;
    difficulty_level: number;
    elevation_masl: number | null;
    route_name: string | null;
    difficulty_override: number | null;
    sort_order: number;
  }[] = [];

  if (event.type === "hiking") {
    const { data: emRows } = await supabase
      .from("event_mountains")
      .select("mountain_id, route_name, difficulty_override, sort_order")
      .eq("event_id", id)
      .order("sort_order");

    if (emRows && emRows.length > 0) {
      const mountainIds = emRows.map((em) => em.mountain_id);
      const { data: mountains } = await supabase
        .from("mountains")
        .select("id, name, province, difficulty_level, elevation_masl")
        .in("id", mountainIds);

      const mountainMap = new Map((mountains || []).map((m) => [m.id, m]));

      eventMountains = emRows.map((em) => {
        const mountain = mountainMap.get(em.mountain_id);
        return {
          mountain_id: em.mountain_id,
          name: mountain?.name ?? "",
          province: mountain?.province ?? "",
          difficulty_level: mountain?.difficulty_level ?? 0,
          elevation_masl: mountain?.elevation_masl ?? null,
          route_name: em.route_name,
          difficulty_override: em.difficulty_override,
          sort_order: em.sort_order,
        };
      });
    }
  }

  // Check if current user can review (checked in + hasn't reviewed)
  let canReview = false;
  if (authUser && event.status === "completed") {
    const { data: userCheckin } = await supabase
      .from("event_checkins")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", authUser.id)
      .single();

    if (userCheckin) {
      const hasReviewed = eventReviews.some((r: any) => r.user_id === authUser.id);
      canReview = !hasReviewed;
    }
  }

  const spotsLeft = event.max_participants - bookingCount;
  const formattedDate = formatEventDate(event.date, event.end_date, {
    includeTime: true,
    includeYear: true,
  });

  const organizer = event.organizer_profiles as any;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Image */}
      <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-lime-100 to-forest-100 dark:from-lime-900 dark:to-forest-900 mb-8">
        {event.cover_image_url && (
          <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UIBadge variant={event.type as any}>{typeLabels[event.type] || event.type}</UIBadge>
              {event.difficulty_level && <DifficultyBadge level={event.difficulty_level} />}
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
              <span>{formattedDate}</span>
              <span>{event.location}</span>
              <span className="hidden sm:block text-gray-300 dark:text-gray-600">|</span>
              <ShareButtons title={event.title} eventId={id} />
            </div>
          </div>

          {event.description && (
            <div>
              <h2 className="text-xl font-heading font-bold mb-3">About This Event</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          <EventGallery photos={photos || []} />

          {event.coordinates &&
            typeof event.coordinates === "object" &&
            "lat" in event.coordinates && (
              <EventLocationMap
                lat={(event.coordinates as { lat: number; lng: number }).lat}
                lng={(event.coordinates as { lat: number; lng: number }).lng}
                label={event.location}
              />
            )}
          {/* Reviews Section */}
          {(eventReviews.length > 0 || canReview) && (
            <div>
              <h2 className="text-xl font-heading font-bold mb-4">Reviews</h2>
              {canReview && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-5 mb-6">
                  <ReviewForm eventId={id} />
                </div>
              )}
              <ReviewList reviews={eventReviews} averageRating={avgRating} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-6 space-y-4 mb-4">
            {distances && distances.length > 0 ? (
              <>
                <div className="text-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Starting at</span>
                  <br />
                  <span className="text-3xl font-bold text-lime-600 dark:text-lime-400">
                    {`\u20B1${Math.min(...distances.map((d) => d.price)).toLocaleString()}`}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700" />

                <div className="space-y-2">
                  {distances.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {d.label || `${d.distance_km}K`}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {`\u20B1${d.price.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700" />
              </>
            ) : (
              <div className="text-center">
                <span className="text-3xl font-bold text-lime-600 dark:text-lime-400">
                  {event.price === 0 ? "Free" : `\u20B1${event.price.toLocaleString()}`}
                </span>
              </div>
            )}

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{bookingCount}</span>{" "}
              adventurer{bookingCount === 1 ? "" : "s"} joined
              {" \u00B7 "}
              <span className={spotsLeft <= 5 ? "text-red-500 font-medium" : ""}>
                {spotsLeft <= 0 ? "Fully booked" : `${spotsLeft} spots left`}
              </span>
            </div>

            {avgRating > 0 && (
              <div className="text-center text-sm">
                <span className="text-yellow-400">&#9733;</span>{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-gray-400 dark:text-gray-500">
                  {" "}
                  ({eventReviews.length} review{eventReviews.length === 1 ? "" : "s"})
                </span>
              </div>
            )}

            <div className="pt-2">
              <BookingButton
                eventId={id}
                spotsLeft={spotsLeft}
                price={event.price}
                isPast={event.status === "completed"}
                userBooking={userBooking}
              />
            </div>
          </div>

          {organizer && (
            <OrganizerCard
              organizerId={event.organizer_id}
              orgName={organizer.org_name}
              logoUrl={organizer.logo_url}
              eventCount={orgEventCount || 0}
            />
          )}

          {eventMountains.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-6">
              <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
                <span className="text-lg">⛰️</span>
                {eventMountains.length === 1
                  ? "Mountain"
                  : `Mountains (${eventMountains.length} peaks)`}
              </h3>
              {event.difficulty_level && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-500">Overall Difficulty:</span>
                  <DifficultyBadge level={event.difficulty_level} />
                </div>
              )}
              <div className="space-y-3">
                {eventMountains.map((m, i) => (
                  <div
                    key={m.mountain_id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <span className="text-sm font-bold text-gray-400 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{m.name}</span>
                        <DifficultyBadge level={m.difficulty_override ?? m.difficulty_level} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{m.province}</span>
                        {m.elevation_masl && (
                          <>
                            <span>·</span>
                            <span>{m.elevation_masl.toLocaleString()} MASL</span>
                          </>
                        )}
                        {m.route_name && (
                          <>
                            <span>·</span>
                            <span>{m.route_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventGuides.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-6">
              <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
                <LocationPinIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Guide{eventGuides.length === 1 ? "" : "s"}
              </h3>
              <div className="space-y-3">
                {eventGuides.map((guide) => (
                  <GuideCard
                    key={guide.id}
                    id={guide.id}
                    full_name={guide.full_name}
                    avatar_url={guide.avatar_url}
                    bio={guide.bio}
                    avg_rating={guide.avg_rating}
                    review_count={guide.review_count}
                  />
                ))}
              </div>
            </div>
          )}

          {eventBadges.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-6">
              <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
                <span>&#127942;</span> Badge{eventBadges.length === 1 ? "" : "s"}
              </h3>
              <div className="space-y-3">
                {eventBadges.map((badge) => {
                  const resolved = resolvePresetImage(badge.image_url);
                  const earned = earnedBadgeIds.has(badge.id);
                  return (
                    <Link
                      key={badge.id}
                      href={`/badges/${badge.id}`}
                      className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full ${resolved?.type === "emoji" ? resolved.color : "bg-gray-100 dark:bg-gray-800"} flex items-center justify-center overflow-hidden flex-shrink-0`}
                      >
                        {resolved?.type === "url" ? (
                          <Image
                            src={resolved.url}
                            alt={badge.title}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xl">
                            {resolved?.type === "emoji" ? resolved.emoji : "\u{1F3C6}"}
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-sm">{badge.title}</span>
                      {authUser && earned && (
                        <span className="ml-auto text-xs text-teal-600 dark:text-teal-400 font-medium">
                          Earned
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
