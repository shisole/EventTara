"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { CompositeAvatar, Button } from "@/components/ui";
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

interface ShopBorder {
  id: string;
  name: string;
  image_url: string;
  rarity: string;
}

interface AnimalOption {
  id: string;
  slug: string;
  name: string;
  image_url: string;
}

interface AvatarConfig {
  animalImageUrl?: string | null;
  accessoryImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  borderImageUrl?: string | null;
  skinImageUrl?: string | null;
}

interface BorderPickerModalProps {
  open: boolean;
  onClose: () => void;
  avatarUrl: string | null;
  fullName: string;
  activeBorderId: string | null;
  avatarConfig?: AvatarConfig | null;
  currentAnimalId?: string | null;
  onBorderChange: (borderId: string | null, tier: BorderTier | null, color: string | null) => void;
  onAnimalChange?: (animalId: string, imageUrl: string) => void;
}

type Tab = "avatar" | "border";
type BorderSource = "achievement" | "shop" | "none";

export default function BorderPickerModal({
  open,
  onClose,
  avatarUrl,
  fullName,
  activeBorderId,
  avatarConfig = null,
  currentAnimalId = null,
  onBorderChange,
  onAnimalChange,
}: BorderPickerModalProps) {
  const [tab, setTab] = useState<Tab>("avatar");
  const [borders, setBorders] = useState<EarnedBorder[]>([]);
  const [shopBorders, setShopBorders] = useState<ShopBorder[]>([]);
  const [animals, setAnimals] = useState<AnimalOption[]>([]);
  const [selectedBorderId, setSelectedBorderId] = useState<string | null>(activeBorderId);
  const [selectedBorderSource, setSelectedBorderSource] = useState<BorderSource>("none");
  const [equippedShopBorderId, setEquippedShopBorderId] = useState<string | null>(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(currentAnimalId);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setLoaded(true);
      return;
    }

    // Fetch animals
    const { data: animalData } = await supabase
      .from("avatar_animals")
      .select("id, slug, name, image_url")
      .order("sort_order");
    setAnimals(animalData ?? []);

    // Fetch current avatar config (animal + equipped shop border)
    const { data: configRow } = await supabase
      .from("user_avatar_config")
      .select("animal_id, equipped_border_id")
      .eq("user_id", authUser.id)
      .maybeSingle();
    if (configRow?.animal_id) {
      setSelectedAnimalId(configRow.animal_id);
    }
    const currentEquippedShopBorder = configRow?.equipped_border_id ?? null;
    setEquippedShopBorderId(currentEquippedShopBorder);

    // Fetch achievement borders
    const { data: awards } = await supabase
      .from("user_avatar_borders")
      .select("id, border_id, awarded_at")
      .eq("user_id", authUser.id)
      .order("awarded_at", { ascending: true });

    if (awards && awards.length > 0) {
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
    } else {
      setBorders([]);
    }

    // Fetch shop borders from inventory
    const { data: inventoryData } = await supabase
      .from("user_inventory")
      .select("shop_item_id, shop_items(id, name, category, image_url, rarity)")
      .eq("user_id", authUser.id);

    const ownedShopBorders: ShopBorder[] = (inventoryData ?? [])
      .filter((row) => {
        const si = row.shop_items;
        return si && typeof si === "object" && "category" in si && si.category === "border";
      })
      .map((row) => {
        const si = row.shop_items;
        const id: string = (si && typeof si === "object" && "id" in si ? si.id : "") ?? "";
        const name: string = (si && typeof si === "object" && "name" in si ? si.name : "") ?? "";
        const image_url: string =
          (si && typeof si === "object" && "image_url" in si ? si.image_url : "") ?? "";
        const rarity: string =
          (si && typeof si === "object" && "rarity" in si ? si.rarity : "common") ?? "common";
        return { id, name, image_url, rarity };
      });

    setShopBorders(ownedShopBorders);

    // Determine initial selected border source
    if (
      currentEquippedShopBorder &&
      ownedShopBorders.some((b) => b.id === currentEquippedShopBorder)
    ) {
      setSelectedBorderId(currentEquippedShopBorder);
      setSelectedBorderSource("shop");
    } else if (activeBorderId) {
      setSelectedBorderSource("achievement");
    }

    setLoaded(true);
  }, [supabase, activeBorderId]);

  useEffect(() => {
    if (open && !loaded) {
      void fetchData();
    }
  }, [open, loaded, fetchData]);

  useEffect(() => {
    setSelectedBorderId(activeBorderId);
  }, [activeBorderId]);

  useEffect(() => {
    if (currentAnimalId) setSelectedAnimalId(currentAnimalId);
  }, [currentAnimalId]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const animalChanged = selectedAnimalId !== currentAnimalId && selectedAnimalId !== null;

  // Determine if border selection changed
  const borderChanged = (() => {
    if (selectedBorderSource === "none") {
      return activeBorderId !== null || equippedShopBorderId !== null;
    }
    if (selectedBorderSource === "shop") {
      return selectedBorderId !== equippedShopBorderId;
    }
    // achievement
    return selectedBorderId !== activeBorderId;
  })();

  const hasChanges = borderChanged || animalChanged;

  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);
  const selectedShopBorder = shopBorders.find((b) => b.id === selectedBorderId);
  const previewConfig: AvatarConfig = {
    ...avatarConfig,
    animalImageUrl: selectedAnimal?.image_url ?? avatarConfig?.animalImageUrl,
    borderImageUrl:
      selectedBorderSource === "shop" && selectedShopBorder
        ? selectedShopBorder.image_url
        : selectedBorderSource === "none"
          ? null
          : avatarConfig?.borderImageUrl,
  };

  const handleSave = async () => {
    setSaving(true);

    // Save animal change
    if (animalChanged && selectedAnimalId) {
      await fetch("/api/users/avatar-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal_id: selectedAnimalId }),
      });
      const animal = animals.find((a) => a.id === selectedAnimalId);
      if (animal && onAnimalChange) {
        onAnimalChange(selectedAnimalId, animal.image_url);
      }
    }

    // Save border change
    if (borderChanged) {
      if (selectedBorderSource === "shop" && selectedBorderId) {
        // Equip shop border via avatar-config + clear achievement border
        await Promise.all([
          fetch("/api/users/avatar-config", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ equipped_border_id: selectedBorderId }),
          }),
          fetch("/api/users/active-border", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ border_id: null }),
          }),
        ]);
        onBorderChange(null, null, null);
      } else if (selectedBorderSource === "achievement" && selectedBorderId) {
        // Set achievement border + clear shop border
        await Promise.all([
          fetch("/api/users/active-border", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ border_id: selectedBorderId }),
          }),
          fetch("/api/users/avatar-config", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ equipped_border_id: null }),
          }),
        ]);
        const border = borders.find((b) => b.border_id === selectedBorderId);
        if (border) {
          onBorderChange(
            selectedBorderId,
            border.avatar_borders.tier,
            border.avatar_borders.border_color,
          );
        }
      } else {
        // No border — clear both
        await Promise.all([
          fetch("/api/users/active-border", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ border_id: null }),
          }),
          fetch("/api/users/avatar-config", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ equipped_border_id: null }),
          }),
        ]);
        onBorderChange(null, null, null);
      }
    }

    setSaving(false);
    onClose();
    // Reload to reflect changes
    if (animalChanged || borderChanged) {
      globalThis.location.reload();
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

  const previewBorder =
    selectedBorderSource === "achievement"
      ? borders.find((b) => b.border_id === selectedBorderId)
      : null;

  // Label for preview
  const borderLabel =
    selectedBorderSource === "shop" && selectedShopBorder
      ? selectedShopBorder.name
      : previewBorder
        ? previewBorder.avatar_borders.name
        : "";

  const RARITY_COLORS: Record<string, string> = {
    common: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    uncommon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rare: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    legendary: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

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
          <h2 className="text-lg font-heading font-bold">Customize Avatar</h2>
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
            <CompositeAvatar
              src={avatarUrl}
              alt={fullName}
              size="xl"
              borderTier={previewBorder?.avatar_borders.tier ?? null}
              borderColor={previewBorder?.avatar_borders.border_color}
              avatarConfig={previewConfig}
              className="mx-auto"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedAnimal?.name ?? "No avatar"}
              {borderLabel ? ` · ${borderLabel}` : ""}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setTab("avatar")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "avatar"
                ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            Avatar
          </button>
          <button
            onClick={() => setTab("border")}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === "border"
                ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
            )}
          >
            Border
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {tab === "avatar" && (
            <div className="grid grid-cols-4 gap-3">
              {animals.map((animal) => (
                <button
                  key={animal.id}
                  onClick={() => setSelectedAnimalId(animal.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                    selectedAnimalId === animal.id
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20 ring-1 ring-teal-500"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900 overflow-hidden flex-shrink-0">
                    <Image
                      src={animal.image_url}
                      alt={animal.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                    {animal.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {tab === "border" && (
            <>
              {/* No border option */}
              <button
                onClick={() => {
                  setSelectedBorderId(null);
                  setSelectedBorderSource("none");
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-colors",
                  selectedBorderSource === "none"
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

              {/* Shop borders */}
              {shopBorders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Shop Borders
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {shopBorders.map((sb) => (
                      <button
                        key={sb.id}
                        onClick={() => {
                          setSelectedBorderId(sb.id);
                          setSelectedBorderSource("shop");
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                          selectedBorderId === sb.id && selectedBorderSource === "shop"
                            ? "border-lime-500 bg-lime-50 dark:bg-lime-950/20"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                        )}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                          <Image
                            src={sb.image_url}
                            alt={sb.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-contain animate-spin-slow"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{sb.name}</p>
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                              RARITY_COLORS[sb.rarity] ?? RARITY_COLORS.common,
                            )}
                          >
                            {sb.rarity.charAt(0).toUpperCase() + sb.rarity.slice(1)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievement borders */}
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
                        onClick={() => {
                          setSelectedBorderId(border.border_id);
                          setSelectedBorderSource("achievement");
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors text-left",
                          selectedBorderId === border.border_id &&
                            selectedBorderSource === "achievement"
                            ? "border-lime-500 bg-lime-50 dark:bg-lime-950/20"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                        )}
                      >
                        <CompositeAvatar
                          src={avatarUrl}
                          alt={fullName}
                          size="sm"
                          borderTier={border.avatar_borders.tier}
                          borderColor={border.avatar_borders.border_color}
                          avatarConfig={previewConfig}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {border.avatar_borders.name}
                          </p>
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

              {loaded && borders.length === 0 && shopBorders.length === 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                  No borders yet. Earn borders through adventures or buy them in the shop!
                </p>
              )}
            </>
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
