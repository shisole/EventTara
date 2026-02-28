"use client";

import { useState } from "react";

import DifficultyBadge from "@/components/events/DifficultyBadge";

export interface SelectedMountain {
  mountain_id: string;
  name: string;
  province: string;
  difficulty_level: number;
  elevation_masl: number | null;
  route_name: string;
  difficulty_override: number | null;
  sort_order: number;
}

interface MountainComboboxProps {
  selectedMountains: SelectedMountain[];
  onChange: (mountains: SelectedMountain[]) => void;
}

const DEFAULT_DIFFICULTY = 2;

export default function MountainCombobox({ selectedMountains, onChange }: MountainComboboxProps) {
  const [input, setInput] = useState("");

  function addMountain(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Avoid duplicates by name (case-insensitive)
    if (selectedMountains.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) return;

    const newMountain: SelectedMountain = {
      mountain_id: `custom-${Date.now()}`,
      name: trimmed,
      province: "",
      difficulty_level: DEFAULT_DIFFICULTY,
      elevation_masl: null,
      route_name: "",
      difficulty_override: null,
      sort_order: selectedMountains.length,
    };
    onChange([...selectedMountains, newMountain]);
    setInput("");
  }

  function removeMountain(mountainId: string) {
    const updated = selectedMountains
      .filter((m) => m.mountain_id !== mountainId)
      .map((m, i) => ({ ...m, sort_order: i }));
    onChange(updated);
  }

  function updateDifficulty(mountainId: string, value: number) {
    onChange(
      selectedMountains.map((m) =>
        m.mountain_id === mountainId ? { ...m, difficulty_level: value } : m,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Mountain(s)
      </label>

      {/* Selected mountains */}
      {selectedMountains.length > 0 && (
        <div className="space-y-2">
          {selectedMountains.map((m, index) => (
            <div
              key={m.mountain_id}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800"
            >
              <span className="text-xs font-medium text-gray-400">{index + 1}.</span>
              <span className="font-medium text-sm flex-1">{m.name}</span>
              <select
                value={m.difficulty_override ?? m.difficulty_level}
                onChange={(e) => updateDifficulty(m.mountain_id, Number(e.target.value))}
                className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}/9
                  </option>
                ))}
              </select>
              <DifficultyBadge level={m.difficulty_override ?? m.difficulty_level} />
              <button
                type="button"
                onClick={() => removeMountain(m.mountain_id)}
                className="text-gray-400 hover:text-red-500 text-sm ml-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add mountain input */}
      <input
        type="text"
        placeholder="Type mountain name and press Enter..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addMountain(input);
          }
        }}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
      />
    </div>
  );
}
