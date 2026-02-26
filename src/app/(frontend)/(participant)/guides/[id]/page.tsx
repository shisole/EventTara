import { notFound } from "next/navigation";

import EventCard from "@/components/events/EventCard";
import ReviewList from "@/components/reviews/ReviewList";
import StarRating from "@/components/reviews/StarRating";
import { Avatar } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface GuideEvent {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  price: number;
  cover_image_url: string | null;
  max_participants: number;
  booking_count: number;
  status: "upcoming" | "happening_now" | "past";
  organizer_name?: string;
}

interface GuideReview {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  users: { full_name: string; avatar_url: string | null; username: string | null };
}

function getEventStatus(eventDate: string, today: string): "upcoming" | "happening_now" | "past" {
  const dateOnly = eventDate.split("T")[0];
  if (dateOnly === today) return "happening_now";
  return dateOnly > today ? "upcoming" : "past";
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: guide } = await supabase
    .from("guides")
    .select("full_name, bio")
    .eq("id", id)
    .single();

  if (!guide) return { title: "Guide Not Found" };

  const description = guide.bio
    ? guide.bio.slice(0, 160)
    : `${guide.full_name} — Adventure guide on EventTara.`;

  return {
    title: `${guide.full_name} — Guide`,
    description,
    openGraph: {
      title: `${guide.full_name} — Guide`,
      description,
      type: "profile",
      siteName: "EventTara",
      url: `/guides/${id}`,
    },
    twitter: {
      card: "summary",
      title: `${guide.full_name} — Guide`,
      description,
    },
  };
}

export default async function GuideProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch guide
  const { data: guide, error } = await supabase.from("guides").select("*").eq("id", id).single();

  if (error || !guide) {
    notFound();
  }

  // Fetch events via event_guides join
  const { data: eventGuideRows } = await supabase
    .from("event_guides")
    .select("event_id")
    .eq("guide_id", id);

  const today = new Date().toISOString().split("T")[0];
  let upcomingEvents: GuideEvent[] = [];
  let pastEvents: GuideEvent[] = [];

  if (eventGuideRows && eventGuideRows.length > 0) {
    const eventIds = eventGuideRows.map((eg) => eg.event_id);
    const { data: eventData } = await supabase
      .from("events")
      .select("*, bookings(count), organizer_profiles!inner(org_name)")
      .in("id", eventIds)
      .in("status", ["published", "completed"])
      .order("date", { ascending: false });

    const allEvents: GuideEvent[] = (eventData || []).map((event) => ({
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      location: event.location,
      price: event.price,
      cover_image_url: event.cover_image_url,
      max_participants: event.max_participants,
      booking_count: (event.bookings as any)?.[0]?.count || 0,
      status: getEventStatus(event.date, today),
      organizer_name: (event.organizer_profiles as any)?.org_name ?? undefined,
    }));

    upcomingEvents = allEvents.filter(
      (e) => e.status === "upcoming" || e.status === "happening_now",
    );
    pastEvents = allEvents.filter((e) => e.status === "past");
  }

  // Fetch reviews with user info
  const { data: reviews } = await supabase
    .from("guide_reviews")
    .select("*, users(full_name, avatar_url, username, active_border_id)")
    .eq("guide_id", id)
    .order("created_at", { ascending: false });

  // Enrich reviews with border data
  const rawGuideReviews = (reviews || []) as any[];
  const guideReviewBorderIds = rawGuideReviews
    .map((r: any) => r.users?.active_border_id)
    .filter(Boolean) as string[];

  let guideBorderLookup = new Map<string, { tier: string; border_color: string | null }>();
  if (guideReviewBorderIds.length > 0) {
    const { data: borderDefs } = await supabase
      .from("avatar_borders")
      .select("id, tier, border_color")
      .in("id", guideReviewBorderIds);
    guideBorderLookup = new Map((borderDefs || []).map((b) => [b.id, b]));
  }

  const reviewList = rawGuideReviews.map((r: any) => {
    const borderId = r.users?.active_border_id;
    const border = borderId ? guideBorderLookup.get(borderId) : null;
    return {
      ...r,
      users: {
        ...r.users,
        active_border_tier: border?.tier ?? null,
        active_border_color: border?.border_color ?? null,
      },
    };
  }) as unknown as GuideReview[];

  // Calculate aggregate stats
  let avgRating = 0;
  if (reviewList.length > 0) {
    const sum = reviewList.reduce((acc, r) => acc + r.rating, 0);
    avgRating = sum / reviewList.length;
  }

  const totalEventsGuided = (eventGuideRows || []).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar src={guide.avatar_url} alt={guide.full_name} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">{guide.full_name}</h1>
            {avgRating > 0 && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <StarRating value={Math.round(avgRating)} readonly size="md" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({reviewList.length} review{reviewList.length === 1 ? "" : "s"})
                </span>
              </div>
            )}
            {guide.bio && (
              <p className="text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                {guide.bio}
              </p>
            )}
            {guide.contact_number && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span>{" "}
                <a
                  href={`tel:${guide.contact_number}`}
                  className="hover:text-lime-600 dark:hover:text-lime-400"
                >
                  {guide.contact_number}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 text-center">
          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{totalEventsGuided}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Events Guided</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 text-center">
          <p className="text-2xl font-bold text-golden-500">
            {avgRating > 0 ? avgRating.toFixed(1) : "--"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-4 text-center">
          <p className="text-2xl font-bold text-lime-600 dark:text-lime-400">{reviewList.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Reviews</p>
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-heading font-bold mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        </section>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-heading font-bold mb-4">Past Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        </section>
      )}

      {/* No Events */}
      {upcomingEvents.length === 0 && pastEvents.length === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-8 text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400">No events yet for this guide.</p>
        </div>
      )}

      {/* Reviews */}
      {reviewList.length > 0 && (
        <section>
          <h2 className="text-xl font-heading font-bold mb-4">Reviews</h2>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-gray-950/20 p-5 sm:p-6">
            <ReviewList reviews={reviewList} averageRating={avgRating} />
          </div>
        </section>
      )}
    </div>
  );
}
