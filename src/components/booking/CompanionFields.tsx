"use client";

import { Button } from "@/components/ui";

export interface Companion {
  full_name: string;
  phone: string;
}

interface CompanionFieldsProps {
  companions: Companion[];
  onChange: (companions: Companion[]) => void;
  maxCompanions: number;
}

export default function CompanionFields({
  companions,
  onChange,
  maxCompanions,
}: CompanionFieldsProps) {
  const addCompanion = () => {
    if (companions.length < maxCompanions) {
      onChange([...companions, { full_name: "", phone: "" }]);
    }
  };

  const removeCompanion = (index: number) => {
    onChange(companions.filter((_, i) => i !== index));
  };

  const updateCompanion = (index: number, field: keyof Companion, value: string) => {
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
              onChange={(e) => { updateCompanion(index, "full_name", e.target.value); }}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={companion.phone}
              onChange={(e) => { updateCompanion(index, "phone", e.target.value); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
          <button
            type="button"
            onClick={() => { removeCompanion(index); }}
            className="mt-2 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove companion"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
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
