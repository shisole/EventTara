"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  tent: "Tent",
  sleeping_bag: "Sleeping Bag",
  trekking_poles: "Trekking Poles",
  bike: "Bike",
  helmet: "Helmet",
  backpack: "Backpack",
  other: "Other",
};

export interface RentalItem {
  id: string;
  club_id: string;
  name: string;
  category: string;
  description: string | null;
  rental_price: number;
  quantity_total: number;
  image_url: string | null;
  sizes: string[] | null;
  is_active: boolean;
  sort_order: number;
  available_quantity: number;
}

interface SelectedRental {
  rental_item_id: string;
  quantity: number;
  size: string | null;
}

interface RentalItemCardProps {
  item: RentalItem;
  selection?: SelectedRental;
  onSelectionChange?: (selection: SelectedRental | null) => void;
  readOnly?: boolean;
}

export default function RentalItemCard({
  item,
  selection,
  onSelectionChange,
  readOnly,
}: RentalItemCardProps) {
  const isSelected = !!selection && selection.quantity > 0;
  const maxQty = Math.min(item.available_quantity, item.quantity_total);
  const isAvailable = maxQty > 0;

  const handleToggle = () => {
    if (readOnly || !onSelectionChange || !isAvailable) return;
    if (isSelected) {
      onSelectionChange(null);
    } else {
      onSelectionChange({
        rental_item_id: item.id,
        quantity: 1,
        size: item.sizes && item.sizes.length > 0 ? item.sizes[0] : null,
      });
    }
  };

  const handleQuantityChange = (qty: number) => {
    if (readOnly || !onSelectionChange) return;
    if (qty <= 0) {
      onSelectionChange(null);
    } else {
      onSelectionChange({
        rental_item_id: item.id,
        quantity: Math.min(qty, maxQty),
        size: selection?.size ?? null,
      });
    }
  };

  const handleSizeChange = (size: string) => {
    if (readOnly || !onSelectionChange || !selection) return;
    onSelectionChange({ ...selection, size });
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 transition-all",
        isSelected
          ? "border-lime-500 bg-lime-50 dark:border-lime-400 dark:bg-lime-950/20"
          : isAvailable
            ? "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
            : "border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800/50",
      )}
    >
      <div className="flex gap-3">
        {/* Image */}
        {item.image_url ? (
          <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl dark:bg-gray-800">
            {item.category === "tent"
              ? "⛺"
              : item.category === "bike"
                ? "🚲"
                : item.category === "helmet"
                  ? "🪖"
                  : item.category === "backpack"
                    ? "🎒"
                    : "🏕️"}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-heading font-bold text-sm text-gray-900 dark:text-gray-100">
                {item.name}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {CATEGORY_LABELS[item.category] || item.category}
              </p>
            </div>
            <p className="text-sm font-bold text-lime-600 dark:text-lime-400 shrink-0">
              {item.rental_price === 0 ? "Free" : `₱${item.rental_price.toLocaleString()}`}
            </p>
          </div>

          {item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {isAvailable ? `${maxQty} available` : "Out of stock"}
          </p>
        </div>
      </div>

      {/* Selection controls */}
      {!readOnly && isAvailable && (
        <div className="mt-3 flex items-center gap-3">
          {isSelected ? (
            <>
              {/* Quantity picker */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuantityChange((selection?.quantity ?? 1) - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-sm hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-medium">{selection?.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange((selection?.quantity ?? 1) + 1)}
                  disabled={(selection?.quantity ?? 1) >= maxQty}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 text-sm hover:bg-gray-100 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-800"
                >
                  +
                </button>
              </div>

              {/* Size picker */}
              {item.sizes && item.sizes.length > 0 && (
                <select
                  value={selection?.size ?? ""}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800"
                >
                  {item.sizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}

              {/* Remove */}
              <button
                type="button"
                onClick={handleToggle}
                className="ml-auto text-xs text-red-500 hover:text-red-600 dark:text-red-400"
              >
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              className="rounded-lg bg-lime-500 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-lime-400 transition-colors"
            >
              Add
            </button>
          )}
        </div>
      )}
    </div>
  );
}
