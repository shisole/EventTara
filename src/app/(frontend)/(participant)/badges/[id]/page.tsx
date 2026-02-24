import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import ReviewForm from "@/components/reviews/ReviewForm";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES, CATEGORY_STYLES } from "@/lib/constants/badge-rarity";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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

  const { data: badge } = await supabase
    .from("badges")
    .select("title, description, image_url, events(title)")
    .eq("id", id)
    .single();

  if (!badge) return { title: "Badge Not Found" };

  const event = (badge as any).events;
  const title = `${badge.title} — EventTara Badge`;
  const description =
    badge.description || `Badge earned at ${event?.title || "an event"} on EventTara.`;

  const hasRealImage = badge.image_url && !badge.image_url.startsWith("preset:");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      ...(hasRealImage && {
        images: [{ url: badge.image_url, width: 400, height: 400, alt: badge.title }],
      }),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(hasRealImage && { images: [badge.image_url] }),
    },
  };
}

export default async function BadgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch badge with event info
  const { data: badge } = await supabase
    .from("badges")
    .select("*, events(id, title, type, date, cover_image_url)")
    .eq("id", id)
    .single();

  if (!badge) notFound();

  const event = (badge as any).events;

  const rarityStyle = RARITY_STYLES[(badge.rarity) || "common"];
  const categoryStyle = badge.category
    ? CATEGORY_STYLES[badge.category]
    : null;

  // Fetch participants who earned this badge
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("awarded_at, users(id, full_name, avatar_url, username)")
    .eq("badge_id", id)
    .order("awarded_at", { ascending: false });

  // Check if current user can review the event
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let canReview = false;
  let hasReviewed = false;
  if (authUser && event) {
    // Check event is completed
    const { data: fullEvent } = await supabase
      .from("events")
      .select("status")
      .eq("id", event.id)
      .single();

    if (fullEvent?.status === "completed") {
      const { data: checkin } = await supabase
        .from("event_checkins")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", authUser.id)
        .single();

      if (checkin) {
        const { data: existingReview } = await supabase
          .from("event_reviews")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", authUser.id)
          .single();

        hasReviewed = !!existingReview;
        canReview = !hasReviewed;
      }
    }
  }

  const participants = (userBadges || []).map((ub: any) => ({
    id: ub.users?.id,
    fullName: ub.users?.full_name || "Participant",
    avatarUrl: ub.users?.avatar_url,
    username: ub.users?.username,
  }));

  const maxVisible = 12;
  const visibleParticipants = participants.slice(0, maxVisible);
  const overflow = participants.length - maxVisible;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Badge Hero */}
      <div className="flex flex-col items-center text-center space-y-4">
        {(() => {
          const resolved = resolvePresetImage(badge.image_url);
          return (
            <div
              className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center overflow-hidden shadow-lg",
                resolved?.type === "emoji" ? resolved.color : "bg-golden-100",
                rarityStyle.ring,
                rarityStyle.glow,
              )}
            >
              {resolved?.type === "url" ? (
                <Image
                  src={resolved.url}
                  alt={badge.title}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <span className="text-6xl">
                  {resolved?.type === "emoji" ? resolved.emoji : "\u{1F3C6}"}
                </span>
              )}
            </div>
          );
        })()}

        <h1 className="text-2xl font-heading font-bold">{badge.title}</h1>

        <div className="flex items-center gap-2 justify-center">
          {badge.rarity && badge.rarity !== "common" && (
            <span
              className={cn(
                "inline-block text-xs px-2.5 py-1 rounded-full font-medium",
                rarityStyle.pill,
              )}
            >
              {rarityStyle.label}
            </span>
          )}
          {categoryStyle && (
            <span
              className={cn("inline-block text-xs px-2.5 py-1 rounded-full", categoryStyle.pill)}
            >
              {categoryStyle.label}
            </span>
          )}
        </div>

        {badge.description && (
          <p className="text-gray-600 dark:text-gray-400 max-w-md">{badge.description}</p>
        )}

        <p className="text-sm text-gray-400 dark:text-gray-500">
          Created{" "}
          {new Date(badge.created_at).toLocaleDateString("en-PH", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Event Link */}
      {event && (
        <Link
          href={`/events/${event.id}`}
          className="block bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
              {event.cover_image_url ? (
                <Image
                  src={event.cover_image_url}
                  alt={event.title}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  &#127967;
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold truncate">{event.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                  {typeLabels[event.type] || event.type}
                </span>
                {event.date && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(event.date).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Earned By */}
      <div>
        <h2 className="text-lg font-heading font-bold mb-4 text-center">
          Earned by {participants.length} participant{participants.length === 1 ? "" : "s"}
        </h2>

        {participants.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-3">
            {visibleParticipants.map((p) => (
              <Link
                key={p.id}
                href={p.username ? `/profile/${p.username}` : "#"}
                title={p.fullName}
                className="flex flex-col items-center gap-1 w-16"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                  {p.avatarUrl ? (
                    <Image
                      src={p.avatarUrl}
                      alt={p.fullName}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg text-gray-400">
                      {p.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                  {p.fullName.split(" ")[0]}
                </span>
              </Link>
            ))}
            {overflow > 0 && (
              <div className="flex flex-col items-center gap-1 w-16">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  +{overflow}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">more</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No one has earned this badge yet.
          </p>
        )}
      </div>

      {/* Leave a Review */}
      {canReview && event && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
          <h2 className="text-lg font-heading font-bold mb-4 text-center">
            How was {event.title}?
          </h2>
          <ReviewForm eventId={event.id} />
        </div>
      )}

      {hasReviewed && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          You&apos;ve already reviewed this event. Thanks!
        </p>
      )}

      {/* Back link */}
      <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-800">
        <Link href="/events" className="text-teal-600 dark:text-teal-400 hover:underline text-sm">
          Explore Events
        </Link>
      </div>
    </div>
  );
}
