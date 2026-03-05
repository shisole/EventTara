"use client";

import { REVIEW_TAGS } from "@/lib/constants/review-tags";
import { cn } from "@/lib/utils";

interface ReviewTagSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

export default function ReviewTagSelector({
  selected,
  onChange,
  disabled = false,
}: ReviewTagSelectorProps) {
  const toggle = (key: string) => {
    if (disabled) return;
    onChange(selected.includes(key) ? selected.filter((t) => t !== key) : [...selected, key]);
  };

  const positive = REVIEW_TAGS.filter((t) => t.sentiment === "positive");
  const negative = REVIEW_TAGS.filter((t) => t.sentiment === "negative");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {positive.map((tag) => {
          const isSelected = selected.includes(tag.key);
          return (
            <button
              key={tag.key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(tag.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isSelected
                  ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700"
                  : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {negative.map((tag) => {
          const isSelected = selected.includes(tag.key);
          return (
            <button
              key={tag.key}
              type="button"
              disabled={disabled}
              onClick={() => toggle(tag.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isSelected
                  ? "bg-red-100 text-red-800 ring-1 ring-red-300 dark:bg-red-900/40 dark:text-red-300 dark:ring-red-700"
                  : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
