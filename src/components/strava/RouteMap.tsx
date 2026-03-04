"use client";

import { decode } from "@mapbox/polyline";
import { type LatLngBoundsExpression } from "leaflet";
import { useMemo } from "react";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "@/components/maps/leaflet-setup";

import { cn } from "@/lib/utils";

interface RouteMapProps {
  /** Encoded polyline string (Google format). */
  polyline: string;
  /** Total distance in meters. */
  distance?: number;
  /** Total elevation gain in meters. */
  elevationGain?: number;
  className?: string;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}

export default function RouteMap({
  polyline: encodedPolyline,
  distance,
  elevationGain,
  className,
}: RouteMapProps) {
  const { positions, bounds } = useMemo(() => {
    // decode() returns [lat, lng] tuples — exactly what Leaflet expects
    const coords = decode(encodedPolyline);

    // Compute bounding box for auto-fit
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const [lat, lng] of coords) {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    const boundsArr: LatLngBoundsExpression = [
      [minLat, minLng],
      [maxLat, maxLng],
    ];

    return { positions: coords, bounds: boundsArr };
  }, [encodedPolyline]);

  if (positions.length === 0) return null;

  const showStats = distance != null || elevationGain != null;

  return (
    <div
      className={cn(
        "relative z-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700",
        className,
      )}
      style={{ height: 300 }}
    >
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [30, 30] }}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={positions}
          pathOptions={{
            color: "#FC4C02",
            weight: 4,
            opacity: 0.85,
          }}
        />
      </MapContainer>

      {/* Stats overlay */}
      {showStats && (
        <div className="absolute bottom-3 left-3 z-[500] flex gap-2">
          {distance != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 dark:bg-gray-900/90 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm">
              <svg
                className="h-3.5 w-3.5 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                />
              </svg>
              {formatDistance(distance)}
            </span>
          )}
          {elevationGain != null && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-white/90 dark:bg-gray-900/90 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm">
              <svg
                className="h-3.5 w-3.5 text-forest-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
              {formatElevation(elevationGain)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
