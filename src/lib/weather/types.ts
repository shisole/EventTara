/** Single-hour weather snapshot. */
export interface HourlyWeather {
  hour: number; // 0–23
  chanceOfRain: number; // 0–100
  precipMm: number;
  tempC: number;
  conditionIcon: string; // Provider icon URL
}

/** Provider-agnostic weather forecast data for a single day. */
export interface WeatherForecast {
  date: string; // YYYY-MM-DD
  tempMin: number; // °C
  tempMax: number; // °C
  conditionText: string; // e.g. "Partly cloudy"
  conditionIcon: string; // Provider icon URL
  chanceOfRain: number; // 0–100
  windKph: number;
  humidity: number;
  hourly: HourlyWeather[]; // 24 entries, one per hour
}
