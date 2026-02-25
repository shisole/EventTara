"use client";

import { CloseFilledIcon } from "@/components/icons";
import { Button } from "@/components/ui";

export interface Companion {
  full_name: string;
  phone: string;
  event_distance_id?: string;
}

interface DistanceOption {
  id: string;
  distance_km: number;
  label: string | null;
  price: number;
  spots_left: number;
}

interface CompanionFieldsProps {
  companions: Companion[];
  onChange: (companions: Companion[]) => void;
  maxCompanions: number;
  distances?: DistanceOption[];
}

export default function CompanionFields({
  companions,
  onChange,
  maxCompanions,
  distances,
}: CompanionFieldsProps) {
  const hasDistances = distances && distances.length > 0;

  const addCompanion = () => {
    if (companions.length < maxCompanions) {
      onChange([...companions, { full_name: "", phone: "" }]);
    }
  };

  const removeCompanion = (index: number) => {
    onChange(companions.filter((_, i) => i !== index));
  };

  const updateCompanion = (index: number, field: string, value: string) => {
    const updated = companions.map((c, i) => (i === index ? { ...c, [field]: value } : c));
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Companions</h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {maxCompanions - companions.length} spot
          {maxCompanions - companions.length === 1 ? "" : "s"} available
        </span>
      </div>

      {companions.map((companion, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1 space-y-2">
            <input
              type="text"
              placeholder="Full name *"
              value={companion.full_name}
              onChange={(e) => {
                updateCompanion(index, "full_name", e.target.value);
              }}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={companion.phone}
              onChange={(e) => {
                updateCompanion(index, "phone", e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
            {hasDistances && (
              <select
                value={companion.event_distance_id || ""}
                onChange={(e) => {
                  updateCompanion(index, "event_distance_id", e.target.value);
                }}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="">Select distance *</option>
                {distances.map((d) => {
                  const displayLabel = d.label || `${d.distance_km} km`;
                  const isSoldOut = d.spots_left <= 0;
                  return (
                    <option key={d.id} value={d.id} disabled={isSoldOut}>
                      {displayLabel} — ₱{d.price.toLocaleString()}
                      {isSoldOut ? " (Sold out)" : ` (${d.spots_left} left)`}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              removeCompanion(index);
            }}
            className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove companion"
          >
            <CloseFilledIcon className="h-5 w-5" />
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addCompanion}
        disabled={companions.length >= maxCompanions}
        className="w-full"
      >
        + Add a friend
      </Button>
    </div>
  );
}
