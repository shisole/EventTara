"use client";

import { useState } from "react";

import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { BADGE_TEMPLATES, BADGE_CATEGORIES } from "@/lib/constants/badge-templates";
import { cn } from "@/lib/utils";

interface BadgeTemplatePickerProps {
  onSelect: (template: {
    title: string;
    description: string;
    category: string;
    rarity: string;
  }) => void;
  onSkip: () => void;
}

export default function BadgeTemplatePicker({ onSelect, onSkip }: BadgeTemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? BADGE_TEMPLATES.filter((t) => t.category === activeCategory)
    : BADGE_TEMPLATES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Start from a template
        </h3>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Or create from scratch
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setActiveCategory(null); }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            activeCategory
              ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              : "bg-teal-600 text-white",
          )}
        >
          All
        </button>
        {BADGE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => { setActiveCategory(cat.value); }}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              activeCategory === cat.value
                ? "bg-teal-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
        {filtered.map((t) => {
          const rStyle = RARITY_STYLES[t.rarity];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { onSelect(t); }}
              className="text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-500 transition-colors"
            >
              <p className="text-sm font-medium truncate dark:text-white">{t.title}</p>
              <span
                className={cn("inline-block text-xs px-1.5 py-0.5 rounded-full mt-1", rStyle.pill)}
              >
                {rStyle.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
