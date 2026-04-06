import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import BookingButton from "@/components/events/BookingButton";
import DifficultyBadge from "@/components/events/DifficultyBadge";
import LiveBookingCount from "@/components/events/LiveBookingCount";
import MobileBookingBar from "@/components/events/MobileBookingBar";
import OrganizerCard from "@/components/events/OrganizerCard";
import ShareButtons from "@/components/events/ShareButtons";
import { Breadcrumbs, DemoBadge, Skeleton, SkeletonText, UIBadge } from "@/components/ui";
import { isPaymentPauseEnabled } from "@/lib/cms/cached";
import { ACTIVITY_TYPE_LABELS } from "@/lib/constants/activity-types";
import { BreadcrumbTitle } from "@/lib/contexts/BreadcrumbContext";
import { cdnUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/format-date";

import EventBelowFold from "./_components/EventBelowFold";
import EventSidebarExtras from "./_components/EventSidebarExtras";

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
    : `Join this ${ACTIVITY_TYPE_LABELS[event.type as keyof typeof ACTIVITY_TYPE_LABELS] || event.type} adventure on EventTara!`;

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

/** Skeleton for below-fold main content while streaming */
function BelowFoldSkeleton() {
  return (
    <div className="space-y-8">
      {/* Gallery skeleton */}
      <div>
        <Skeleton className="h-6 w-32 mb-4 rounded" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
      {/* Map skeleton */}
      <Skeleton className="h-64 rounded-xl" />
      {/* Reviews skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 rounded" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton for sidebar extras while streaming */
function SidebarExtrasSkeleton() {
  return (
    <div className="space-y-8">
      {/* Weather card skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-6 space-y-3">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      {/* Badges skeleton */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-6 space-y-3">
        <Skeleton className="h-5 w-24 rounded" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <SkeletonText className="w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // ── Above-fold data: fetch in parallel ──
  const [{ data: event }, { data: distances }, { data: totalParticipants }, authResult] =
    await Promise.all([
      supabase.from("events").select("*, clubs(id, name, slug, logo_url)").eq("id", id).single(),
      supabase
        .from("event_distances")
        .select("id, distance_km, label, price, max_participants")
        .eq("event_id", id)
        .order("distance_km", { ascending: true }),
      supabase.rpc("get_total_participants", { p_event_id: id }),
      supabase.auth.getUser(),
    ]);

  if (!event || (event.status !== "published" && event.status !== "completed")) {
    notFound();
  }

  const authUser = authResult.data.user;
  const bookingCount = totalParticipants || 0;

  const club = event.clubs as {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;

  // Parallel: booking state + org event count + payment pause flag
  const [bookingResult, { count: orgEventCount }, paymentPauseFlagEnabled, membershipResult] =
    await Promise.all([
      authUser
        ? supabase
            .from("bookings")
            .select("id, status, payment_status")
            .eq("event_id", id)
            .eq("user_id", authUser.id)
            .in("status", ["pending", "confirmed"])
            .single()
        : Promise.resolve({ data: null }),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("club_id", event.club_id)
        .eq("status", "published"),
      isPaymentPauseEnabled(),
      event.members_only && authUser && club
        ? supabase
            .from("club_members")
            .select("id")
            .eq("club_id", club.id)
            .eq("user_id", authUser.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const userBooking = bookingResult.data;
  const isMembersOnly = event.members_only;
  const isMember = !!membershipResult.data;
  const effectivePaymentPaused = paymentPauseFlagEnabled && event.payment_paused;
  const spotsLeft = event.max_participants - bookingCount;
  const formattedDate = formatEventDate(event.date, event.end_date, {
    includeTime: true,
    includeYear: true,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";

  // Parse coordinates for child components
  const coords =
    event.coordinates && typeof event.coordinates === "object" && "lat" in event.coordinates
      ? (event.coordinates as { lat: number; lng: number })
      : null;

  // JSON-LD (no rating data needed — SEO bots will see streamed content)
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    startDate: event.date,
    ...(event.end_date && { endDate: event.end_date }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location,
      ...(coords && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: coords.lat,
          longitude: coords.lng,
        },
      }),
    },
    ...(event.cover_image_url && { image: event.cover_image_url }),
    organizer: club
      ? {
          "@type": "Organization",
          name: club.name,
          ...(club.logo_url && { logo: club.logo_url }),
          url: `${siteUrl}/clubs/${club.slug}`,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: event.price,
      priceCurrency: "PHP",
      availability: spotsLeft <= 0 ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${siteUrl}/events/${id}`,
      validFrom: event.created_at,
    },
    url: `${siteUrl}/events/${id}`,
    maximumAttendeeCapacity: event.max_participants,
    remainingAttendeeCapacity: Math.max(spotsLeft, 0),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Events", item: `${siteUrl}/events` },
      { "@type": "ListItem", position: 3, name: event.title, item: `${siteUrl}/events/${id}` },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-4 md:pb-8">
      <BreadcrumbTitle title={event.title} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Breadcrumbs />

      {/* Hero Image */}
      <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-lime-100 to-forest-100 dark:from-lime-900 dark:to-forest-900 mb-8">
        {event.cover_image_url && (
          <Image
            src={cdnUrl(event.cover_image_url) ?? event.cover_image_url}
            alt={event.title}
            fill
            className="object-cover"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <UIBadge variant={event.type as any}>
                {ACTIVITY_TYPE_LABELS[event.type as keyof typeof ACTIVITY_TYPE_LABELS] ||
                  event.type}
              </UIBadge>
              {event.difficulty_level && <DifficultyBadge level={event.difficulty_level} />}
              {event.is_demo && <DemoBadge />}
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

          {/* Streamed: gallery, maps, reviews */}
          <Suspense fallback={<BelowFoldSkeleton />}>
            <EventBelowFold
              eventId={id}
              eventStatus={event.status}
              coordinates={coords}
              location={event.location}
              driveFolderUrl={event.drive_folder_url}
            />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 space-y-8">
          <div
            id="booking-card"
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-6 space-y-4 mb-4"
          >
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

            {effectivePaymentPaused && event.price > 0 && (
              <div className="text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Payments offline &mdash; reserve &amp; pay later
                </span>
              </div>
            )}

            <LiveBookingCount
              eventId={id}
              maxParticipants={event.max_participants}
              initialCount={bookingCount}
            />

            <div className="pt-2">
              <BookingButton
                eventId={id}
                spotsLeft={spotsLeft}
                price={event.price}
                isPast={event.status === "completed"}
                userBooking={userBooking}
                membersOnly={isMembersOnly}
                isMember={isMember}
                clubSlug={club?.slug}
                clubName={club?.name}
              />
            </div>
          </div>

          {club && (
            <OrganizerCard
              clubSlug={club.slug}
              orgName={club.name}
              logoUrl={club.logo_url ?? null}
              eventCount={orgEventCount || 0}
            />
          )}

          {/* Streamed: weather, mountains, guides, badges */}
          <Suspense fallback={<SidebarExtrasSkeleton />}>
            <EventSidebarExtras
              eventId={id}
              eventType={event.type}
              eventDate={event.date}
              eventDifficultyLevel={event.difficulty_level}
              coordinates={coords}
              location={event.location}
            />
          </Suspense>
        </div>
      </div>

      <MobileBookingBar
        eventId={id}
        price={event.price}
        spotsLeft={spotsLeft}
        isPast={event.status === "completed"}
        distances={(distances || []).map((d) => ({
          id: d.id,
          distance_km: d.distance_km,
          label: d.label,
          price: d.price,
        }))}
        userBooking={userBooking}
        membersOnly={isMembersOnly}
        isMember={isMember}
        clubSlug={club?.slug}
        clubName={club?.name}
      />
    </div>
  );
}
