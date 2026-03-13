"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ItemCategory = "accessory" | "animal" | "background" | "border" | "skin";
type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

interface OwnedItem {
  id: string;
  name: string;
  category: ItemCategory;
  image_url: string;
  rarity: ItemRarity;
  equipped: boolean;
}

const RARITY_DOT: Record<ItemRarity, string> = {
  common: "bg-gray-400",
  uncommon: "bg-emerald-500",
  rare: "bg-blue-500",
  legendary: "bg-amber-500",
};

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  accessory: "Accessories",
  animal: "Animals",
  background: "Backgrounds",
  border: "Borders",
  skin: "Skins",
};

interface ProfileInventoryProps {
  userId: string;
  isOwnProfile: boolean;
}

export default function ProfileInventory({ userId, isOwnProfile }: ProfileInventoryProps) {
  const [items, setItems] = useState<OwnedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchInventory() {
      // Fetch user inventory with shop item details
      const { data: inventory } = await supabase
        .from("user_inventory")
        .select("shop_item_id, shop_items(id, name, category, image_url, rarity)")
        .eq("user_id", userId);

      // Fetch equipped items to mark them
      const { data: config } = await supabase
        .from("user_avatar_config")
        .select(
          "equipped_accessory_id, equipped_background_id, equipped_border_id, equipped_skin_id",
        )
        .eq("user_id", userId)
        .maybeSingle();

      const equippedIds = new Set(
        [
          config?.equipped_accessory_id,
          config?.equipped_background_id,
          config?.equipped_border_id,
          config?.equipped_skin_id,
        ].filter(Boolean),
      );

      const owned: OwnedItem[] = (inventory ?? [])
        .filter((row) => row.shop_items)
        .map((row) => {
          const si = row.shop_items;
          // Supabase returns joined row as object (not array) due to FK
          const id: string = (si && typeof si === "object" && "id" in si ? si.id : "") ?? "";
          const name: string = (si && typeof si === "object" && "name" in si ? si.name : "") ?? "";
          const category: ItemCategory =
            si && typeof si === "object" && "category" in si
              ? (si.category ?? "accessory")
              : "accessory";
          const image_url: string =
            (si && typeof si === "object" && "image_url" in si ? si.image_url : "") ?? "";
          const rarity: ItemRarity =
            si && typeof si === "object" && "rarity" in si ? (si.rarity ?? "common") : "common";
          return {
            id,
            name,
            category,
            image_url,
            rarity,
            equipped: equippedIds.has(id),
          };
        });

      setItems(owned);
      setLoading(false);
    }

    void fetchInventory();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
        {isOwnProfile
          ? "No items yet. Visit the shop to get cosmetics!"
          : "No items collected yet."}
      </p>
    );
  }

  // Group by category
  const categories: ItemCategory[] = ["animal", "accessory", "background", "border", "skin"];
  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: items.filter((item) => item.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {grouped.map(({ category, items: catItems }) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            {CATEGORY_LABELS[category]}
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {catItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-colors",
                  item.equipped
                    ? "border-lime-400 bg-lime-50 dark:border-lime-600 dark:bg-lime-950/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
                )}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center leading-tight">
                  {item.name}
                </span>
                <div className="flex items-center gap-1">
                  <span className={cn("h-1.5 w-1.5 rounded-full", RARITY_DOT[item.rarity])} />
                  {item.equipped && (
                    <span className="text-[9px] font-semibold text-lime-600 dark:text-lime-400">
                      Equipped
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
