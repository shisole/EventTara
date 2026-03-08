"use client";

import confetti from "canvas-confetti";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { resolvePresetImage } from "@/lib/constants/avatars";
import { type BadgeRarity, RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";

interface UnlockBadge {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  rarity: string;
}

interface StravaActivity {
  name: string;
  distance: number;
  date: string;
  strava_url: string;
}

interface BadgeUnlockModalProps {
  isOpen: boolean;
  badge: UnlockBadge | null;
  isBorder?: boolean;
  stravaActivities?: StravaActivity[];
  onClose: () => void;
  onShare?: () => void;
}

const RARITY_MAP: Record<string, (typeof RARITY_STYLES)[BadgeRarity]> = { ...RARITY_STYLES };

export default function BadgeUnlockModal({
  isOpen,
  badge,
  isBorder = false,
  stravaActivities = [],
  onClose,
  onShare,
}: BadgeUnlockModalProps) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (isOpen && !hasTriggered.current) {
      hasTriggered.current = true;
      void confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#84cc16", "#22d3ee", "#fbbf24", "#f472b6"],
      });
    }
    if (!isOpen) {
      hasTriggered.current = false;
    }
  }, [isOpen]);

  if (!isOpen || !badge) return null;

  const resolved = resolvePresetImage(badge.image_url);
  const rarityStyle = isBorder ? null : RARITY_MAP[badge.rarity];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center dark:bg-gray-900">
        {/* Badge/Border display */}
        <div
          className={cn(
            "mx-auto mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full",
            rarityStyle?.ring,
            rarityStyle?.glow,
          )}
        >
          {resolved?.type === "url" ? (
            <Image
              src={resolved.url}
              alt={badge.title}
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-6xl">{resolved?.emoji ?? "\u{1F3C5}"}</span>
          )}
        </div>

        {/* Celebration text */}
        <div className="mb-6">
          <p className="mb-2 text-4xl">{isBorder ? "\u{1F396}\u{FE0F}" : "\u{1F389}"}</p>
          <h3 className="mb-2 font-heading text-2xl font-bold">
            {isBorder ? "Border Unlocked!" : "Badge Earned!"}
          </h3>
          <p className="text-xl font-semibold text-teal-600">{badge.title}</p>
          {badge.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{badge.description}</p>
          )}
        </div>

        {/* Linked activities */}
        {stravaActivities.length > 0 && (
          <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left dark:bg-gray-800">
            <p className="mb-2 text-sm font-semibold">Linked Activities</p>
            <div className="space-y-2">
              {stravaActivities.slice(0, 2).map((activity) => (
                <a
                  key={activity.strava_url}
                  href={activity.strava_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-teal-600 hover:text-teal-700 hover:underline"
                >
                  {activity.name} &middot; {activity.distance.toFixed(1)}km
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 py-2 font-semibold hover:bg-gray-300 dark:bg-gray-700"
          >
            Close
          </button>
          {onShare && (
            <button
              onClick={onShare}
              className="flex-1 rounded-lg bg-teal-600 py-2 font-semibold text-white hover:bg-teal-700"
            >
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
