"use client";

import Image from "next/image";
import Link from "next/link";

import { type WeatherForecast } from "@/lib/weather";

const SUMMARY_HOURS = [5, 8, 11, 14, 17, 20] as const;

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

/** Check if event date is today in the user's local timezone. */
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

interface WeatherCardProps {
  forecast: WeatherForecast;
  eventId: string;
  isLongRange?: boolean;
}

export default function WeatherCard({ forecast, eventId, isLongRange }: WeatherCardProps) {
  const hourlyMap = new Map(forecast.hourly.map((h) => [h.hour, h]));

  const currentHour = new Date().getHours();
  const today = isToday(forecast.date);
  const visibleHours = today ? SUMMARY_HOURS.filter((h) => h >= currentHour) : [...SUMMARY_HOURS];

  // If all summary hours have passed today, show last 2 as fallback
  const hours = visibleHours.length > 0 ? visibleHours : SUMMARY_HOURS.slice(-2);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-6">
      {/* Header */}
      <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
        <span className="text-lg">&#9925;</span> Weather Forecast
      </h3>

      {/* Summary row */}
      <div className="flex items-center gap-3 mb-4">
        {forecast.conditionIcon && (
          <Image
            src={forecast.conditionIcon}
            alt={forecast.conditionText}
            width={40}
            height={40}
            unoptimized
          />
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {forecast.conditionText}{" "}
          <span className="text-gray-500 dark:text-gray-400">
            &middot; {forecast.tempMin}&deg;&ndash;{forecast.tempMax}&deg;C &middot;{" "}
            {forecast.chanceOfRain}% rain
          </span>
        </p>
      </div>

      {/* Hourly rain timeline */}
      <Link href={`/events/${eventId}/weather`}>
        <div
          className="text-center"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${String(hours.length)}, minmax(0, 1fr))`,
            gap: "0.375rem",
          }}
        >
          {hours.map((h) => {
            const data = hourlyMap.get(h);
            const chance = data?.chanceOfRain ?? 0;
            const icon = data?.conditionIcon;
            const barHeight = Math.max(chance, 4);
            const isNow = today && h === SUMMARY_HOURS.find((sh) => sh >= currentHour);

            return (
              <div key={h} className="flex flex-col items-center gap-1">
                <span
                  className={`text-[11px] font-medium ${
                    isNow
                      ? "text-teal-600 dark:text-teal-400 font-bold"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {isNow ? "Now" : formatHour(h)}
                </span>

                {icon && (
                  <Image
                    src={icon}
                    alt=""
                    width={28}
                    height={28}
                    unoptimized
                    className="shrink-0"
                  />
                )}

                {/* Rain bar */}
                <div className="w-full h-7 rounded bg-gray-100 dark:bg-gray-800 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded transition-all ${rainBarColor(chance)}`}
                    style={{ height: `${String(barHeight)}%` }}
                  />
                </div>

                <span
                  className={`text-[11px] font-medium ${
                    chance >= 20
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  {chance >= 20 ? String(chance) + "%" : "\u2013"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Link hint */}
        <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
          See full forecast &rarr;
        </p>
      </Link>

      {/* Long-range disclaimer */}
      {isLongRange && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Forecast may be less accurate beyond 7 days.
        </p>
      )}
    </div>
  );
}
