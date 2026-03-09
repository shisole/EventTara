"use client";

import { cn } from "@/lib/utils";

interface ClubOption {
  id: string;
  name: string;
  slug: string;
}

interface ClubSelectorProps {
  clubs: ClubOption[];
  value: string;
  onChange: (clubId: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function ClubSelector({
  clubs,
  value,
  onChange,
  className,
  disabled,
}: ClubSelectorProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor="club-select"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Club
      </label>
      <select
        id="club-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
      >
        <option value="">Select a club...</option>
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </div>
  );
}
