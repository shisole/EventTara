"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef, useTransition, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const EVENT_TYPES = [
  { value: "hiking", label: "Hiking" },
  { value: "mtb", label: "Mountain Biking" },
  { value: "road_bike", label: "Road Biking" },
  { value: "running", label: "Running" },
  { value: "trail_run", label: "Trail Running" },
];

const TIME_FILTERS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "now", label: "Happening Now" },
  { value: "past", label: "Past" },
];

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface FilterOption {
  id: string;
  name: string;
}

interface EventFiltersProps {
  organizers?: FilterOption[];
  guides?: FilterOption[];
  onPendingChange?: (pending: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  FilterChip                                                        */
/* ------------------------------------------------------------------ */

interface FilterChipProps {
  id: string;
  label: string;
  activeLabel?: string;
  isActive: boolean;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}

function FilterChip({
  id,
  label,
  activeLabel,
  isActive,
  isOpen,
  onToggle,
  children,
}: FilterChipProps) {
  const chipRef = useRef<HTMLDivElement>(null);

  /* Close on click-outside */
  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (chipRef.current && !chipRef.current.contains(e.target as Node)) {
        onToggle("");
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, onToggle]);

  return (
    <div ref={chipRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => onToggle(isOpen ? "" : id)}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
          isActive
            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
        )}
      >
        {isActive ? activeLabel || label : label}
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 min-w-[200px] rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50">
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export default function EventFilters({
  organizers = [],
  guides = [],
  onPendingChange,
}: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /* Current URL param values */
  const currentType = searchParams.get("type") || "";
  const currentWhen = searchParams.get("when") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentOrg = searchParams.get("org") || "";
  const currentGuide = searchParams.get("guide") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  /* Local state */
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [isSearching, setIsSearching] = useState(false);
  const [openId, setOpenId] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /* Draft state for popovers (applied on "Apply" click) */
  const [draftType, setDraftType] = useState(currentType);
  const [draftWhen, setDraftWhen] = useState(currentWhen);
  const [draftFrom, setDraftFrom] = useState(currentFrom);
  const [draftTo, setDraftTo] = useState(currentTo);
  const [draftOrg, setDraftOrg] = useState(currentOrg);
  const [draftGuide, setDraftGuide] = useState(currentGuide);

  /* Sync search value with URL */
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  /* Sync drafts when URL changes (e.g. browser back) */
  useEffect(() => setDraftType(currentType), [currentType]);
  useEffect(() => setDraftWhen(currentWhen), [currentWhen]);
  useEffect(() => setDraftFrom(currentFrom), [currentFrom]);
  useEffect(() => setDraftTo(currentTo), [currentTo]);
  useEffect(() => setDraftOrg(currentOrg), [currentOrg]);
  useEffect(() => setDraftGuide(currentGuide), [currentGuide]);

  /* Notify parent of pending state */
  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  /* Reset drafts when popover opens */
  const handleToggle = useCallback(
    (id: string) => {
      if (id) {
        // Opening a popover — reset draft to current URL values
        setDraftType(currentType);
        setDraftWhen(currentWhen);
        setDraftFrom(currentFrom);
        setDraftTo(currentTo);
        setDraftOrg(currentOrg);
        setDraftGuide(currentGuide);
      }
      setOpenId(id);
    },
    [currentType, currentWhen, currentFrom, currentTo, currentOrg, currentGuide],
  );

  /* ---- URL update helper ---- */
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      startTransition(() => {
        router.push(`/events?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  /* ---- Search ---- */
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      setIsSearching(true);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        updateParams({ search: value });
        setIsSearching(false);
      }, 400);
    },
    [updateParams],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /* ---- Apply helpers for each chip ---- */
  const applyType = useCallback(() => {
    const updates: Record<string, string> = { type: draftType };
    // If changing away from hiking, clear guide
    if (draftType !== "hiking") {
      updates.guide = "";
    }
    updateParams(updates);
    setOpenId("");
  }, [draftType, updateParams]);

  const clearType = useCallback(() => {
    setDraftType("");
  }, []);

  const applyWhen = useCallback(() => {
    // Mutual exclusion: selecting When clears from/to
    updateParams({ when: draftWhen, from: "", to: "" });
    setOpenId("");
  }, [draftWhen, updateParams]);

  const clearWhen = useCallback(() => {
    setDraftWhen("");
  }, []);

  const applyDate = useCallback(() => {
    // Mutual exclusion: selecting date clears when
    updateParams({ from: draftFrom, to: draftTo, when: "" });
    setOpenId("");
  }, [draftFrom, draftTo, updateParams]);

  const clearDate = useCallback(() => {
    setDraftFrom("");
    setDraftTo("");
  }, []);

  const applyOrg = useCallback(() => {
    updateParams({ org: draftOrg });
    setOpenId("");
  }, [draftOrg, updateParams]);

  const clearOrg = useCallback(() => {
    setDraftOrg("");
  }, []);

  const applyGuide = useCallback(() => {
    updateParams({ guide: draftGuide });
    setOpenId("");
  }, [draftGuide, updateParams]);

  const clearGuide = useCallback(() => {
    setDraftGuide("");
  }, []);

  /* ---- Derive active labels ---- */
  const typeLabelMap: Record<string, string> = {};
  for (const t of EVENT_TYPES) typeLabelMap[t.value] = t.label;

  const whenLabelMap: Record<string, string> = {};
  for (const t of TIME_FILTERS) whenLabelMap[t.value] = t.label;

  const orgName = organizers.find((o) => o.id === currentOrg)?.name;
  const guideName = guides.find((g) => g.id === currentGuide)?.name;

  const dateLabel =
    currentFrom && currentTo
      ? `${currentFrom} - ${currentTo}`
      : currentFrom
        ? `From ${currentFrom}`
        : currentTo
          ? `To ${currentTo}`
          : undefined;

  /* Only show Guide chip when current type is hiking */
  const showGuideChip = currentType === "hiking" || draftType === "hiking";

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search events by name or location..."
            className="w-full px-4 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={isSearching}
          onClick={() => updateParams({ search: searchValue })}
          className="shrink-0 h-[50px] w-[50px] flex items-center justify-center rounded-xl bg-lime-500 hover:bg-lime-400 text-gray-900 transition-colors disabled:opacity-70"
        >
          {isSearching ? (
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Chip bar */}
      <div
        className={cn(
          "flex gap-2 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide",
          openId ? "overflow-visible" : "overflow-x-auto",
        )}
      >
        {/* ---- Type chip ---- */}
        <FilterChip
          id="type"
          label="Type"
          activeLabel={typeLabelMap[currentType]}
          isActive={!!currentType}
          isOpen={openId === "type"}
          onToggle={handleToggle}
        >
          <div className="p-3 space-y-1">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setDraftType(t.value)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  draftType === t.value
                    ? "bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <button
              type="button"
              onClick={clearType}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={applyType}
              className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300"
            >
              Apply
            </button>
          </div>
        </FilterChip>

        {/* ---- When chip ---- */}
        <FilterChip
          id="when"
          label="When"
          activeLabel={whenLabelMap[currentWhen]}
          isActive={!!currentWhen}
          isOpen={openId === "when"}
          onToggle={handleToggle}
        >
          <div className="p-3 space-y-1">
            {TIME_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setDraftWhen(f.value)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center",
                  draftWhen === f.value
                    ? "bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750",
                )}
              >
                {f.value === "now" && (
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <button
              type="button"
              onClick={clearWhen}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={applyWhen}
              className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300"
            >
              Apply
            </button>
          </div>
        </FilterChip>

        {/* ---- Date chip ---- */}
        <FilterChip
          id="date"
          label="Date"
          activeLabel={dateLabel}
          isActive={!!(currentFrom || currentTo)}
          isOpen={openId === "date"}
          onToggle={handleToggle}
        >
          <div className="p-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                From
              </label>
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:border-lime-500 focus:ring-1 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                To
              </label>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:border-lime-500 focus:ring-1 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <button
              type="button"
              onClick={clearDate}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={applyDate}
              className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300"
            >
              Apply
            </button>
          </div>
        </FilterChip>

        {/* ---- Organizer chip ---- */}
        {organizers.length > 0 && (
          <FilterChip
            id="org"
            label="Organizer"
            activeLabel={orgName}
            isActive={!!currentOrg}
            isOpen={openId === "org"}
            onToggle={handleToggle}
          >
            <div className="p-3 space-y-1 max-h-[200px] overflow-y-auto">
              {organizers.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setDraftOrg(o.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    draftOrg === o.id
                      ? "bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750",
                  )}
                >
                  {o.name}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-2">
              <button
                type="button"
                onClick={clearOrg}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyOrg}
                className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300"
              >
                Apply
              </button>
            </div>
          </FilterChip>
        )}

        {/* ---- Guide chip (only when type is hiking) ---- */}
        {showGuideChip && guides.length > 0 && (
          <FilterChip
            id="guide"
            label="Guide"
            activeLabel={guideName}
            isActive={!!currentGuide}
            isOpen={openId === "guide"}
            onToggle={handleToggle}
          >
            <div className="p-3 space-y-1 max-h-[200px] overflow-y-auto">
              {guides.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setDraftGuide(g.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    draftGuide === g.id
                      ? "bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750",
                  )}
                >
                  {g.name}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-2">
              <button
                type="button"
                onClick={clearGuide}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={applyGuide}
                className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300"
              >
                Apply
              </button>
            </div>
          </FilterChip>
        )}
      </div>
    </div>
  );
}
