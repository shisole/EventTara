"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect, useRef, useTransition } from "react";

import { Button } from "@/components/ui";

const EVENT_TYPES = [
  { value: "", label: "All Events" },
  { value: "hiking", label: "Hiking" },
  { value: "mtb", label: "Mountain Biking" },
  { value: "road_bike", label: "Road Biking" },
  { value: "running", label: "Running" },
  { value: "trail_run", label: "Trail Running" },
];

const TIME_FILTERS = [
  { value: "", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "now", label: "Happening Now" },
  { value: "past", label: "Past" },
];

export default function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentType = searchParams.get("type") || "";
  const currentWhen = searchParams.get("when") || "";
  const currentSearch = searchParams.get("search") || "";
  const [searchValue, setSearchValue] = useState(currentSearch);
  const [isSearching, setIsSearching] = useState(false);
  const [optimisticType, setOptimisticType] = useState(currentType);
  const [optimisticWhen, setOptimisticWhen] = useState(currentWhen);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchValue(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    setOptimisticType(currentType);
  }, [currentType]);

  useEffect(() => {
    setOptimisticWhen(currentWhen);
  }, [currentWhen]);

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

  const handleTypeChange = useCallback(
    (type: string) => {
      setOptimisticType(type);
      updateParams({ type });
    },
    [updateParams],
  );

  const handleWhenChange = useCallback(
    (when: string) => {
      setOptimisticWhen(when);
      updateParams({ when });
    },
    [updateParams],
  );

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => {
              handleSearchChange(e.target.value);
            }}
            placeholder="Search events by name or location..."
            className="w-full px-4 pr-10 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => {
                handleSearchChange("");
              }}
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
          onClick={() => {
            updateParams({ search: searchValue });
          }}
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

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide">
        {EVENT_TYPES.map((type) => (
          <Button
            key={type.value}
            variant={optimisticType === type.value ? "primary" : "ghost"}
            size="sm"
            className="whitespace-nowrap shrink-0 sm:shrink min-h-[44px]"
            onClick={() => {
              handleTypeChange(type.value);
            }}
          >
            {type.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide">
        {TIME_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={optimisticWhen === filter.value ? "primary" : "ghost"}
            size="sm"
            className="whitespace-nowrap shrink-0 sm:shrink min-h-[44px]"
            onClick={() => {
              handleWhenChange(filter.value);
            }}
          >
            {filter.value === "now" && optimisticWhen === "now" && (
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-900 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-900" />
              </span>
            )}
            {filter.label}
          </Button>
        ))}
      </div>

      {isPending && (
        <div className="flex justify-center py-2">
          <div className="h-1 w-24 rounded-full bg-lime-500/50 animate-pulse" />
        </div>
      )}
    </div>
  );
}
