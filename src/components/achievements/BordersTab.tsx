"use client";

import { useState } from "react";

import { LockIcon } from "@/components/icons";
import { TIER_LABEL_COLORS, TIER_LABELS } from "@/lib/constants/avatar-borders";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const TIER_COLOR_MAP: Record<string, string> = { ...TIER_LABEL_COLORS };
const TIER_LABEL_MAP: Record<string, string> = { ...TIER_LABELS };

type Border = Database["public"]["Tables"]["avatar_borders"]["Row"];

interface BordersTabProps {
  borders: Border[];
  earnedBorderIds: Set<string>;
}

export default function BordersTab({ borders, earnedBorderIds }: BordersTabProps) {
  const [selectedBorder, setSelectedBorder] = useState<Border | null>(null);

  const sortedBorders = [...borders].sort((a, b) => {
    const tierOrder: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
    return (tierOrder[b.tier] ?? 0) - (tierOrder[a.tier] ?? 0);
  });

  return (
    <div>
      {/* Border preview modal */}
      {selectedBorder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedBorder(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-heading text-xl font-bold">{selectedBorder.name}</h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              {selectedBorder.description}
            </p>
            <div className="mb-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <div className="flex justify-center">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600"
                  style={{
                    border: selectedBorder.border_color
                      ? `3px solid ${selectedBorder.border_color}`
                      : undefined,
                  }}
                >
                  <span className="text-4xl">{"\u{1F464}"}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedBorder(null)}
              className="w-full rounded-lg bg-teal-600 py-2 text-white hover:bg-teal-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Borders grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {sortedBorders.map((border) => {
          const isEarned = earnedBorderIds.has(border.id);
          const tierColor =
            TIER_COLOR_MAP[border.tier] ?? "bg-gray-100 text-gray-400 dark:bg-gray-800";

          return (
            <button
              key={border.id}
              onClick={() => isEarned && setSelectedBorder(border)}
              disabled={!isEarned}
              className={cn(
                "rounded-2xl p-4 text-center transition-all",
                isEarned
                  ? "cursor-pointer bg-white shadow-md hover:shadow-lg dark:bg-gray-900"
                  : "cursor-not-allowed bg-gray-50 opacity-60 dark:bg-gray-900/50",
              )}
            >
              {/* Border preview circle */}
              <div
                className={cn(
                  "mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full",
                  isEarned
                    ? "bg-gradient-to-br from-gray-200 to-gray-400"
                    : "bg-gray-200 dark:bg-gray-700",
                )}
                style={{
                  border:
                    isEarned && border.border_color
                      ? `2px solid ${border.border_color}`
                      : undefined,
                }}
              >
                <span className={cn(!isEarned && "opacity-30 grayscale")}>
                  {"\u{1F396}\u{FE0F}"}
                </span>
              </div>

              {/* Title */}
              <h4 className={cn("font-heading text-sm font-bold", !isEarned && "text-gray-400")}>
                {border.name}
              </h4>

              {/* Tier badge */}
              <span
                className={cn(
                  "mt-2 inline-block rounded-full px-2 py-0.5 text-xs",
                  isEarned ? tierColor : "bg-gray-100 text-gray-400 dark:bg-gray-800",
                )}
              >
                {TIER_LABEL_MAP[border.tier] ?? border.tier}
              </span>

              {/* Status */}
              {!isEarned && (
                <p className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400">
                  <LockIcon className="h-3.5 w-3.5" />
                  Locked
                </p>
              )}
            </button>
          );
        })}
      </div>

      {borders.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">No borders available yet.</p>
        </div>
      )}
    </div>
  );
}
