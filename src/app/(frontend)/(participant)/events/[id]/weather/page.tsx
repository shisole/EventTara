import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { findProvinceFromLocation } from "@/lib/constants/philippine-provinces";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/utils/format-date";
import { getWeatherForecast } from "@/lib/weather";

import HourlyGrid from "./HourlyGrid";

export default async function WeatherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, date, location, coordinates")
    .eq("id", id)
    .single();

  if (!event) notFound();

  // Resolve coordinates
  const coords =
    event.coordinates && typeof event.coordinates === "object" && "lat" in event.coordinates
      ? (event.coordinates as { lat: number; lng: number })
      : (() => {
          const province = findProvinceFromLocation(event.location);
          return province ? { lat: province.lat, lng: province.lng } : null;
        })();

  if (!coords) redirect(`/events/${id}`);

  const forecast = await getWeatherForecast(coords.lat, coords.lng, event.date);

  if (!forecast) redirect(`/events/${id}`);

  // Long-range check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(event.date + "T00:00:00");
  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isLongRange = diffDays > 7;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        {/* Back link */}
        <Link
          href={`/events/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          &larr; Back to {event.title}
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Weather Forecast
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatEventDate(event.date)} &middot; {event.location}
          </p>
        </div>

        {/* Day summary card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            {forecast.conditionIcon && (
              <Image
                src={forecast.conditionIcon}
                alt={forecast.conditionText}
                width={56}
                height={56}
                unoptimized
              />
            )}
            <p className="font-heading font-bold text-lg text-gray-900 dark:text-white">
              {forecast.conditionText}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Temperature
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {forecast.tempMin}&deg; &ndash; {forecast.tempMax}&deg;C
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Rain chance
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {forecast.chanceOfRain}%
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Wind
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">{forecast.windKph} km/h</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Humidity
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">{forecast.humidity}%</p>
            </div>
          </div>
        </div>

        {/* Long-range disclaimer */}
        {isLongRange && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              This forecast is more than 7 days out and may be less accurate.
            </p>
          </div>
        )}

        {/* Hourly grid (client component for "now" indicator) */}
        <HourlyGrid forecast={forecast} />
      </div>
    </div>
  );
}
