"use client";

import { format, isSameDay, isWithinInterval, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
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

const typeTextColors: Record<EventType, string> = {
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
  const [popover, setPopover] = useState<{
    x: number;
    y: number;
    events: CalendarEvent[];
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6"
    >
      <h2 className="text-lg font-heading font-bold mb-4 dark:text-white">Event Calendar</h2>

      <DayPicker
        mode="single"
        classNames={{
          root: "text-gray-900 dark:text-gray-100",
          months: "relative flex justify-center",
          month_caption: "flex justify-center items-center h-10 text-sm font-semibold",
          nav: "absolute top-0 left-0 right-0 flex items-center justify-between z-10",
          button_previous: cn(
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md",
            "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
          ),
          button_next: cn(
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md",
            "text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
          ),
          month_grid: "w-full border-collapse space-y-1",
          weekdays: "flex",
          weekday:
            "text-gray-500 dark:text-gray-400 rounded-md w-9 font-normal text-[0.8rem] uppercase",
          week: "flex w-full mt-2",
          day: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day_button: cn(
            "h-9 w-9 p-0 font-normal rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
          ),
          today: "bg-gray-100 dark:bg-gray-700 font-semibold rounded-md",
          outside: "text-gray-400 dark:text-gray-600 opacity-50",
          hidden: "invisible",
          selected: "",
        }}
        components={{
          DayButton: ({ day, ...props }) => {
            const dayEvents = eventsForDay(day.date);
            const hasEvents = dayEvents.length > 0;
            const uniqueTypes = [...new Set(dayEvents.map((ev) => ev.type))];

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
          {/* Backdrop to close popover */}
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
                <p className={cn("text-xs ml-4 mt-0.5", typeTextColors[evt.type])}>
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
