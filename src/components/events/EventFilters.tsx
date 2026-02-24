"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef, useTransition, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const ACTIVITIES = [
  {
    slug: "hiking",
    label: "Hiking",
    icon: "🏔️",
    image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop",
  },
  {
    slug: "mtb",
    label: "MTB",
    icon: "🚵",
    image: "https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600&h=400&fit=crop",
  },
  {
    slug: "road_bike",
    label: "Road Bike",
    icon: "🚴",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop",
  },
  {
    slug: "running",
    label: "Running",
    icon: "🏃",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop",
  },
  {
    slug: "trail_run",
    label: "Trail Run",
    icon: "🥾",
    image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=400&fit=crop",
  },
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
  onClear?: () => void;
  popoverClassName?: string;
  /** Render as full-screen modal on mobile instead of popover */
  mobileFullscreen?: boolean;
  children: ReactNode;
}

function FilterChip({
  id,
  label,
  activeLabel,
  isActive,
  isOpen,
  onToggle,
  onClear,
  popoverClassName,
  mobileFullscreen,
  children,
}: FilterChipProps) {
  const chipRef = useRef<HTMLDivElement>(null);

  /* Close on click-outside (only for popover, not fullscreen) */
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
          "flex items-center gap-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
          isActive ? "pl-4 pr-1.5 py-1.5" : "px-4 py-2",
          isActive
            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
        )}
      >
        {isActive ? activeLabel || label : label}
        {isActive && onClear ? (
          /* X button to clear this chip */
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onClear();
              }
            }}
            className="ml-0.5 p-1 rounded-full hover:bg-white/20 dark:hover:bg-gray-900/20 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="h-3.5 w-3.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </span>
        ) : (
          /* Chevron */
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
        )}
      </button>

      {/* Mobile: bottom sheet (all chips) / fullscreen (date) */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex flex-col sm:hidden",
            mobileFullscreen ? "" : "justify-end",
          )}
        >
          {/* Backdrop */}
          {!mobileFullscreen && (
            /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
            <div className="absolute inset-0 bg-black/30" onClick={() => onToggle("")} />
          )}
          <div
            className={cn(
              "relative bg-white dark:bg-gray-800 flex flex-col",
              mobileFullscreen ? "flex-1" : "max-h-[70vh] rounded-t-2xl",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {label}
              </span>
              <button
                type="button"
                onClick={() => onToggle("")}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div
              className={cn(
                "flex-1 min-h-0",
                mobileFullscreen ? "flex flex-col" : "overflow-y-auto",
              )}
            >
              {children}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: normal popover */}
      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg z-50 hidden sm:block",
            popoverClassName ?? "min-w-[200px]",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CalendarPicker                                                    */
/* ------------------------------------------------------------------ */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Format Date to YYYY-MM-DD */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get days to render for a month grid (including leading/trailing blanks) */
function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  // Leading blanks
  for (let i = 0; i < firstDay; i++) cells.push(null);
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return cells;
}

interface CalendarPickerProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onApply: () => void;
  onClear: () => void;
}

function CalendarPicker({
  from,
  to,
  onFromChange,
  onToChange,
  onApply,
  onClear,
}: CalendarPickerProps) {
  const today = new Date();
  const todayStr = toDateStr(today);

  // Base month for left calendar
  const [baseYear, setBaseYear] = useState(today.getFullYear());
  const [baseMonth, setBaseMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (baseMonth === 0) {
      setBaseYear((y) => y - 1);
      setBaseMonth(11);
    } else {
      setBaseMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (baseMonth === 11) {
      setBaseYear((y) => y + 1);
      setBaseMonth(0);
    } else {
      setBaseMonth((m) => m + 1);
    }
  };

  // Second month
  const secondMonth = baseMonth === 11 ? 0 : baseMonth + 1;
  const secondYear = baseMonth === 11 ? baseYear + 1 : baseYear;

  const handleDayClick = (dateStr: string) => {
    if (!from || (from && to)) {
      // Start new selection
      onFromChange(dateStr);
      onToChange("");
    } else {
      // Set end date — swap if needed
      if (dateStr < from) {
        onToChange(from);
        onFromChange(dateStr);
      } else if (dateStr === from) {
        // Clicking same day = single day range
        onToChange(dateStr);
      } else {
        onToChange(dateStr);
      }
    }
  };

  const renderMonth = (year: number, month: number) => {
    const days = getMonthDays(year, month);

    return (
      <div className="flex-1 min-w-0">
        <div className="text-center text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {MONTH_NAMES[month]} {year}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {/* Weekday headers */}
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1"
            >
              {d}
            </div>
          ))}
          {/* Day cells */}
          {days.map((date, i) => {
            if (!date) {
              return <div key={`blank-${i}`} />;
            }
            const dateStr = toDateStr(date);
            const isToday = dateStr === todayStr;
            const isFrom = dateStr === from;
            const isTo = dateStr === to;
            const isEndpoint = isFrom || isTo;
            const isInRange = from && to && dateStr > from && dateStr < to;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  "relative h-9 text-sm transition-colors",
                  // Range background (full cell width)
                  isInRange && "bg-lime-100 dark:bg-lime-900/30",
                  // From endpoint: right half has range color
                  isFrom &&
                    to &&
                    "bg-gradient-to-r from-transparent to-lime-100 dark:to-lime-900/30",
                  // To endpoint: left half has range color
                  isTo &&
                    from &&
                    "bg-gradient-to-l from-transparent to-lime-100 dark:to-lime-900/30",
                )}
              >
                <span
                  className={cn(
                    "relative z-10 flex items-center justify-center w-9 h-9 mx-auto rounded-full transition-colors",
                    isEndpoint
                      ? "bg-lime-500 text-white font-semibold"
                      : isToday
                        ? "ring-1 ring-lime-500 text-lime-600 dark:text-lime-400 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                  )}
                >
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation + months */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Two-month grid: stack on mobile, side-by-side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-4">
          {renderMonth(baseYear, baseMonth)}
          {renderMonth(secondYear, secondMonth)}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-3 py-2">
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={!from}
          className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Parse comma-separated type param into a Set */
function parseTypes(param: string): Set<string> {
  if (!param) return new Set();
  return new Set(param.split(",").filter(Boolean));
}

/** Serialize a Set of types into a comma-separated string */
function serializeTypes(types: Set<string>): string {
  return [...types].join(",");
}

const ALL_SLUGS = new Set(ACTIVITIES.map((a) => a.slug));

/** Check if all activities are selected (equivalent to no filter) */
function isAllSelected(types: Set<string>): boolean {
  return (
    types.size === 0 || (types.size === ALL_SLUGS.size && [...ALL_SLUGS].every((s) => types.has(s)))
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
  const currentTypeParam = searchParams.get("type") ?? "";
  const currentTypes = parseTypes(currentTypeParam);
  const currentWhen = searchParams.get("when") ?? "";
  const currentSearch = searchParams.get("search") ?? "";
  const currentOrgParam = searchParams.get("org") ?? "";
  const currentOrgs = parseTypes(currentOrgParam);
  const currentGuideParam = searchParams.get("guide") ?? "";
  const currentGuides = parseTypes(currentGuideParam);
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  /* Local state */
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [isSearching, setIsSearching] = useState(false);
  const [openId, setOpenId] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /* Draft state — only needed for Date (two fields) */
  const [draftFrom, setDraftFrom] = useState(currentFrom);
  const [draftTo, setDraftTo] = useState(currentTo);

  /* Sync search value with URL */
  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  /* Sync date drafts when URL changes (e.g. browser back) */
  useEffect(() => setDraftFrom(currentFrom), [currentFrom]);
  useEffect(() => setDraftTo(currentTo), [currentTo]);

  /* Notify parent of pending state */
  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  /* Reset date drafts when date popover opens */
  const handleToggle = useCallback(
    (id: string) => {
      if (id === "date") {
        setDraftFrom(currentFrom);
        setDraftTo(currentTo);
      }
      setOpenId(id);
    },
    [currentFrom, currentTo],
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

  /* ---- Activity type toggle (multi-select) ---- */
  const toggleType = useCallback(
    (slug: string) => {
      const next = new Set(currentTypes);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      const updates: Record<string, string> = { type: serializeTypes(next) };
      // If hiking is no longer selected, clear guide filter
      if (!next.has("hiking")) updates.guide = "";
      updateParams(updates);
    },
    [currentTypes, updateParams],
  );

  /* Select all activities (clears type param = show everything) */
  const selectAllTypes = useCallback(() => {
    updateParams({ type: "", guide: "" });
  }, [updateParams]);

  /* Clear all filters at once */
  const clearAllFilters = useCallback(() => {
    updateParams({ type: "", when: "", from: "", to: "", org: "", guide: "", search: "" });
    setSearchValue("");
  }, [updateParams]);

  /* Whether any filter is active */
  const hasActiveFilters =
    currentTypeParam !== "" ||
    currentWhen !== "" ||
    currentOrgParam !== "" ||
    currentGuideParam !== "" ||
    currentFrom !== "" ||
    currentTo !== "" ||
    currentSearch !== "";

  /* ---- Instant-apply helpers (toggle: click again to deselect) ---- */
  const selectWhen = useCallback(
    (value: string) => {
      const next = value === currentWhen ? "" : value;
      // Mutual exclusion: selecting When clears from/to
      updateParams({ when: next, from: "", to: "" });
      setOpenId("");
    },
    [currentWhen, updateParams],
  );

  const toggleOrg = useCallback(
    (value: string) => {
      const next = new Set(currentOrgs);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      updateParams({ org: serializeTypes(next) });
    },
    [currentOrgs, updateParams],
  );

  const toggleGuide = useCallback(
    (value: string) => {
      const next = new Set(currentGuides);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      updateParams({ guide: serializeTypes(next) });
    },
    [currentGuides, updateParams],
  );

  /* ---- Date chip still uses Apply/Clear ---- */
  const applyDate = useCallback(() => {
    updateParams({ from: draftFrom, to: draftTo, when: "" });
    setOpenId("");
  }, [draftFrom, draftTo, updateParams]);

  const clearDate = useCallback(() => {
    setDraftFrom("");
    setDraftTo("");
  }, []);

  /* ---- Derive active labels ---- */
  const whenLabelMap: Record<string, string> = {};
  for (const t of TIME_FILTERS) whenLabelMap[t.value] = t.label;

  const orgLabel =
    currentOrgs.size === 1
      ? organizers.find((o) => currentOrgs.has(o.id))?.name
      : currentOrgs.size > 1
        ? `${currentOrgs.size} organizers`
        : undefined;

  const guideLabel =
    currentGuides.size === 1
      ? guides.find((g) => currentGuides.has(g.id))?.name
      : currentGuides.size > 1
        ? `${currentGuides.size} guides`
        : undefined;

  const dateLabel =
    currentFrom && currentTo
      ? `${currentFrom} - ${currentTo}`
      : currentFrom
        ? `From ${currentFrom}`
        : currentTo
          ? `To ${currentTo}`
          : undefined;

  /* Only show Guide chip when hiking is among selected types */
  const showGuideChip = currentTypes.has("hiking");

  return (
    <div className="space-y-4">
      {/* Activity type selector — grid on mobile, horizontal row on sm+ */}
      <div className="grid grid-cols-3 gap-3 py-3 sm:flex sm:justify-center sm:gap-5 sm:overflow-x-auto sm:-mx-0 sm:px-0 scrollbar-hide">
        {/* All Activity avatar */}
        <button
          type="button"
          onClick={selectAllTypes}
          className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group"
        >
          <div
            className={cn(
              "relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center bg-gray-100 dark:bg-gray-700",
              isAllSelected(currentTypes)
                ? "border-lime-500 ring-2 ring-lime-300 dark:ring-lime-700 scale-105"
                : "border-gray-200 dark:border-gray-600 opacity-70 group-hover:opacity-100 group-hover:border-gray-300 dark:group-hover:border-gray-500",
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500 dark:text-gray-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
              />
            </svg>
          </div>
          <span
            className={cn(
              "text-[10px] sm:text-xs font-medium transition-colors",
              isAllSelected(currentTypes)
                ? "text-lime-600 dark:text-lime-400"
                : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300",
            )}
          >
            All
          </span>
        </button>

        {ACTIVITIES.map((activity) => {
          const isActive = !isAllSelected(currentTypes) && currentTypes.has(activity.slug);
          return (
            <button
              key={activity.slug}
              type="button"
              onClick={() => toggleType(activity.slug)}
              className="flex flex-col items-center gap-1 sm:gap-1.5 shrink-0 group"
            >
              <div
                className={cn(
                  "relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 transition-all",
                  isActive
                    ? "border-lime-500 ring-2 ring-lime-300 dark:ring-lime-700 scale-105"
                    : "border-gray-200 dark:border-gray-600 opacity-70 group-hover:opacity-100 group-hover:border-gray-300 dark:group-hover:border-gray-500",
                )}
              >
                <Image
                  src={activity.image}
                  alt={activity.label}
                  fill
                  sizes="(max-width: 640px) 56px, 64px"
                  className="object-cover"
                />
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-medium transition-colors",
                  isActive
                    ? "text-lime-600 dark:text-lime-400"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300",
                )}
              >
                {activity.label}
              </span>
            </button>
          );
        })}
      </div>

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

      {/* Chip bar — wrap on mobile, horizontal scroll on sm+ */}
      <div
        className={cn(
          "flex items-center gap-2 pb-1 sm:-mx-0 sm:px-0 scrollbar-hide",
          openId ? "overflow-visible" : "flex-wrap sm:flex-nowrap sm:overflow-x-auto",
        )}
      >
        {/* ---- When chip ---- */}
        <FilterChip
          id="when"
          label="When"
          activeLabel={whenLabelMap[currentWhen]}
          isActive={!!currentWhen}
          isOpen={openId === "when"}
          onToggle={handleToggle}
          onClear={() => updateParams({ when: "" })}
        >
          <div className="p-3 space-y-1">
            {TIME_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => selectWhen(f.value)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center",
                  currentWhen === f.value
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
        </FilterChip>

        {/* ---- Date chip (calendar picker) ---- */}
        <FilterChip
          id="date"
          label="Date"
          activeLabel={dateLabel}
          isActive={!!(currentFrom || currentTo)}
          isOpen={openId === "date"}
          onToggle={handleToggle}
          onClear={() => updateParams({ from: "", to: "" })}
          mobileFullscreen
          popoverClassName="sm:w-[580px]"
        >
          <CalendarPicker
            from={draftFrom}
            to={draftTo}
            onFromChange={setDraftFrom}
            onToChange={setDraftTo}
            onApply={applyDate}
            onClear={clearDate}
          />
        </FilterChip>

        {/* ---- Organizer chip (multi-select) ---- */}
        {organizers.length > 0 && (
          <FilterChip
            id="org"
            label="Organizer"
            activeLabel={orgLabel}
            isActive={currentOrgs.size > 0}
            isOpen={openId === "org"}
            onToggle={handleToggle}
            onClear={() => updateParams({ org: "" })}
          >
            <div className="p-3 space-y-1 max-h-[200px] overflow-y-auto">
              {organizers.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleOrg(o.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                    currentOrgs.has(o.id)
                      ? "bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0",
                      currentOrgs.has(o.id)
                        ? "bg-lime-500 border-lime-500 text-white"
                        : "border-gray-300 dark:border-gray-600",
                    )}
                  >
                    {currentOrgs.has(o.id) && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        className="h-3 w-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </span>
                  {o.name}
                </button>
              ))}
            </div>
          </FilterChip>
        )}

        {/* ---- Guide chip (only when hiking is selected, multi-select) ---- */}
        {showGuideChip && guides.length > 0 && (
          <FilterChip
            id="guide"
            label="Guide"
            activeLabel={guideLabel}
            isActive={currentGuides.size > 0}
            isOpen={openId === "guide"}
            onToggle={handleToggle}
            onClear={() => updateParams({ guide: "" })}
          >
            <div className="p-3 space-y-1 max-h-[200px] overflow-y-auto">
              {guides.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGuide(g.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                    currentGuides.has(g.id)
                      ? "bg-gray-100 dark:bg-gray-700 font-medium text-gray-900 dark:text-gray-100"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0",
                      currentGuides.has(g.id)
                        ? "bg-lime-500 border-lime-500 text-white"
                        : "border-gray-300 dark:border-gray-600",
                    )}
                  >
                    {currentGuides.has(g.id) && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                        stroke="currentColor"
                        className="h-3 w-3"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </span>
                  {g.name}
                </button>
              ))}
            </div>
          </FilterChip>
        )}

        {/* ---- Clear all button ---- */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="shrink-0 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
