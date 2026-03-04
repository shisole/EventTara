"use client";

import dynamic from "next/dynamic";

const RouteMap = dynamic(() => import("@/components/strava/RouteMap"), {
  ssr: false,
  loading: () => (
    <div
      className="animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
      style={{ height: 300 }}
    />
  ),
});

/**
 * Iloilo–Miag-ao Coastal Road — the most popular cycling route in Iloilo.
 * Encoded from hand-crafted waypoints following the actual coastal highway.
 */
const COASTAL_ROAD_POLYLINE =
  "ggh`A_hakVnKvcAfEfpAfE~{B?nhC?fiBf^fbCnd@~{Bnd@~{BnKffFnd@vnC~W~{BvQv|AnKnd@~WvuBf^f{CvQ~{BvQfbCwQgbCwQ_|Bg^g{C_XwuBg^gbCo}@wkG_q@gcJwcAg_GgEwoJwQ_uC";

const COASTAL_ROAD_DISTANCE = 110_000; // 110 km in meters
const COASTAL_ROAD_ELEVATION = 650; // meters

export default function StravaShowcaseRouteMap() {
  return (
    <RouteMap
      polyline={COASTAL_ROAD_POLYLINE}
      distance={COASTAL_ROAD_DISTANCE}
      elevationGain={COASTAL_ROAD_ELEVATION}
      className="rounded-xl shadow-lg"
    />
  );
}
