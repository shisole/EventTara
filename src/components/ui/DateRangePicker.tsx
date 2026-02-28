"use client";

import { format } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

export interface EventDateInfo {
  date: string;
  end_date: string | null;
  title: string;
}

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  startTime: string;
  endTime: string;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  eventDates?: EventDateInfo[];
}

/** Strip time from a Date to get midnight-local */
function toDateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateKey(d: Date): string {
  return `${String(d.getFullYear())}-${String(d.getMonth())}-${String(d.getDate())}`;
}

export default function DateRangePicker({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  eventDates,
}: DateRangePickerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = globalThis.matchMedia("(max-width: 640px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Compute indicator dates (days with any event) and blocked dates (multi-day events)
  const { indicatorDates, blockedDates } = useMemo(() => {
    if (!eventDates || eventDates.length === 0) return { indicatorDates: [], blockedDates: [] };

    const indicatorSet = new Map<string, Date>();
    const blockedSet = new Map<string, Date>();

    for (const evt of eventDates) {
      const start = toDateOnly(new Date(evt.date));

      indicatorSet.set(dateKey(start), start);

      if (evt.end_date) {
        const end = toDateOnly(new Date(evt.end_date));
        const isMultiDay = end.getTime() !== start.getTime();

        if (isMultiDay) {
          // Block all days in multi-day range
          const current = new Date(start);
          while (current <= end) {
            const k = dateKey(current);
            const d = new Date(current);
            blockedSet.set(k, d);
            indicatorSet.set(k, d);
            current.setDate(current.getDate() + 1);
          }
        }
      }
    }

    return {
      indicatorDates: [...indicatorSet.values()],
      blockedDates: [...blockedSet.values()],
    };
  }, [eventDates]);

  const noDate: Date | undefined = undefined;
  const resetEndDate = () => onEndDateChange(noDate);

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;

    if (!startDate || (startDate && endDate)) {
      // First click or resetting range
      onStartDateChange(date);
      resetEndDate();
    } else if (date.getTime() === startDate.getTime()) {
      // Same date clicked - single-day event
      resetEndDate();
    } else if (date < startDate) {
      // Clicked date before start - make it the new start
      onStartDateChange(date);
      onEndDateChange(startDate);
    } else {
      // Clicked date after start - set as end
      onEndDateChange(date);
    }
  };

  const formatDateRange = () => {
    if (!startDate) return "";
    if (!endDate || endDate.getTime() === startDate.getTime()) {
      return format(startDate, "MMM d, yyyy");
    }
    return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  const disabledMatchers: ({ before: Date } | Date)[] = [{ before: new Date() }];
  if (blockedDates.length > 0) {
    disabledMatchers.push(...blockedDates);
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Date & Time
      </label>

      {/* CSS for event indicator dots */}
      {indicatorDates.length > 0 && (
        <style>{`
          .day-has-event {
            position: relative;
          }
          .day-has-event::after {
            content: '';
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background-color: #f59e0b;
          }
          .dark .day-has-event::after {
            background-color: #fbbf24;
          }
        `}</style>
      )}

      <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-4 space-y-4">
        <DayPicker
          mode="range"
          numberOfMonths={isMobile ? 1 : 2}
          selected={
            startDate && endDate
              ? { from: startDate, to: endDate }
              : startDate
                ? { from: startDate, to: startDate }
                : undefined
          }
          onDayClick={handleDayClick}
          disabled={disabledMatchers}
          modifiers={{
            hasEvent: indicatorDates,
          }}
          modifiersClassNames={{
            hasEvent: "day-has-event",
          }}
          classNames={{
            root: "text-gray-900 dark:text-gray-100",
            months: "relative flex justify-center gap-6",
            month_caption: "flex justify-center items-center h-10 text-sm font-semibold",
            nav: "absolute top-0 left-0 right-0 flex items-center justify-between z-10",
            button_previous: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
            ),
            button_next: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
            ),
            month_grid: "w-full border-collapse space-y-1",
            weekdays: "flex",
            weekday: cn(
              "text-gray-500 dark:text-gray-400 rounded-md font-normal text-[0.8rem] uppercase",
              isMobile ? "w-9" : "w-11",
            ),
            week: "flex w-full mt-2",
            day: cn(
              "text-center text-sm p-0 relative",
              isMobile ? "h-9 w-9" : "h-11 w-11",
              "[&:has([aria-selected].range_start)]:rounded-l-md [&:has([aria-selected].range_end)]:rounded-r-md",
              "[&:has([aria-selected].range_middle)]:rounded-none",
              "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              "focus-within:relative focus-within:z-20",
            ),
            day_button: cn(
              "p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
              isMobile ? "h-9 w-9" : "h-11 w-11",
            ),
            range_start:
              "bg-lime-500 text-white hover:bg-lime-600 dark:bg-lime-600 dark:hover:bg-lime-700",
            range_end:
              "bg-lime-500 text-white hover:bg-lime-600 dark:bg-lime-600 dark:hover:bg-lime-700",
            range_middle: "bg-lime-100 dark:bg-lime-900/30 text-gray-900 dark:text-gray-100",
            selected:
              "bg-lime-500 text-white hover:bg-lime-600 dark:bg-lime-600 dark:hover:bg-lime-700",
            today: "bg-gray-100 dark:bg-gray-700 font-semibold",
            outside: "text-gray-400 dark:text-gray-600 opacity-50",
            disabled: "text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed",
            hidden: "invisible",
          }}
        />

        {/* Selected range summary */}
        {startDate && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Selected:{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatDateRange()}
              </span>
            </p>
          </div>
        )}

        {/* Time inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="start-time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Start / Meet-up Time
            </label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                "focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800",
                "outline-none transition-colors",
              )}
              required
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="end-time"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              End Time{" "}
              <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className={cn(
                "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                "focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800",
                "outline-none transition-colors",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
