import Link from "next/link";

import EventGallery from "@/components/events/EventGallery";
import EventItinerary from "@/components/events/EventItinerary";
import { ChevronRightIcon, GoogleDriveIcon } from "@/components/icons";
import EventLocationMap from "@/components/maps/EventLocationMap";
import ReviewForm from "@/components/reviews/ReviewForm";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewPromptTrigger from "@/components/reviews/ReviewPromptTrigger";
import SelfCheckinPrompt from "@/components/reviews/SelfCheckinPrompt";
import EventRouteSection from "@/components/strava/EventRouteSection";
import { enrichReviewsWithBorders } from "@/lib/data/enrich-borders";
import { cdnUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

interface EventBelowFoldProps {
  eventId: string;
  eventStatus: string;
  coordinates: { lat: number; lng: number } | null;
  location: string;
  driveFolderUrl: string | null;
}

export default async function EventBelowFold({
  eventId,
  eventStatus,
  coordinates,
  location,
  driveFolderUrl,
}: EventBelowFoldProps) {
  const supabase = await createClient();

  const [
    { data: photos },
    { data: itineraryRows },
    { data: eventRoute },
    { data: reviews },
    {
      data: { user: authUser },
    },
  ] = await Promise.all([
    supabase
      .from("event_photos")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("event_itinerary")
      .select("id, time, title, sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("event_routes")
      .select("name, summary_polyline, distance, elevation_gain, source")
      .eq("event_id", eventId)
      .single(),
    supabase
      .from("event_reviews")
      .select(
        "id, rating, text, tags, created_at, user_id, users(full_name, avatar_url, username, active_border_id), event_review_photos(id, image_url, sort_order)",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const eventReviews = await enrichReviewsWithBorders(supabase, (reviews || []) as any[]);
  const avgRating =
    eventReviews.length > 0
      ? eventReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / eventReviews.length
      : 0;

  // Check if current user can review or self-check-in
  let canReview = false;
  let canSelfCheckin = false;
  if (authUser && eventStatus === "completed") {
    const hasReviewed = eventReviews.some((r: any) => r.user_id === authUser.id);

    if (!hasReviewed) {
      const { data: userCheckin } = await supabase
        .from("event_checkins")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", authUser.id)
        .single();

      if (userCheckin) {
        canReview = true;
      } else {
        canSelfCheckin = true;
      }
    }
  }

  const itineraryEntries = itineraryRows ?? [];

  return (
    <>
      <EventItinerary entries={itineraryEntries} />

      <EventGallery
        photos={(photos || []).map((p) => ({
          ...p,
          image_url: cdnUrl(p.image_url) ?? p.image_url,
        }))}
      />

      <div className="flex items-center justify-between">
        <Link
          href={`/events/${eventId}/photos`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-lime-600 dark:text-lime-400 hover:underline"
        >
          {(photos?.length ?? 0) > 0
            ? `View all ${photos?.length} photo${photos?.length === 1 ? "" : "s"}`
            : "Share your photos"}
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {driveFolderUrl &&
        (authUser ? (
          <a
            href={driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="-mt-2 flex items-center gap-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 px-4 py-3 transition-colors hover:bg-teal-100 dark:hover:bg-teal-900/30"
          >
            <GoogleDriveIcon className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                View Event Media
              </span>
              <p className="text-xs text-teal-600/70 dark:text-teal-400/70">
                Drone shots, videos &amp; more
              </p>
            </div>
            <svg
              className="w-4 h-4 text-teal-500 dark:text-teal-400 ml-auto shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          </a>
        ) : (
          <Link
            href="/login"
            className="-mt-2 flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <GoogleDriveIcon className="w-5 h-5 shrink-0 opacity-40" />
            <div className="min-w-0">
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                View Event Media
              </span>
              <p className="text-xs text-gray-400/70 dark:text-gray-500/70">
                Log in to access drone shots, videos &amp; more
              </p>
            </div>
            <svg
              className="w-4 h-4 text-gray-400 dark:text-gray-500 ml-auto shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </Link>
        ))}

      {coordinates && (
        <EventLocationMap lat={coordinates.lat} lng={coordinates.lng} label={location} />
      )}

      {eventRoute?.summary_polyline && (
        <EventRouteSection
          name={eventRoute.name}
          polyline={eventRoute.summary_polyline}
          distance={eventRoute.distance}
          elevationGain={eventRoute.elevation_gain}
          source={eventRoute.source}
        />
      )}

      {/* Reviews Section */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4">Reviews</h2>
        {canReview && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-5 mb-6">
            <ReviewForm eventId={eventId} />
          </div>
        )}
        {canSelfCheckin && <SelfCheckinPrompt eventId={eventId} eventTitle="" />}
        <ReviewList
          reviews={eventReviews}
          averageRating={avgRating}
          currentUserId={authUser?.id}
          eventId={eventId}
        />
      </div>

      {canReview && <ReviewPromptTrigger eventId={eventId} eventTitle="" />}
    </>
  );
}
