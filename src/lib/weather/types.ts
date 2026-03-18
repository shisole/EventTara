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
}
