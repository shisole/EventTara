"use client";

import { addMonths, format, isSameDay, isSameMonth, isWithinInterval, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

type EventType = "hiking" | "mtb" | "road_bike" | "running" | "trail_run";
type EventStatus = "draft" | "published" | "completed" | "cancelled";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  type: EventType;
  status: EventStatus;
}

const typeLabels: Record<EventType, string> = {
  hiking: "Hiking",
  mtb: "Mountain Biking",
  road_bike: "Road Biking",
  running: "Running",
  trail_run: "Trail Running",
};

const typeDotColors: Record<EventType, string> = {
  hiking: "bg-forest-500",
  mtb: "bg-teal-500",
  road_bike: "bg-blue-500",
  running: "bg-golden-500",
  trail_run: "bg-amber-500",
};

const typeBgColors: Record<EventType, string> = {
  hiking: "bg-forest-100 dark:bg-forest-900/40",
  mtb: "bg-teal-100 dark:bg-teal-900/40",
  road_bike: "bg-blue-100 dark:bg-blue-900/40",
  running: "bg-golden-100 dark:bg-golden-900/40",
  trail_run: "bg-amber-100 dark:bg-amber-900/40",
};

const typeChipText: Record<EventType, string> = {
  hiking: "text-forest-700 dark:text-forest-300",
  mtb: "text-teal-700 dark:text-teal-300",
  road_bike: "text-blue-700 dark:text-blue-300",
  running: "text-golden-700 dark:text-golden-300",
  trail_run: "text-amber-700 dark:text-amber-300",
};

interface EventsCalendarProps {
  events: CalendarEvent[];
}

export default function EventsCalendar({ events }: EventsCalendarProps) {
  const router = useRouter();
  const today = new Date();
  const [month, setMonth] = useState(today);
  const [isDesktop, setIsDesktop] = useState(false);
  const [popover, setPopover] = useState<{
    x: number;
    y: number;
    events: CalendarEvent[];
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mql = globalThis.matchMedia("(min-width: 768px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const eventsForDay = useCallback(
    (day: Date) => {
      const d = startOfDay(day);
      return events.filter((evt) => {
        const start = startOfDay(new Date(evt.date));
        const end = evt.end_date ? startOfDay(new Date(evt.end_date)) : start;
        return isSameDay(d, start) || isSameDay(d, end) || isWithinInterval(d, { start, end });
      });
    },
    [events],
  );

  const handleDayClick = (day: Date, target: HTMLElement) => {
    const dayEvents = eventsForDay(day);
    if (dayEvents.length === 0) {
      setPopover(null);
      return;
    }
    if (dayEvents.length === 1) {
      setPopover(null);
      router.push(`/dashboard/events/${dayEvents[0].id}`);
      return;
    }
    // Multiple events — show popover
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (containerRect) {
      setPopover({
        x: targetRect.left - containerRect.left + targetRect.width / 2,
        y: targetRect.bottom - containerRect.top + 4,
        events: dayEvents,
      });
    }
  };

  // Desktop: bigger cells with event names
  const desktopClassNames = {
    root: "text-gray-900 dark:text-gray-100 w-full",
    months: "relative w-full",
    month: "w-full",
    month_caption: "hidden",
    nav: "hidden",
    button_previous: "hidden",
    button_next: "hidden",
    month_grid: "w-full border-collapse table-fixed",
    weekdays: "flex w-full",
    weekday: cn(
      "flex-1 text-gray-500 dark:text-gray-400 font-medium text-sm uppercase",
      "text-center py-3 border-b border-gray-200 dark:border-gray-700",
    ),
    week: "flex w-full",
    day: cn(
      "flex-1 min-h-[6.5rem] text-sm p-0 relative",
      "border-b border-r border-gray-100 dark:border-gray-800",
      "last:border-r-0",
      "focus-within:relative focus-within:z-20",
    ),
    day_button: cn(
      "w-full h-full p-0 font-normal rounded-none",
      "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
      "flex flex-col items-start",
    ),
    today: "bg-gray-50 dark:bg-gray-800/30",
    outside: "text-gray-400 dark:text-gray-600 opacity-50",
    hidden: "invisible",
    selected: "",
  };

  // Mobile: compact cells with dots
  const mobileClassNames = {
    root: "text-gray-900 dark:text-gray-100",
    months: "relative flex justify-center",
    month_caption: "hidden",
    nav: "hidden",
    button_previous: "hidden",
    button_next: "hidden",
    month_grid: "w-full border-collapse space-y-1",
    weekdays: "flex",
    weekday: "text-gray-500 dark:text-gray-400 rounded-md w-9 font-normal text-[0.8rem] uppercase",
    week: "flex w-full mt-2",
    day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
    day_button: cn(
      "h-9 w-9 p-0 font-normal rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
    ),
    today: "bg-gray-100 dark:bg-gray-700 font-semibold rounded-md",
    outside: "text-gray-400 dark:text-gray-600 opacity-50",
    hidden: "invisible",
    selected: "",
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-4 md:p-6"
    >
      <h2 className="text-lg font-heading font-bold dark:text-white mb-3">Event Calendar</h2>
      <div className="flex flex-col items-center gap-1 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, -1))}
            className={cn(
              "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors",
              "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
            )}
            aria-label="Previous month"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 min-w-[130px] text-center">
            {format(month, "MMMM yyyy")}
          </span>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className={cn(
              "h-8 w-8 inline-flex items-center justify-center rounded-lg transition-colors",
              "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
            )}
            aria-label="Next month"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        {!isSameMonth(month, today) && (
          <button
            type="button"
            onClick={() => setMonth(today)}
            className={cn(
              "text-xs px-3 py-1 mt-1 rounded-lg transition-colors",
              "text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30",
              "font-medium",
            )}
          >
            Today
          </button>
        )}
      </div>

      <DayPicker
        mode="single"
        month={month}
        onMonthChange={setMonth}
        classNames={isDesktop ? desktopClassNames : mobileClassNames}
        components={{
          DayButton: ({ day, ...props }) => {
            const dayEvents = eventsForDay(day.date);
            const hasEvents = dayEvents.length > 0;
            const uniqueTypes = [...new Set(dayEvents.map((ev) => ev.type))];

            if (isDesktop) {
              // Desktop: tall cell with date number + event name chips
              return (
                <button
                  {...props}
                  onClick={(e) => {
                    handleDayClick(day.date, e.currentTarget);
                  }}
                  className={cn(props.className, hasEvents && "bg-teal-50/50 dark:bg-teal-900/10")}
                >
                  <span
                    className={cn(
                      "text-sm font-medium px-1.5 py-0.5 mt-1 ml-1 rounded",
                      hasEvents && "text-teal-700 dark:text-teal-300",
                    )}
                  >
                    {day.date.getDate()}
                  </span>
                  {hasEvents && (
                    <div className="w-full px-1 pb-1 mt-0.5 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          className={cn(
                            "text-xs leading-tight px-1.5 py-0.5 rounded truncate",
                            typeBgColors[evt.type],
                            typeChipText[evt.type],
                          )}
                        >
                          {evt.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[0.65rem] text-gray-500 dark:text-gray-400 px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            }

            // Mobile: compact cell with dots
            return (
              <button
                {...props}
                onClick={(e) => {
                  handleDayClick(day.date, e.currentTarget);
                }}
                className={cn(
                  props.className,
                  hasEvents && "font-semibold",
                  hasEvents && "bg-teal-50 dark:bg-teal-900/20",
                  hasEvents && dayEvents.length > 1 && "ring-1 ring-teal-300 dark:ring-teal-700",
                )}
              >
                <span>{day.date.getDate()}</span>
                {hasEvents && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {uniqueTypes.slice(0, 3).map((type) => (
                      <span
                        key={type}
                        className={cn("block h-1 w-1 rounded-full", typeDotColors[type])}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          },
        }}
      />

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-x-4 gap-y-1">
        {(["hiking", "mtb", "road_bike", "running", "trail_run"] as const).map((type) => (
          <div
            key={type}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"
          >
            <span className={cn("block h-2 w-2 rounded-full", typeDotColors[type])} />
            {typeLabels[type]}
          </div>
        ))}
      </div>

      {/* Popover for multiple events on one day */}
      {popover && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setPopover(null)} />
          <div
            className={cn(
              "absolute z-40 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-950/50",
              "border border-gray-200 dark:border-gray-700 p-2 space-y-1",
            )}
            style={{
              left: `${popover.x}px`,
              top: `${popover.y}px`,
              transform: "translateX(-50%)",
            }}
          >
            {popover.events.map((evt) => (
              <button
                key={evt.id}
                onClick={() => {
                  setPopover(null);
                  router.push(`/dashboard/events/${evt.id}`);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn("block h-2 w-2 rounded-full shrink-0", typeDotColors[evt.type])}
                  />
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {evt.title}
                  </span>
                </div>
                <p className={cn("text-xs ml-4 mt-0.5", typeChipText[evt.type])}>
                  {typeLabels[evt.type]} &middot; {format(new Date(evt.date), "h:mm a")}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
