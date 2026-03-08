"use client";

import Image from "next/image";
import Link from "next/link";

import { resolvePresetImage } from "@/lib/constants/avatars";
import { type BadgeRarity, RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";

interface ShowcaseBadge {
  id: string;
  title: string;
  image_url: string | null;
  rarity: string;
  awarded_at?: string;
}

interface BadgeShowcaseProps {
  badges: ShowcaseBadge[];
  isOwnProfile: boolean;
  onConfigureClick?: () => void;
}

const RARITY_MAP: Record<string, (typeof RARITY_STYLES)[BadgeRarity]> = { ...RARITY_STYLES };

export default function BadgeShowcase({
  badges,
  isOwnProfile,
  onConfigureClick,
}: BadgeShowcaseProps) {
  if (badges.length === 0) return null;

  const displayBadges = badges.slice(0, 8);

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold">Featured Badges</h2>
        {isOwnProfile && (
          <button
            onClick={onConfigureClick}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            Configure
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 md:grid-cols-8">
        {displayBadges.map((badge) => {
          const resolved = resolvePresetImage(badge.image_url);
          const rarityStyle = RARITY_MAP[badge.rarity];

          return (
            <Link key={badge.id} href={`/badges/${badge.id}`} className="group">
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center overflow-hidden rounded-full sm:h-20 sm:w-20",
                  "cursor-pointer transition-transform hover:scale-110",
                  rarityStyle?.ring,
                  rarityStyle?.glow,
                )}
              >
                {resolved?.type === "url" ? (
                  <Image
                    src={resolved.url}
                    alt={badge.title}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl">{resolved?.emoji ?? "\u{1F3C5}"}</span>
                )}
              </div>
              <p className="mt-1 truncate text-center text-xs group-hover:text-teal-600">
                {badge.title}
              </p>
            </Link>
          );
        })}
      </div>

      {badges.length > 8 && (
        <Link
          href="/achievements"
          className="mt-4 block text-center text-sm font-semibold text-teal-600 hover:text-teal-700"
        >
          View all {badges.length} badges
        </Link>
      )}
    </section>
  );
}
