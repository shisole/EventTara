import { NavLink } from "@/components/navigation/NavigationContext";
import { type BadgeProgress } from "@/lib/badges/calculate-progress";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { type BadgeRarity, RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";

export interface BadgeWithProgress {
  id: string;
  title: string;
  image_url: string | null;
  rarity: string;
  progress: BadgeProgress;
}

interface AchievementsProgressSectionProps {
  badges: BadgeWithProgress[];
}

function isValidRarity(rarity: string): rarity is BadgeRarity {
  return rarity in RARITY_STYLES;
}

function getRarityStyle(rarity: string) {
  return isValidRarity(rarity) ? RARITY_STYLES[rarity] : RARITY_STYLES.common;
}

export default function AchievementsProgressSection({ badges }: AchievementsProgressSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Achievements in Progress</h2>
        <NavLink
          href="/achievements"
          className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
        >
          See all &rarr;
        </NavLink>
      </div>

      <div className="space-y-3">
        {badges.map((badge) => {
          const resolved = resolvePresetImage(badge.image_url);
          const rarityStyle = getRarityStyle(badge.rarity);

          return (
            <div
              key={badge.id}
              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                {/* Badge icon */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm opacity-60",
                    resolved?.type === "emoji" ? resolved.color : "bg-gray-100 dark:bg-gray-700",
                  )}
                >
                  {resolved?.type === "emoji" ? resolved.emoji : "?"}
                </div>

                {/* Title + rarity */}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{badge.title}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                      rarityStyle.pill,
                    )}
                  >
                    {rarityStyle.label}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${Math.min(badge.progress.percent, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {badge.progress.progressText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
