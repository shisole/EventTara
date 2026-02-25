"use client";

import { useEffect, useRef, useState } from "react";

import DifficultyBadge from "@/components/events/DifficultyBadge";
import { cn } from "@/lib/utils";

interface MountainOption {
  id: string;
  name: string;
  province: string;
  difficulty_level: number;
  elevation_masl: number | null;
}

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
  mountains: MountainOption[];
  selectedMountains: SelectedMountain[];
  onChange: (mountains: SelectedMountain[]) => void;
  loading?: boolean;
}

export default function MountainCombobox({
  mountains,
  selectedMountains,
  onChange,
  loading = false,
}: MountainComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedIds = new Set(selectedMountains.map((m) => m.mountain_id));

  const filtered = mountains.filter(
    (m) =>
      !selectedIds.has(m.id) &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.province.toLowerCase().includes(search.toLowerCase())),
  );

  function addMountain(mountain: MountainOption) {
    const newSelected: SelectedMountain = {
      mountain_id: mountain.id,
      name: mountain.name,
      province: mountain.province,
      difficulty_level: mountain.difficulty_level,
      elevation_masl: mountain.elevation_masl,
      route_name: "",
      difficulty_override: null,
      sort_order: selectedMountains.length,
    };
    onChange([...selectedMountains, newSelected]);
    setSearch("");
  }

  function removeMountain(mountainId: string) {
    const updated = selectedMountains
      .filter((m) => m.mountain_id !== mountainId)
      .map((m, i) => ({ ...m, sort_order: i }));
    onChange(updated);
  }

  function updateMountain(
    mountainId: string,
    field: "route_name" | "difficulty_override",
    value: string | number | null,
  ) {
    onChange(
      selectedMountains.map((m) => (m.mountain_id === mountainId ? { ...m, [field]: value } : m)),
    );
  }

  return (
    <div ref={wrapperRef} className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Mountain(s)
      </label>

      {/* Selected mountains */}
      {selectedMountains.length > 0 && (
        <div className="space-y-2">
          {selectedMountains.map((m, index) => (
            <div
              key={m.mountain_id}
              className="flex flex-col gap-2 p-3 rounded-lg bg-forest-50 dark:bg-forest-900/20 border border-forest-200 dark:border-forest-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">{index + 1}.</span>
                  <span className="font-medium text-sm">{m.name}</span>
                  <span className="text-xs text-gray-500">{m.province}</span>
                  <DifficultyBadge level={m.difficulty_override ?? m.difficulty_level} />
                  {m.elevation_masl && (
                    <span className="text-xs text-gray-400">
                      {m.elevation_masl.toLocaleString()} MASL
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeMountain(m.mountain_id)}
                  className="text-gray-400 hover:text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Route name (optional)"
                  value={m.route_name}
                  onChange={(e) => updateMountain(m.mountain_id, "route_name", e.target.value)}
                  className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
                <select
                  value={m.difficulty_override ?? ""}
                  onChange={(e) =>
                    updateMountain(
                      m.mountain_id,
                      "difficulty_override",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <option value="">Default ({m.difficulty_level}/9)</option>
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}/9
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder={loading ? "Loading mountains..." : "Search mountains..."}
          value={search}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          disabled={loading}
          className={cn(
            "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm",
            loading && "opacity-50",
          )}
        />

        {/* Dropdown */}
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => addMountain(m)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <span className="font-medium text-sm">{m.name}</span>
                  <span className="text-xs text-gray-500">{m.province}</span>
                  <DifficultyBadge level={m.difficulty_level} />
                  {m.elevation_masl && (
                    <span className="text-xs text-gray-400">
                      {m.elevation_masl.toLocaleString()}m
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && !loading && filtered.length === 0 && search && (
          <div className="absolute z-10 mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg text-sm text-gray-500">
            No mountains found
          </div>
        )}
      </div>
    </div>
  );
}
