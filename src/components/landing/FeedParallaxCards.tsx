"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { FeedIcon } from "@/components/icons";
import { UserAvatar } from "@/components/ui";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import type { BadgeRarity } from "@/lib/constants/badge-rarity";
import type { FeedPreviewItem } from "@/lib/feed/preview";
import { formatRelativeTime } from "@/lib/utils/relative-time";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface FeedParallaxCardsProps {
  items: FeedPreviewItem[];
}

export default function FeedParallaxCards({ items }: FeedParallaxCardsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Find the outer parallax section (the one with h-[300vh])
    const section = el.closest("section");
    if (!section) return;

    const mq = globalThis.matchMedia("(max-width: 639px)");
    setIsMobile(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onMqChange);

    function onScroll() {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const scrollableDistance = section.offsetHeight - window.innerHeight;
      if (scrollableDistance <= 0) return;

      const rawProgress = clamp(-rect.top / scrollableDistance, 0, 1);
      // Map to children reveal phase (0.5–0.85 of overall progress → 0–1)
      setProgress(clamp((rawProgress - 0.5) / 0.35, 0, 1));
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onMqChange);
    };
  }, []);

  // Pill appears first
  const pillOpacity = isMobile ? clamp(progress / 0.25, 0, 1) : progress;

  // CTA appears last
  const ctaOpacity = isMobile ? clamp((progress - 0.75) / 0.25, 0, 1) : progress;

  return (
    <div ref={ref} className="text-center">
      {/* Section pill */}
      <div
        className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm"
        style={{ opacity: pillOpacity }}
      >
        <FeedIcon className="h-4 w-4" />
        Activity Feed
      </div>

      {/* Cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {items.map((item, i) => {
          let cardOpacity: number;
          let cardTranslateY: number;

          if (isMobile) {
            // Stagger: each card gets its own reveal window
            const start = 0.1 + i * 0.25; // 0.1, 0.35, 0.6
            cardOpacity = clamp((progress - start) / 0.3, 0, 1);
            cardTranslateY = (1 - cardOpacity) * 24;
          } else {
            cardOpacity = progress;
            cardTranslateY = 0;
          }

          return (
            <div
              key={`${item.activityType}-${item.id}`}
              style={{
                opacity: cardOpacity,
                transform: cardTranslateY > 0.5 ? `translateY(${cardTranslateY}px)` : undefined,
              }}
            >
              <GlassCard item={item} isMobile={isMobile} />
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ opacity: ctaOpacity }}>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/15 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:px-6 sm:py-3 sm:text-base"
        >
          <FeedIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          View Activity Feed
        </Link>
      </div>
    </div>
  );
}

function GlassCard({ item, isMobile }: { item: FeedPreviewItem; isMobile: boolean }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-3 text-left backdrop-blur-md sm:p-4">
      {/* Header: avatar + name + timestamp */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="shrink-0">
          <UserAvatar
            src={item.userAvatarUrl}
            alt={item.userName}
            size="sm"
            borderTier={item.borderTier}
            borderColor={item.borderColor}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{item.userName}</p>
          <p className="truncate text-xs text-white/70 sm:text-sm">{item.text}</p>
        </div>
        <span className="hidden shrink-0 text-xs text-white/50 sm:block">
          {formatRelativeTime(item.timestamp)}
        </span>
      </div>

      {/* Badge showcase */}
      {item.activityType === "badge" && item.badgeImageUrl && (
        <GlassBadgePreview
          imageUrl={item.badgeImageUrl}
          title={item.badgeTitle}
          rarity={item.badgeRarity}
        />
      )}

      {/* Context image — hidden on mobile to keep cards compact */}
      {!isMobile && item.activityType !== "badge" && item.contextImageUrl && (
        <div className="relative mt-3 h-28 w-full overflow-hidden rounded-lg">
          <Image src={item.contextImageUrl} alt="" fill className="object-cover" sizes="33vw" />
        </div>
      )}
    </div>
  );
}

function GlassBadgePreview({
  imageUrl,
  title,
  rarity,
}: {
  imageUrl: string;
  title: string | null;
  rarity: BadgeRarity | null;
}) {
  const resolved = resolvePresetImage(imageUrl);
  const rarityStyle = rarity ? RARITY_STYLES[rarity] : RARITY_STYLES.common;

  return (
    <div className="mt-2 flex items-center gap-2.5 sm:mt-3 sm:gap-3">
      <div className={`shrink-0 rounded-full ${rarityStyle.ring} ${rarityStyle.glow}`}>
        {resolved?.type === "emoji" ? (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 ${resolved.color}`}
          >
            <span className="text-lg sm:text-xl">{resolved.emoji}</span>
          </div>
        ) : resolved?.type === "url" ? (
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white/10 sm:h-10 sm:w-10">
            <Image
              src={resolved.url}
              alt={title || "Badge"}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : null}
      </div>
      <div className="min-w-0">
        {title && <p className="truncate text-xs font-semibold text-white sm:text-sm">{title}</p>}
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full sm:text-xs ${rarityStyle.pill}`}
        >
          {rarityStyle.label}
        </span>
      </div>
    </div>
  );
}
