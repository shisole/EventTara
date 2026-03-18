import { unstable_cache } from "next/cache";

import { fetchFromWeatherApi } from "./providers/weatherapi";
import { type WeatherForecast } from "./types";

export type { WeatherForecast } from "./types";

/**
 * Get a weather forecast for a location + date.
 *
 * - Returns `null` if the date is more than 14 days from today (API limit).
 * - Results are cached for 30 minutes via `unstable_cache`.
 * - Swap the provider import to switch weather services.
 */
export async function getWeatherForecast(
  lat: number,
  lng: number,
  date: string,
): Promise<WeatherForecast | null> {
  // WeatherAPI free tier supports up to 14-day forecasts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date + "T00:00:00");
  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 14 || diffDays < 0) return null;

  const cached = unstable_cache(
    () => fetchFromWeatherApi(lat, lng, date),
    ["weather", lat.toFixed(2), lng.toFixed(2), date],
    { revalidate: 1800, tags: ["weather"] },
  );

  return cached();
}
