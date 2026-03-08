"use client";

import { useState } from "react";

import { CloseIcon } from "@/components/icons";
import { TIER_LABEL_COLORS, TIER_LABELS } from "@/lib/constants/avatar-borders";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Border = Database["public"]["Tables"]["avatar_borders"]["Row"];

interface BorderCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBorders: Border[];
  earnedBorderIds: Set<string>;
  activeBorderId: string | null;
  onSelectBorder: (borderId: string) => Promise<void>;
}

const TIER_COLOR_MAP: Record<string, string> = { ...TIER_LABEL_COLORS };
const TIER_LABEL_MAP: Record<string, string> = { ...TIER_LABELS };

export default function BorderCustomizationModal({
  isOpen,
  onClose,
  allBorders,
  earnedBorderIds,
  activeBorderId,
  onSelectBorder,
}: BorderCustomizationModalProps) {
  const [selectedPreview, setSelectedPreview] = useState<Border | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const activeBorder = allBorders.find((b) => b.id === activeBorderId);
  const unlockedBorders = allBorders.filter((b) => earnedBorderIds.has(b.id));
  const lockedBorders = allBorders.filter((b) => !earnedBorderIds.has(b.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold">Customize Border</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Active border preview */}
        <div className="mb-8 rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Active Border</p>
          {activeBorder ? (
            <div>
              <div
                className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600"
                style={{
                  border: activeBorder.border_color
                    ? `3px solid ${activeBorder.border_color}`
                    : undefined,
                }}
              >
                <span className="text-3xl">{"\u{1F464}"}</span>
              </div>
              <p className="font-semibold">{activeBorder.name}</p>
            </div>
          ) : (
            <p className="text-gray-500">No border selected</p>
          )}
        </div>

        {/* Unlocked borders */}
        {unlockedBorders.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 font-heading text-lg font-bold">Your Borders</h3>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {unlockedBorders.map((border) => (
                <button
                  key={border.id}
                  onClick={() => setSelectedPreview(border)}
                  className={cn(
                    "rounded-lg border-2 p-3 transition-all",
                    activeBorderId === border.id
                      ? "border-teal-600 bg-teal-50 dark:bg-teal-900/20"
                      : "border-gray-200 hover:border-teal-400 dark:border-gray-700",
                  )}
                >
                  <div
                    className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-400"
                    style={{
                      border: border.border_color ? `2px solid ${border.border_color}` : undefined,
                    }}
                  >
                    <span className="text-lg">{"\u{1F396}\u{FE0F}"}</span>
                  </div>
                  <p className="text-center text-xs font-semibold">{border.name}</p>
                  <span
                    className={cn(
                      "mt-1 block text-center text-xs",
                      TIER_COLOR_MAP[border.tier] ?? "",
                    )}
                  >
                    {TIER_LABEL_MAP[border.tier] ?? border.tier}
                  </span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setIsUpdating(true);
                      await onSelectBorder(border.id);
                      setIsUpdating(false);
                    }}
                    disabled={isUpdating || activeBorderId === border.id}
                    className={cn(
                      "mt-2 w-full rounded py-1 text-xs",
                      activeBorderId === border.id
                        ? "bg-teal-600 text-white"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300",
                    )}
                  >
                    {activeBorderId === border.id ? "Active" : "Select"}
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Locked borders */}
        {lockedBorders.length > 0 && (
          <div>
            <h3 className="mb-4 font-heading text-lg font-bold">Locked Borders</h3>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {lockedBorders.map((border) => (
                <div
                  key={border.id}
                  className="rounded-lg border-2 border-gray-200 p-3 opacity-50 dark:border-gray-700"
                >
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                    <span className="text-lg opacity-30">{"\u{1F396}\u{FE0F}"}</span>
                  </div>
                  <p className="text-center text-xs font-semibold text-gray-500">{border.name}</p>
                  <p className="mt-2 text-center text-xs text-gray-400">Locked</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Border preview overlay */}
        {selectedPreview && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70"
            onClick={() => setSelectedPreview(null)}
          >
            <div
              className="max-w-sm rounded-2xl bg-white p-6 dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="mb-4 text-xl font-bold">{selectedPreview.name}</h4>
              <div
                className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600"
                style={{
                  border: selectedPreview.border_color
                    ? `4px solid ${selectedPreview.border_color}`
                    : undefined,
                }}
              >
                <span className="text-5xl">{"\u{1F464}"}</span>
              </div>
              <p className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
                {selectedPreview.description}
              </p>
              <button
                onClick={() => setSelectedPreview(null)}
                className="w-full rounded-lg bg-gray-200 py-2 hover:bg-gray-300 dark:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
