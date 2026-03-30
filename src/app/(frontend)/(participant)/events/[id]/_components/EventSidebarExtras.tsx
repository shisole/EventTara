import Image from "next/image";
import Link from "next/link";

import DifficultyBadge from "@/components/events/DifficultyBadge";
import WeatherCard from "@/components/events/WeatherCard";
import GuideCard from "@/components/guides/GuideCard";
import { LocationPinIcon } from "@/components/icons";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { geocodeLocation } from "@/lib/geocode";
import { createClient } from "@/lib/supabase/server";
import { getWeatherForecast } from "@/lib/weather";

interface EventSidebarExtrasProps {
  eventId: string;
  eventType: string;
  eventDate: string;
  eventDifficultyLevel: number | null;
  coordinates: { lat: number; lng: number } | null;
  location: string;
}

export default async function EventSidebarExtras({
  eventId,
  eventType,
  eventDate,
  eventDifficultyLevel,
  coordinates,
  location,
}: EventSidebarExtrasProps) {
  const supabase = await createClient();

  // Parallel fetch: weather, badges, guides, mountains
  const coords = coordinates ?? (await geocodeLocation(location));

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [forecastResult, { data: badgeData }, guidesResult, mountainsResult] = await Promise.all([
    coords ? getWeatherForecast(coords.lat, coords.lng, eventDate) : Promise.resolve(null),
    supabase.from("badges").select("id, title, image_url").eq("event_id", eventId),
    eventType === "hiking"
      ? supabase.from("event_guides").select("guide_id").eq("event_id", eventId)
      : Promise.resolve({ data: null }),
    eventType === "hiking"
      ? supabase
          .from("event_mountains")
          .select("mountain_id, route_name, difficulty_override, sort_order")
          .eq("event_id", eventId)
          .order("sort_order")
      : Promise.resolve({ data: null }),
  ]);

  const forecast = forecastResult;
  const isLongRange = (() => {
    if (!forecast) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ed = new Date(eventDate + "T00:00:00");
    const diff = Math.ceil((ed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 8;
  })();

  // Resolve guides
  let eventGuides: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    avg_rating: number | null;
    review_count: number;
  }[] = [];

  const eventGuideRows = guidesResult.data;
  if (eventGuideRows && eventGuideRows.length > 0) {
    const guideIds = eventGuideRows.map((eg) => eg.guide_id);
    const [{ data: guides }, { data: reviewAggs }] = await Promise.all([
      supabase.from("guides").select("id, full_name, avatar_url, bio").in("id", guideIds),
      supabase.from("guide_reviews").select("guide_id, rating").in("guide_id", guideIds),
    ]);

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

  // Resolve mountains
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

  const emRows = mountainsResult.data;
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

  // Resolve earned badges
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

  // If nothing to show, render nothing
  if (
    !forecast &&
    eventMountains.length === 0 &&
    eventGuides.length === 0 &&
    eventBadges.length === 0
  ) {
    return null;
  }

  return (
    <>
      {forecast && <WeatherCard forecast={forecast} eventId={eventId} isLongRange={isLongRange} />}

      {eventMountains.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-5 sm:p-6">
          <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
            <span className="text-lg">⛰️</span>
            {eventMountains.length === 1
              ? "Mountain"
              : `Mountains (${eventMountains.length} peaks)`}
          </h3>
          {eventDifficultyLevel && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-gray-500">Overall Difficulty:</span>
              <DifficultyBadge level={eventDifficultyLevel} />
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
    </>
  );
}
