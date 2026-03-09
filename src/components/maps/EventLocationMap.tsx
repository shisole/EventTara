"use client";

import dynamic from "next/dynamic";

const MapDisplay = dynamic(() => import("./MapDisplay"), {
  ssr: false,
  loading: () => (
    <div
      className="animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
      style={{ height: 300 }}
    >
      <span className="text-sm text-gray-400 dark:text-gray-500">Loading map...</span>
    </div>
  ),
});

interface EventLocationMapProps {
  lat: number;
  lng: number;
  label?: string;
}

export default function EventLocationMap({ lat, lng, label }: EventLocationMapProps) {
  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-3">Location</h2>
      <MapDisplay lat={lat} lng={lng} label={label} />
    </div>
  );
}
