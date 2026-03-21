"use client";

import { useState } from "react";

import { type RentalItem } from "@/components/rentals/RentalItemCard";
import RentalItemGrid from "@/components/rentals/RentalItemGrid";

export interface SelectedRental {
  rental_item_id: string;
  quantity: number;
  size: string | null;
}

interface ClubRentals {
  club: { id: string; name: string; slug: string; logo_url: string | null };
  items: RentalItem[];
}

interface RentalSelectionStepProps {
  ownClub: ClubRentals;
  nearbyClubs: ClubRentals[];
  selections: SelectedRental[];
  onSelectionsChange: (selections: SelectedRental[]) => void;
}

export default function RentalSelectionStep({
  ownClub,
  nearbyClubs,
  selections,
  onSelectionsChange,
}: RentalSelectionStepProps) {
  const [expandedClubs, setExpandedClubs] = useState<Set<string>>(new Set());

  const toggleClub = (clubId: string) => {
    setExpandedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(clubId)) next.delete(clubId);
      else next.add(clubId);
      return next;
    });
  };

  // Calculate rental subtotal
  const allItems = [...ownClub.items, ...nearbyClubs.flatMap((c) => c.items)];
  const rentalSubtotal = selections.reduce((total, sel) => {
    const item = allItems.find((i) => i.id === sel.rental_item_id);
    return total + (item ? item.rental_price * sel.quantity : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-heading font-bold text-gray-900 dark:text-gray-100">
          Rental Gear Add-ons
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Optionally rent gear for this event. Skip if you have your own.
        </p>
      </div>

      {/* Own club rentals */}
      {ownClub.items.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            From {ownClub.club.name}
          </p>
          <RentalItemGrid
            items={ownClub.items}
            selections={selections}
            onSelectionChange={onSelectionsChange}
          />
        </div>
      )}

      {/* Nearby clubs */}
      {nearbyClubs.map((nc) => (
        <div key={nc.club.id}>
          <button
            type="button"
            onClick={() => toggleClub(nc.club.id)}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-750"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Also available from {nc.club.name}
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${expandedClubs.has(nc.club.id) ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedClubs.has(nc.club.id) && (
            <div className="mt-3">
              <RentalItemGrid
                items={nc.items}
                selections={selections}
                onSelectionChange={onSelectionsChange}
              />
            </div>
          )}
        </div>
      ))}

      {/* Rental summary */}
      {selections.length > 0 && (
        <div className="rounded-xl bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-800 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selections.reduce((t, s) => t + s.quantity, 0)} rental item
              {selections.reduce((t, s) => t + s.quantity, 0) === 1 ? "" : "s"} selected
            </p>
            <p className="text-lg font-bold text-lime-600 dark:text-lime-400">
              +₱{rentalSubtotal.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
