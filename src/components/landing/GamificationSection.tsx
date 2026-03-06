import Image from "next/image";

import { StarIcon } from "@/components/icons";
import UserAvatar from "@/components/ui/UserAvatar";
import { isComingSoonEnabled } from "@/lib/cms/cached";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import { TIER_LABELS, TIER_LABEL_COLORS } from "@/lib/constants/avatar-borders";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import type { BadgeRarity } from "@/lib/constants/badge-rarity";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const RARITY_ORDER: Record<BadgeRarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

const BORDER_TIERS: BorderTier[] = ["common", "rare", "epic", "legendary"];

export default async function GamificationSection() {
  const showComingSoon = await isComingSoonEnabled();
  if (!showComingSoon) return null;

  const supabase = await createClient();

  const { data: badges } = await supabase
    .from("badges")
    .select("id, title, image_url, rarity, events!inner(title)")
    .limit(8);

  // Sort by rarity descending (legendary first) in JS since Supabase
  // cannot order by a custom enum ranking
  if (!badges || badges.length === 0) return null;

  const sortedBadges = [...badges].sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);

  return (
    <section className="relative py-12 bg-gray-50 dark:bg-slate-900">
      {/* Blurred content */}
      <div className="pointer-events-none select-none blur-[6px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white">
            Collect Badges, Unlock Borders
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto mt-4">
            Every event you complete earns you a unique badge. Collect enough and unlock exclusive
            avatar borders to show off your adventure status.
          </p>

          {/* Badge grid */}
          {sortedBadges.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-16">
              {sortedBadges.map((badge) => {
                const style = RARITY_STYLES[badge.rarity];
                const resolved = resolvePresetImage(badge.image_url);
                const eventTitle = badge.events.title;

                return (
                  <div
                    key={badge.id}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-2xl bg-gray-50 dark:bg-slate-700/50 p-5",
                      style.ring,
                      style.glow,
                    )}
                  >
                    {/* Badge image or emoji */}
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-sm">
                      {resolved?.type === "url" ? (
                        <Image
                          src={resolved.url}
                          alt={badge.title}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain"
                        />
                      ) : resolved?.type === "emoji" ? (
                        <span className="text-3xl" role="img" aria-label={badge.title}>
                          {resolved.emoji}
                        </span>
                      ) : (
                        <span className="text-3xl" role="img" aria-label={badge.title}>
                          🏅
                        </span>
                      )}
                    </div>

                    {/* Badge title */}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white text-center leading-tight">
                      {badge.title}
                    </span>

                    {/* Event name */}
                    {eventTitle && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center truncate max-w-full">
                        {eventTitle}
                      </span>
                    )}

                    {/* Rarity pill */}
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        style.pill,
                      )}
                    >
                      {style.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Avatar Border Tiers */}
          <div className="mb-12">
            <h3 className="text-xl font-heading font-semibold text-center text-gray-900 dark:text-white mb-8">
              Avatar Border Tiers
            </h3>
            <div className="grid grid-cols-2 justify-items-center sm:flex sm:flex-wrap sm:justify-center gap-8 sm:gap-12">
              {BORDER_TIERS.map((tier) => (
                <div key={tier} className="flex flex-col items-center gap-3 cursor-default">
                  <UserAvatar alt={`${TIER_LABELS[tier]} border`} size="lg" borderTier={tier} />
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                      TIER_LABEL_COLORS[tier],
                    )}
                  >
                    {TIER_LABELS[tier]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-lime-500 text-slate-900 font-semibold text-lg shadow-lg shadow-lime-500/25">
              Start Earning
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-2xl bg-white/90 px-8 py-5 shadow-lg backdrop-blur-sm dark:bg-gray-900/90">
          <div className="flex items-center gap-3">
            <StarIcon className="h-6 w-6 text-lime-500" />
            <div>
              <p className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                Coming Soon
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Badges & gamification are on the way
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
