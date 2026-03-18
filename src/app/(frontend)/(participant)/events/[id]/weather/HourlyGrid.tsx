"use client";

import Image from "next/image";

import { type WeatherForecast } from "@/lib/weather";

const ALL_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;

function formatHour(h: number): string {
  if (h === 0) return "12AM";
  if (h < 12) return String(h) + "AM";
  if (h === 12) return "12PM";
  return String(h - 12) + "PM";
}

function rainBarColor(chance: number): string {
  if (chance >= 80) return "bg-blue-700";
  if (chance >= 50) return "bg-blue-500";
  if (chance >= 20) return "bg-sky-400";
  return "bg-gray-200 dark:bg-gray-700";
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const local =
    String(now.getFullYear()) +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");
  return dateStr === local;
}

interface HourlyGridProps {
  forecast: WeatherForecast;
}

export default function HourlyGrid({ forecast }: HourlyGridProps) {
  const hourlyMap = new Map(forecast.hourly.map((h) => [h.hour, h]));

  const currentHour = new Date().getHours();
  const today = isToday(forecast.date);

  // If today, only show current hour onward; if future date show all
  const hours = today ? ALL_HOURS.filter((h) => h >= currentHour) : [...ALL_HOURS];

  // Fallback: if all activity hours passed, show last 4
  const visibleHours = hours.length > 0 ? hours : ALL_HOURS.slice(-4);

  // The first visible hour on today is the "Now" slot
  const nowHour = today && visibleHours.length > 0 ? visibleHours[0] : null;

  return (
    <>
      {/* Heading */}
      <div className="mb-3">
        <h2 className="font-heading font-bold text-base text-gray-900 dark:text-white">
          Hourly Breakdown
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {today ? "Showing from now onward" : "Activity hours 5 AM \u2013 8 PM"} &middot; Blue bars
          show rain chance &middot; Higher bar = more likely to rain
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
        {visibleHours.map((h) => {
          const data = hourlyMap.get(h);
          const chance = data?.chanceOfRain ?? 0;
          const icon = data?.conditionIcon;
          const barHeight = Math.max(chance, 4);
          const isNow = h === nowHour;

          return (
            <div
              key={h}
              className={`rounded-xl shadow-sm dark:shadow-gray-950/20 p-2 sm:p-3 flex flex-col items-center gap-1 ${
                isNow
                  ? "bg-teal-50 dark:bg-teal-950/30 ring-1 ring-teal-300 dark:ring-teal-700"
                  : "bg-white dark:bg-gray-900"
              }`}
            >
              {/* Hour */}
              <span
                className={`text-xs font-semibold ${
                  isNow ? "text-teal-600 dark:text-teal-400" : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {isNow ? "Now" : formatHour(h)}
              </span>

              {/* Condition icon */}
              {icon && (
                <Image src={icon} alt="" width={36} height={36} unoptimized className="shrink-0" />
              )}

              {/* Temperature */}
              {data && (
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {data.tempC}&deg;C
                </span>
              )}

              {/* Rain bar */}
              <div
                className="w-full h-12 rounded bg-gray-100 dark:bg-gray-800 flex items-end overflow-hidden"
                title={`${String(chance)}% chance of rain`}
              >
                <div
                  className={`w-full rounded transition-all ${rainBarColor(chance)}`}
                  style={{ height: `${String(barHeight)}%` }}
                />
              </div>

              {/* Rain chance label */}
              <span
                className={`text-xs font-medium ${
                  chance >= 20
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {chance}%<span className="sr-only"> chance of rain</span>
              </span>

              {/* Precipitation amount */}
              {data && data.precipMm > 0 && (
                <span
                  className="text-[10px] text-gray-400 dark:text-gray-500"
                  title="Expected rainfall amount"
                >
                  {data.precipMm}mm rain
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-700" /> 80%+ Very likely
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" /> 50&ndash;79% Likely
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-400" /> 20&ndash;49% Possible
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-gray-200 dark:bg-gray-700" />{" "}
          &lt;20% Unlikely
        </span>
      </div>
    </>
  );
}
