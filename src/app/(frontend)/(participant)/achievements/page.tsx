import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import AchievementsTabs from "@/components/achievements/AchievementsTabs";
import BordersTab from "@/components/achievements/BordersTab";
import LeaderboardsTab from "@/components/achievements/LeaderboardsTab";
import { CheckCircleIcon, LockIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/ui";
import { calculateBadgeProgress } from "@/lib/badges/calculate-progress";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { CATEGORY_STYLES, RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { SYSTEM_BADGE_CRITERIA_HINTS } from "@/lib/constants/system-badges";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Achievements — EventTara",
  description: "Track your outdoor adventure achievements on EventTara.",
};

export default async function AchievementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all system badges
  const { data: systemBadges } = await supabase
    .from("badges")
    .select("id, title, description, image_url, category, rarity, criteria_key")
    .eq("type", "system")
    .order("created_at");

  // Fetch user's earned badges
  const { data: earnedBadges } = await supabase
    .from("user_badges")
    .select("badge_id, awarded_at")
    .eq("user_id", user.id);

  // Fetch all borders
  const { data: allBorders } = await supabase
    .from("avatar_borders")
    .select("*")
    .order("sort_order");

  // Fetch user's earned borders
  const { data: earnedBordersData } = await supabase
    .from("user_avatar_borders")
    .select("border_id")
    .eq("user_id", user.id);

  const earnedBorderIds = new Set((earnedBordersData ?? []).map((b) => b.border_id));

  // Build a map: badge_id -> awarded_at
  const earnedMap = new Map((earnedBadges ?? []).map((b) => [b.badge_id, b.awarded_at]));

  const badges = systemBadges ?? [];
  const earnedCount = badges.filter((b) => earnedMap.has(b.id)).length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  // Calculate progress for locked badges
  const badgesWithProgress = await Promise.all(
    badges.map(async (badge) => {
      if (earnedMap.has(badge.id)) return { ...badge, progress: null };
      const progress = await calculateBadgeProgress(
        user.id,
        badge as Parameters<typeof calculateBadgeProgress>[1],
        supabase,
      );
      return { ...badge, progress };
    }),
  );

  // Sort earned badges to the top
  const sortedBadges = [...badgesWithProgress].sort((a, b) => {
    const aEarned = earnedMap.has(a.id) ? 0 : 1;
    const bEarned = earnedMap.has(b.id) ? 0 : 1;
    return aEarned - bEarned;
  });

  const badgesContent = (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {sortedBadges.map((badge) => {
          const isEarned = earnedMap.has(badge.id);
          const awardedAt = earnedMap.get(badge.id);
          const resolved = resolvePresetImage(badge.image_url);
          const rarity = badge.rarity;
          const category = badge.category;
          const rarityStyle = RARITY_STYLES[rarity];
          const categoryStyle = CATEGORY_STYLES[category];
          const hint = badge.criteria_key ? SYSTEM_BADGE_CRITERIA_HINTS[badge.criteria_key] : null;

          const card = (
            <div
              className={cn(
                "rounded-2xl p-4 text-center transition-shadow",
                isEarned
                  ? "bg-white shadow-md hover:shadow-lg dark:bg-gray-900 dark:shadow-gray-950/30"
                  : "bg-gray-50 dark:bg-gray-900/50",
              )}
            >
              {/* Badge circle */}
              <div
                className={cn(
                  "mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full",
                  isEarned
                    ? cn(
                        resolved?.type === "emoji" ? resolved.color : "bg-golden-100",
                        rarityStyle.ring,
                        rarityStyle.glow,
                      )
                    : "bg-gray-200 ring-2 ring-gray-300 dark:bg-gray-700 dark:ring-gray-600",
                )}
              >
                {resolved?.type === "url" ? (
                  <Image
                    src={resolved.url}
                    alt={badge.title}
                    width={80}
                    height={80}
                    className={cn("object-cover", !isEarned && "opacity-30 grayscale")}
                  />
                ) : (
                  <span className={cn("text-3xl", !isEarned && "opacity-30 grayscale")}>
                    {resolved?.type === "emoji" ? resolved.emoji : (badge.image_url ?? "\u{1F3C6}")}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className={cn(
                  "font-heading text-sm font-bold",
                  !isEarned && "text-gray-400 dark:text-gray-500",
                )}
              >
                {badge.title}
              </h3>

              {/* Description or hint */}
              {isEarned ? (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
              ) : (
                <p className="mt-1 text-xs italic text-gray-400 dark:text-gray-500">{hint}</p>
              )}

              {/* Progress bar for locked badges */}
              {!isEarned && badge.progress && (
                <div className="mt-2 w-full">
                  <div className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-teal-500 transition-all duration-300"
                      style={{ width: `${String(badge.progress.percent)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {badge.progress.progressText}
                  </p>
                </div>
              )}

              {/* Category pill */}
              <span
                className={cn(
                  "mt-2 inline-block rounded-full px-2 py-0.5 text-xs",
                  isEarned
                    ? categoryStyle.pill
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                )}
              >
                {categoryStyle.label}
              </span>

              {/* Earned / Locked indicator */}
              {isEarned && awardedAt ? (
                <p className="mt-2 flex items-center justify-center gap-1 text-xs text-forest-600 dark:text-forest-400">
                  <CheckCircleIcon className="h-3.5 w-3.5" />
                  Earned on{" "}
                  {new Date(awardedAt).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              ) : badge.progress ? null : (
                <p className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <LockIcon className="h-3.5 w-3.5" />
                  Locked
                </p>
              )}
            </div>
          );

          if (isEarned) {
            return (
              <Link key={badge.id} href={`/badges/${badge.id}`} className="block">
                {card}
              </Link>
            );
          }

          return <div key={badge.id}>{card}</div>;
        })}
      </div>

      {badges.length === 0 && (
        <div className="py-16 text-center">
          <p className="mb-2 text-3xl">{"\u{1F3C6}"}</p>
          <p className="text-gray-500 dark:text-gray-400">
            No system badges available yet. Check back soon!
          </p>
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Breadcrumbs />
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="mb-2 font-heading text-3xl font-bold">Achievements</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {earnedCount} / {totalCount} badges earned
        </p>

        {/* Progress bar */}
        <div className="mx-auto mt-4 max-w-md">
          <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${String(progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      <AchievementsTabs
        badgesContent={badgesContent}
        bordersContent={<BordersTab borders={allBorders ?? []} earnedBorderIds={earnedBorderIds} />}
        leaderboardsContent={<LeaderboardsTab />}
      />
    </div>
  );
}
