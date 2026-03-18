import Image from "next/image";

import { type WeatherForecast } from "@/lib/weather";

interface WeatherCardProps {
  forecast: WeatherForecast;
  location: string;
  isLongRange?: boolean; // true when event date is 8–14 days away
}

export default function WeatherCard({ forecast, location, isLongRange }: WeatherCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-6">
      <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
        <span className="text-lg">&#9925;</span> Weather Forecast
      </h3>

      <div className="flex items-center gap-3 mb-3">
        {forecast.conditionIcon && (
          <Image
            src={forecast.conditionIcon}
            alt={forecast.conditionText}
            width={48}
            height={48}
            unoptimized
          />
        )}
        <div>
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {forecast.conditionText}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{location}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>&#127777;&#65039;</span>
          <span>
            {forecast.tempMin}° – {forecast.tempMax}°C
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>&#127783;&#65039;</span>
          <span>{forecast.chanceOfRain}% rain</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>&#128168;</span>
          <span>{forecast.windKph} km/h</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span>&#128167;</span>
          <span>{forecast.humidity}% humidity</span>
        </div>
      </div>

      {isLongRange && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          Forecast may be less accurate beyond 7 days.
        </p>
      )}
    </div>
  );
}
