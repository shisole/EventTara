import { type WeatherForecast } from "../types";

/**
 * Fetch a single-day forecast from WeatherAPI.com.
 * Returns `null` on any error (never throws).
 */
export async function fetchFromWeatherApi(
  lat: number,
  lng: number,
  date: string,
): Promise<WeatherForecast | null> {
  const key = process.env.WEATHERAPI_KEY;
  if (!key) {
    console.warn("[weather] WEATHERAPI_KEY not set — skipping forecast");
    return null;
  }

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${String(lat)},${String(lng)}&dt=${date}&days=1`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`[weather] WeatherAPI responded ${res.status}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const day = data?.forecast?.forecastday?.[0]?.day;

    if (!day) {
      console.error("[weather] Unexpected response shape", JSON.stringify(data).slice(0, 200));
      return null;
    }

    const hours = (data.forecast.forecastday[0].hour ?? []).map((h: any) => ({
      hour: Number.parseInt(h.time.split(" ")[1]),
      chanceOfRain: h.chance_of_rain ?? 0,
      precipMm: h.precip_mm ?? 0,
      tempC: h.temp_c ?? 0,
      conditionIcon: h.condition?.icon ? `https:${h.condition.icon}` : "",
    }));

    return {
      date,
      tempMin: day.mintemp_c,
      tempMax: day.maxtemp_c,
      conditionText: day.condition?.text ?? "Unknown",
      conditionIcon: day.condition?.icon ? `https:${day.condition.icon}` : "",
      chanceOfRain: day.daily_chance_of_rain ?? 0,
      windKph: day.maxwind_kph ?? 0,
      humidity: day.avghumidity ?? 0,
      hourly: hours,
    };
  } catch (error) {
    console.error("[weather] Failed to fetch forecast:", error);
    return null;
  }
}
