"use client";

import { useCallback, useEffect, useState } from "react";

import { UserAvatar, Button } from "@/components/ui";
import type { BorderTier } from "@/lib/constants/avatar-borders";
import { TIER_LABELS, TIER_LABEL_COLORS } from "@/lib/constants/avatar-borders";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface EarnedBorder {
  id: string;
  border_id: string;
  awarded_at: string;
  avatar_borders: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    tier: BorderTier;
    border_color: string | null;
    sort_order: number;
  };
}

interface BorderPickerModalProps {
  open: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  fullName: string;
  activeBorderId: string | null;
  onBorderChange: (borderId: string | null, tier: BorderTier | null, color: string | null) => void;
}

export default function BorderPickerModal({
  open,
  onClose,
  avatarUrl,
  fullName,
  activeBorderId,
  onBorderChange,
}: BorderPickerModalProps) {
  const [borders, setBorders] = useState<EarnedBorder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(activeBorderId);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const supabase = createClient();

  const fetchBorders = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoaded(true);
      return;
    }

    const { data: awards } = await supabase
      .from("user_avatar_borders")
      .select("id, border_id, awarded_at")
      .eq("user_id", authUser.id)
      .order("awarded_at", { ascending: true });

    if (!awards || awards.length === 0) {
      setBorders([]);
      setLoaded(true);
      return;
    }

    const borderIds = awards.map((a) => a.border_id);
    const { data: borderDefs } = await supabase
      .from("avatar_borders")
      .select("id, slug, name, description, tier, border_color, sort_order")
      .in("id", borderIds);

    const borderMap = new Map((borderDefs ?? []).map((b) => [b.id, b]));

    const earned: EarnedBorder[] = awards
      .filter((a) => borderMap.has(a.border_id))
      .map((a) => ({
        ...a,
        avatar_borders: borderMap.get(a.border_id)!,
      }));

    setBorders(earned);
    setLoaded(true);
  }, [supabase]);

  useEffect(() => {
    if (open && !loaded) {
      void fetchBorders();
    }
  }, [open, loaded, fetchBorders]);

  useEffect(() => {
    setSelectedId(activeBorderId);
  }, [activeBorderId]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const hasChanges = selectedId !== activeBorderId;

  const handleSave = async () => {
    setSaving(true);

    const res = await fetch("/api/users/active-border", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ border_id: selectedId }),
    });

    setSaving(false);
    if (res.ok) {
      if (selectedId === null) {
        onBorderChange(null, null, null);
      } else {
        const border = borders.find((b) => b.border_id === selectedId);
        if (border) {
          onBorderChange(
            selectedId,
            border.avatar_borders.tier,
            border.avatar_borders.border_color,
          );
        }
      }
      onClose();
    }
  };

  if (!open) return null;

  // Group borders by tier
  const tierOrder: BorderTier[] = ["legendary", "epic", "rare", "common"];
  const grouped = tierOrder
    .map((tier) => ({
      tier,
      borders: borders.filter((b) => b.avatar_borders.tier === tier),
    }))
    .filter((g) => g.borders.length > 0);

  const previewBorder = borders.find((b) => b.border_id === selectedId);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold">Choose Avatar Border</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Preview */}
        <div className="px-6 py-4 flex justify-center border-b border-gray-100 dark:border-gray-800">
          <div className="text-center space-y-2">
            <UserAvatar
              src={avatarUrl}
              alt={fullName}
              size="xl"
              borderTier={previewBorder?.avatar_borders.tier ?? null}
              borderColor={previewBorder?.avatar_borders.border_color}
              className="mx-auto"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {previewBorder?.avatar_borders.name ?? "No border"}
            </p>
          </div>
        </div>

        {/* Border grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* No border option */}
          <button
            onClick={() => setSelectedId(null)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors",
              selectedId === null
                ? "border-lime-500 bg-lime-50 dark:bg-lime-950/20"
                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <span className="text-sm font-medium">No Border</span>
          </button>

          {grouped.map(({ tier, borders: tierBorders }) => (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    TIER_LABEL_COLORS[tier],
                  )}
                >
                  {TIER_LABELS[tier]}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {tierBorders.map((border) => (
                  <button
                    key={border.border_id}
                    onClick={() => setSelectedId(border.border_id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                      selectedId === border.border_id
                        ? "border-lime-500 bg-lime-50 dark:bg-lime-950/20"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                    )}
                  >
                    <UserAvatar
                      src={avatarUrl}
                      alt={fullName}
                      size="sm"
                      borderTier={border.avatar_borders.tier}
                      borderColor={border.avatar_borders.border_color}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{border.avatar_borders.name}</p>
                      {border.avatar_borders.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {border.avatar_borders.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {loaded && borders.length === 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              No borders earned yet. Keep adventuring to unlock borders!
            </p>
          )}
        </div>

        {/* Footer with Save button */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={!hasChanges || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
