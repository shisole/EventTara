/**
 * Geographic distance utilities using the Haversine formula.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Calculate the distance in km between two lat/lng points using the Haversine formula. */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/** Format a distance in km for display (e.g., "~15km", "~2km"). */
export function formatDistance(km: number): string {
  if (km < 1) return "<1km";
  return `~${Math.round(km)}km`;
}
