"use client";

import RentalItemCard, { type RentalItem } from "./RentalItemCard";

const CATEGORY_ORDER = [
  "tent",
  "sleeping_bag",
  "backpack",
  "trekking_poles",
  "bike",
  "helmet",
  "other",
];

const CATEGORY_LABELS: Record<string, string> = {
  tent: "Tents",
  sleeping_bag: "Sleeping Bags",
  trekking_poles: "Trekking Poles",
  bike: "Bikes",
  helmet: "Helmets",
  backpack: "Backpacks",
  other: "Other",
};

interface SelectedRental {
  rental_item_id: string;
  quantity: number;
  size: string | null;
}

interface RentalItemGridProps {
  items: RentalItem[];
  selections?: SelectedRental[];
  onSelectionChange?: (selections: SelectedRental[]) => void;
  readOnly?: boolean;
}

export default function RentalItemGrid({
  items,
  selections = [],
  onSelectionChange,
  readOnly,
}: RentalItemGridProps) {
  // Group items by category
  const grouped = new Map<string, RentalItem[]>();
  for (const item of items) {
    const existing = grouped.get(item.category) || [];
    existing.push(item);
    grouped.set(item.category, existing);
  }

  // Sort categories
  const sortedCategories = [...grouped.keys()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
  );

  const handleItemChange = (itemId: string, selection: SelectedRental | null) => {
    if (!onSelectionChange) return;
    const updated = selections.filter((s) => s.rental_item_id !== itemId);
    if (selection) updated.push(selection);
    onSelectionChange(updated);
  };

  return (
    <div className="space-y-6">
      {sortedCategories.map((category) => {
        const categoryItems = grouped.get(category) || [];
        return (
          <div key={category}>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {CATEGORY_LABELS[category] || category}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryItems.map((item) => (
                <RentalItemCard
                  key={item.id}
                  item={item}
                  selection={selections.find((s) => s.rental_item_id === item.id)}
                  onSelectionChange={(s) => handleItemChange(item.id, s)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
