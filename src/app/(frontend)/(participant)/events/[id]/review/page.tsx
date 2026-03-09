import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import QuickReviewForm from "@/components/reviews/QuickReviewForm";
import { cdnUrl } from "@/lib/storage";
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
  const { data: event } = await supabase.from("events").select("title").eq("id", id).single();

  return {
    title: event ? `Review ${event.title}` : "Review Event",
    description: event
      ? `Share your experience at ${event.title} on EventTara.`
      : "Share your experience at this event.",
  };
}

export default async function EventReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/events/${id}/review`);
  }

  // Fetch event
  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, type, cover_image_url, status, location")
    .eq("id", id)
    .single();

  if (event?.status !== "completed") {
    notFound();
  }

  // Check if user checked in
  const { data: checkin } = await supabase
    .from("event_checkins")
    .select("id")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .single();

  if (!checkin) {
    notFound();
  }

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from("event_reviews")
    .select("id, rating, text, created_at")
    .eq("event_id", id)
    .eq("user_id", user.id)
    .single();

  const coverUrl = event.cover_image_url ? cdnUrl(event.cover_image_url) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Event Summary Card */}
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-950/20 mb-6">
          {coverUrl && (
            <div className="relative h-40 w-full">
              <Image
                src={coverUrl}
                alt={event.title}
                fill
                className="object-cover"
                sizes="(max-width: 512px) 100vw, 512px"
              />
            </div>
          )}
          <div className="p-4">
            <span className="inline-block rounded-full bg-teal-50 dark:bg-teal-950/30 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300 mb-2">
              {typeLabels[event.type] || event.type}
            </span>
            <h1 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
              {event.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatEventDate(event.date)}
              {event.location && ` \u00B7 ${event.location}`}
            </p>
          </div>
        </div>

        {/* Review Section */}
        {existingReview ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-950/20 p-6 text-center">
            <div className="text-3xl mb-2">&#9989;</div>
            <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-1">
              You&apos;ve already reviewed this event
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Thanks for sharing your experience!
            </p>
            <Link
              href={`/events/${id}`}
              className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              View event &rarr;
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-950/20 p-6">
            <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-4">
              How was your experience?
            </h2>
            <QuickReviewForm eventId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
