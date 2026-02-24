"use client";

import { useState } from "react";
import BadgeCard from "./BadgeCard";
import { CATEGORY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  title: string;
  eventName: string;
  imageUrl: string | null;
  awardedAt: string;
  category?: string;
  rarity?: string;
}

export default function BadgeGrid({ badges }: { badges: Badge[] }) {
  const categories = badges.reduce((acc, b) => {
    if (b.category) acc.add(b.category);
    return acc;
  }, new Set<string>());

  const showTabs = categories.size >= 2;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredBadges = activeCategory
    ? badges.filter((b) => b.category === activeCategory)
    : badges;

  if (badges.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">&#127941;</p>
        <p className="text-gray-500 dark:text-gray-400">
          No badges yet. Join events to earn badges!
        </p>
      </div>
    );
  }

  return (
    <div>
      {showTabs && (
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors",
              !activeCategory
                ? "bg-teal-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            All
          </button>
          {Array.from(categories).map((cat) => {
            const style = CATEGORY_STYLES[cat as keyof typeof CATEGORY_STYLES];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                )}
              >
                {style?.label || cat}
              </button>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => (
          <BadgeCard
            key={badge.id}
            {...badge}
            category={badge.category as any}
            rarity={badge.rarity as any}
          />
        ))}
      </div>
    </div>
  );
}
