"use client";

import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div
      className="animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
      style={{ height: 300 }}
    />
  ),
});

interface EventRouteSectionProps {
  name: string;
  polyline: string;
  distance: number | null;
  elevationGain: number | null;
  source: "strava" | "gpx";
}

export default function EventRouteSection({
  name,
  polyline,
  distance,
  elevationGain,
  source,
}: EventRouteSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-3">Route</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">{name}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="capitalize">{source === "strava" ? "Strava" : "GPX"}</span>
        </div>
        <RouteMap
          polyline={polyline}
          distance={distance ?? undefined}
          elevationGain={elevationGain ?? undefined}
        />
      </div>
    </div>
  );
}
