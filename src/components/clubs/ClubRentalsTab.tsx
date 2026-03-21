"use client";

import { useEffect, useState } from "react";

import { type RentalItem } from "@/components/rentals/RentalItemCard";
import RentalItemGrid from "@/components/rentals/RentalItemGrid";

interface ClubRentalsTabProps {
  clubSlug: string;
}

export default function ClubRentalsTab({ clubSlug }: ClubRentalsTabProps) {
  const [items, setItems] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const res = await fetch(`/api/clubs/${clubSlug}/rentals`);
        if (res.ok) {
          const data = await res.json();
          // Add available_quantity (for display only, not booking)
          setItems(data.map((item: any) => ({ ...item, available_quantity: item.quantity_total })));
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    void fetchRentals();
  }, [clubSlug]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30">
        <svg
          className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 font-medium">No rental gear available</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          This club hasn&apos;t added any rental items yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5">
      <RentalItemGrid items={items} readOnly />
    </div>
  );
}
