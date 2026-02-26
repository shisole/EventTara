import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckCircleIcon, LockIcon } from "@/components/icons";
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

  // Build a map: badge_id -> awarded_at
  const earnedMap = new Map((earnedBadges ?? []).map((b) => [b.badge_id, b.awarded_at]));

  const badges = systemBadges ?? [];
  const earnedCount = badges.filter((b) => earnedMap.has(b.id)).length;
  const totalCount = badges.length;
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-heading font-bold mb-2">Achievements</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {earnedCount} / {totalCount} badges earned
        </p>

        {/* Progress bar */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {badges.map((badge) => {
          const isEarned = earnedMap.has(badge.id);
          const awardedAt = earnedMap.get(badge.id);
          const resolved = resolvePresetImage(badge.image_url);
          const rarity = badge.rarity;
          const category = badge.category ?? null;
          const rarityStyle = RARITY_STYLES[rarity];
          const categoryStyle = category ? CATEGORY_STYLES[category] : null;
          const hint = badge.criteria_key ? SYSTEM_BADGE_CRITERIA_HINTS[badge.criteria_key] : null;

          const card = (
            <div
              className={cn(
                "rounded-2xl p-4 text-center transition-shadow",
                isEarned
                  ? "bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-950/30 hover:shadow-lg"
                  : "bg-gray-50 dark:bg-gray-900/50",
              )}
            >
              {/* Badge circle */}
              <div
                className={cn(
                  "w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center overflow-hidden",
                  isEarned
                    ? cn(
                        resolved?.type === "emoji" ? resolved.color : "bg-golden-100",
                        rarityStyle.ring,
                        rarityStyle.glow,
                      )
                    : "bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-300 dark:ring-gray-600",
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
                  "font-heading font-bold text-sm",
                  !isEarned && "text-gray-400 dark:text-gray-500",
                )}
              >
                {badge.title}
              </h3>

              {/* Description or hint */}
              {isEarned ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{badge.description}</p>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{hint}</p>
              )}

              {/* Category pill */}
              {categoryStyle && (
                <span
                  className={cn(
                    "inline-block text-xs px-2 py-0.5 rounded-full mt-2",
                    isEarned
                      ? categoryStyle.pill
                      : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                  )}
                >
                  {categoryStyle.label}
                </span>
              )}

              {/* Earned / Locked indicator */}
              {isEarned && awardedAt ? (
                <p className="flex items-center justify-center gap-1 text-xs text-forest-600 dark:text-forest-400 mt-2">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Earned on{" "}
                  {new Date(awardedAt).toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              ) : (
                <p className="flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-2">
                  <LockIcon className="w-3.5 h-3.5" />
                  Locked
                </p>
              )}
            </div>
          );

          // Earned badges link to detail page; locked badges are not clickable
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

      {/* Empty state */}
      {badges.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-2">{"\u{1F3C6}"}</p>
          <p className="text-gray-500 dark:text-gray-400">
            No system badges available yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
