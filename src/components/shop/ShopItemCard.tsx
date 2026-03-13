"use client";

import Image from "next/image";

import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { CoinIcon } from "./TokenBalanceBar";

type ShopItemCategory = "accessory" | "animal" | "background" | "border" | "skin";
type ShopItemRarity = "common" | "uncommon" | "rare" | "legendary";

interface ShopItem {
  id: string;
  slug: string;
  name: string;
  category: ShopItemCategory;
  image_url: string;
  preview_url: string | null;
  price: number;
  rarity: ShopItemRarity;
  is_active: boolean;
  sort_order: number;
  avatar_animal_id?: string | null;
}

interface ShopItemCardProps {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  onBuy: () => void;
  onEquip: () => void;
}

const RARITY_CONFIG: Record<ShopItemRarity, { label: string; dotColor: string; border: string }> = {
  common: {
    label: "Common",
    dotColor: "bg-gray-400",
    border: "border-gray-200 dark:border-gray-700",
  },
  uncommon: {
    label: "Uncommon",
    dotColor: "bg-emerald-500",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  rare: {
    label: "Rare",
    dotColor: "bg-blue-500",
    border: "border-blue-200 dark:border-blue-800",
  },
  legendary: {
    label: "Legendary",
    dotColor: "bg-amber-500",
    border: "border-amber-200 dark:border-amber-800",
  },
};

export type { ShopItem, ShopItemCategory, ShopItemRarity };

export default function ShopItemCard({ item, owned, equipped, onBuy, onEquip }: ShopItemCardProps) {
  const rarity = RARITY_CONFIG[item.rarity];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-4 shadow-md transition-shadow hover:shadow-lg",
        "dark:bg-gray-900 dark:shadow-gray-950/30",
        rarity.border,
      )}
    >
      {/* Item image */}
      <div
        className={cn(
          "mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl",
          "bg-gray-50 dark:bg-gray-800",
          item.category === "border" && "rounded-full",
          item.category === "animal" && "rounded-full bg-teal-100 dark:bg-teal-900",
        )}
      >
        <Image
          src={item.image_url}
          alt={item.name}
          width={64}
          height={64}
          className={cn(
            "h-full w-full object-contain",
            item.category === "border" && "animate-spin-slow",
            item.category === "background" && "animate-float",
          )}
        />
      </div>

      {/* Name */}
      <h3 className="truncate text-center font-heading text-sm font-bold text-gray-900 dark:text-white">
        {item.name}
      </h3>

      {/* Rarity badge */}
      <div className="mt-1 flex items-center justify-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", rarity.dotColor)} />
        <span className="text-xs text-gray-500 dark:text-gray-400">{rarity.label}</span>
      </div>

      {/* Price or owned status */}
      <div className="mt-3">
        {owned ? (
          equipped ? (
            <div
              className={cn(
                "flex items-center justify-center gap-1 rounded-xl py-2 text-sm font-semibold",
                "bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-400",
              )}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              Equipped
            </div>
          ) : (
            <Button size="sm" variant="outline" className="w-full" onClick={onEquip}>
              Equip
            </Button>
          )
        ) : (
          <button
            onClick={onBuy}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold",
              "bg-gray-900 text-white transition-colors hover:bg-gray-800",
              "dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
            )}
          >
            <CoinIcon className="h-4 w-4" />
            {item.price.toLocaleString()}
          </button>
        )}
      </div>
    </div>
  );
}
