"use client";

import dynamic from "next/dynamic";

const MapDisplay = dynamic(() => import("./MapDisplay"), { ssr: false });

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
