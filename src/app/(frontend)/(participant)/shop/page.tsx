"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import PurchaseModal from "@/components/shop/PurchaseModal";
import ShopItemCard, { type ShopItem, type ShopItemCategory } from "@/components/shop/ShopItemCard";
import TokenBalanceBar from "@/components/shop/TokenBalanceBar";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InventoryEntry {
  shop_item_id: string;
}

interface AvatarConfig {
  animal_id: string | null;
  equipped_accessory_id: string | null;
  equipped_background_id: string | null;
  equipped_border_id: string | null;
  equipped_skin_id: string | null;
}

type CategoryFilter = "all" | ShopItemCategory;

const CATEGORY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "animal", label: "Animals" },
  { value: "accessory", label: "Accessories" },
  { value: "background", label: "Backgrounds" },
  { value: "border", label: "Borders" },
  { value: "skin", label: "Skins" },
];

const CATEGORY_TO_EQUIPPED_KEY: Record<Exclude<ShopItemCategory, "animal">, keyof AvatarConfig> = {
  accessory: "equipped_accessory_id",
  background: "equipped_background_id",
  border: "equipped_border_id",
  skin: "equipped_skin_id",
};

/* ------------------------------------------------------------------ */
/*  Shop Content (client component)                                    */
/* ------------------------------------------------------------------ */

function ShopContent() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [inventory, setInventory] = useState<InventoryEntry[]>([]);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);

  // Purchase modal state
  const [purchaseItem, setPurchaseItem] = useState<ShopItem | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, balanceRes, inventoryRes, configRes] = await Promise.all([
        fetch("/api/shop/items"),
        fetch("/api/tokens"),
        fetch("/api/users/inventory"),
        fetch("/api/users/avatar-config"),
      ]);

      const itemsData: { items?: ShopItem[] } = await itemsRes.json();
      const balanceData: { balance?: number } = await balanceRes.json();
      const inventoryData: { inventory?: InventoryEntry[] } = await inventoryRes.json();
      const configData: { config?: AvatarConfig | null } = await configRes.json();

      setItems(itemsData.items ?? []);
      setBalance(balanceData.balance ?? 0);
      setInventory(inventoryData.inventory ?? []);
      setAvatarConfig(configData.config ?? null);
    } catch {
      // Silently handle — data will show as empty/zero
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const ownedIds = new Set(inventory.map((entry) => entry.shop_item_id));

  function isEquipped(item: ShopItem): boolean {
    if (!avatarConfig) return false;
    if (item.category === "animal") {
      return avatarConfig.animal_id === item.avatar_animal_id;
    }
    const key = CATEGORY_TO_EQUIPPED_KEY[item.category];
    return avatarConfig[key] === item.id;
  }

  const filteredItems =
    activeTab === "all" ? items : items.filter((item) => item.category === activeTab);

  /* ----- Purchase flow ----- */

  function handleBuyClick(item: ShopItem) {
    setPurchaseError("");
    setPurchaseItem(item);
  }

  async function handlePurchaseConfirm() {
    if (!purchaseItem) return;
    setPurchaseLoading(true);
    setPurchaseError("");

    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: purchaseItem.id }),
      });

      const data: { error?: string; new_balance?: number; success?: boolean } = await res.json();

      if (!res.ok || data.error) {
        setPurchaseError(data.error ?? "Purchase failed. Please try again.");
        return;
      }

      // Update local state from the successful purchase
      if (typeof data.new_balance === "number") {
        setBalance(data.new_balance);
      }
      setInventory((prev) => [...prev, { shop_item_id: purchaseItem.id }]);
      setPurchaseItem(null);
    } catch {
      setPurchaseError("Something went wrong. Please try again.");
    } finally {
      setPurchaseLoading(false);
    }
  }

  /* ----- Equip flow ----- */

  async function handleEquip(item: ShopItem) {
    if (item.category === "animal") {
      const prevAnimalId = avatarConfig?.animal_id ?? null;
      setAvatarConfig((prev) =>
        prev ? { ...prev, animal_id: item.avatar_animal_id ?? null } : null,
      );

      try {
        const res = await fetch("/api/users/avatar-config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animal_id: item.avatar_animal_id }),
        });

        if (!res.ok) {
          setAvatarConfig((prev) => (prev ? { ...prev, animal_id: prevAnimalId } : null));
        }
      } catch {
        setAvatarConfig((prev) => (prev ? { ...prev, animal_id: prevAnimalId } : null));
      }
      return;
    }

    const key = CATEGORY_TO_EQUIPPED_KEY[item.category];

    // Optimistic update
    setAvatarConfig((prev) => (prev ? { ...prev, [key]: item.id } : null));

    try {
      const res = await fetch("/api/users/avatar-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: item.id }),
      });

      if (!res.ok) {
        // Revert on failure
        setAvatarConfig((prev) => (prev ? { ...prev, [key]: null } : null));
      }
    } catch {
      // Revert on failure
      setAvatarConfig((prev) => (prev ? { ...prev, [key]: null } : null));
    }
  }

  return (
    <>
      <TokenBalanceBar balance={balance} loading={loading} />

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-heading text-3xl font-bold text-gray-900 dark:text-white">
            Shop
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Customize your adventure buddy</p>
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-lime-500 text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Items grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <Skeleton className="mx-auto mb-3 h-16 w-16 rounded-xl" />
                <Skeleton className="mx-auto mb-1 h-4 w-20 rounded-md" />
                <Skeleton className="mx-auto mb-3 h-3 w-14 rounded-md" />
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-3 text-4xl">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600"
                aria-hidden="true"
              >
                <path
                  d="M20 7H4a1 1 0 00-1 1v10a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM12 4l-4 3h8l-4-3z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-medium text-gray-500 dark:text-gray-400">
              No items available in this category yet.
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                owned={ownedIds.has(item.id)}
                equipped={isEquipped(item)}
                onBuy={() => {
                  handleBuyClick(item);
                }}
                onEquip={() => {
                  void handleEquip(item);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Purchase confirmation modal */}
      <PurchaseModal
        item={purchaseItem}
        balance={balance}
        isOpen={purchaseItem !== null}
        onClose={() => {
          setPurchaseItem(null);
          setPurchaseError("");
        }}
        onConfirm={handlePurchaseConfirm}
        loading={purchaseLoading}
        error={purchaseError}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (with Suspense boundary)                                      */
/* ------------------------------------------------------------------ */

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="mx-auto mb-2 h-8 w-32 rounded-xl" />
          <Skeleton className="mx-auto mb-8 h-4 w-48 rounded-md" />
          <div className="mb-6 flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
