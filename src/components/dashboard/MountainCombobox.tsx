"use client";

import { useEffect, useRef, useState } from "react";

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

interface ApiMountain {
  id: string;
  name: string;
  province: string;
  difficulty_level: number;
  elevation_masl: number | null;
}

interface MountainComboboxProps {
  selectedMountains: SelectedMountain[];
  onChange: (mountains: SelectedMountain[]) => void;
}

const DEFAULT_DIFFICULTY = 2;

export default function MountainCombobox({ selectedMountains, onChange }: MountainComboboxProps) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<ApiMountain[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Search mountains from API with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = input.trim();
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/mountains?search=${encodeURIComponent(query)}`);
        const json: { mountains: ApiMountain[] } = await res.json();
        // Filter out already-selected mountains
        const selectedIds = new Set(selectedMountains.map((m) => m.mountain_id));
        const filtered = (json.mountains || []).filter((m) => !selectedIds.has(m.id));
        setResults(filtered);
        setOpen(true);
        setHighlightIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, selectedMountains]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target: Node | null = e.target instanceof Node ? e.target : null;
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectApiMountain(mountain: ApiMountain) {
    if (selectedMountains.some((m) => m.mountain_id === mountain.id)) return;

    const selected: SelectedMountain = {
      mountain_id: mountain.id,
      name: mountain.name,
      province: mountain.province,
      difficulty_level: mountain.difficulty_level,
      elevation_masl: mountain.elevation_masl,
      route_name: "",
      difficulty_override: null,
      sort_order: selectedMountains.length,
    };
    onChange([...selectedMountains, selected]);
    setInput("");
    setOpen(false);
  }

  function addCustomMountain() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (selectedMountains.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) return;

    const custom: SelectedMountain = {
      mountain_id: `custom-${Date.now()}`,
      name: trimmed,
      province: "",
      difficulty_level: DEFAULT_DIFFICULTY,
      elevation_masl: null,
      route_name: "",
      difficulty_override: null,
      sort_order: selectedMountains.length,
    };
    onChange([...selectedMountains, custom]);
    setInput("");
    setOpen(false);
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

  // Total items in dropdown: results + optional "Add custom" row
  const showAddCustom = input.trim().length >= 2 && !loading;
  const totalItems = results.length + (showAddCustom ? 1 : 0);

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          selectApiMountain(results[highlightIndex]);
        } else if (highlightIndex === results.length && showAddCustom) {
          addCustomMountain();
        } else if (results.length === 0 && showAddCustom) {
          addCustomMountain();
        }
        break;
      }
      case "Escape": {
        setOpen(false);
        break;
      }
    }
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
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">{m.name}</span>
                {m.province && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
                    {m.province}
                  </span>
                )}
              </div>
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

      {/* Search combobox */}
      <div ref={containerRef} className="relative">
        <input
          type="text"
          placeholder="Search mountains..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => {
            if (results.length > 0 || (input.trim().length >= 2 && !loading)) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-lime-500" />
          </div>
        )}

        {/* Dropdown */}
        {open && (results.length > 0 || showAddCustom) && (
          <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
            {results.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selectApiMountain(m)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                  highlightIndex === i ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
              >
                <div>
                  <span className="font-medium">{m.name}</span>
                  {m.province && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
                      {m.province}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {m.elevation_masl && <span>{m.elevation_masl}m</span>}
                  <DifficultyBadge level={m.difficulty_level} />
                </div>
              </button>
            ))}
            {showAddCustom && (
              <button
                type="button"
                onClick={addCustomMountain}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700 ${
                  highlightIndex === results.length ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
              >
                <span className="text-lime-600 dark:text-lime-400">+ Add</span>{" "}
                <span className="font-medium">&quot;{input.trim()}&quot;</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1.5">
                  (custom mountain)
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
