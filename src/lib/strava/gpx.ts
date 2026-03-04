/**
 * GPX file parser.
 *
 * Extracts track points from GPX XML and calculates distance (haversine) and
 * cumulative elevation gain. Uses regex-based parsing so it runs on any
 * server-side Node.js runtime without a DOM dependency.
 */

interface GPXResult {
  coordinates: [number, number][];
  /** Total distance in meters. */
  distance: number;
  /** Total elevation gain in meters (only positive changes). */
  elevationGain: number;
}

// ---------------------------------------------------------------------------
// Haversine helpers
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_000; // meters

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two [lat, lng] coordinates, returned in meters.
 */
function haversine(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------

/**
 * Matches `<trkpt lat="..." lon="...">...</trkpt>` blocks (including self-closing).
 * Uses the `s` (dotAll) flag so `.` matches newlines inside the element body.
 */
const TRKPT_REGEX =
  /<trkpt\s+lat=["']([^"']+)["']\s+lon=["']([^"']+)["'][^>]*(?:\/>|>([\s\S]*?)<\/trkpt>)/gi;

/** Matches `<ele>VALUE</ele>` inside a trkpt body. */
const ELE_REGEX = /<ele>([^<]+)<\/ele>/i;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a GPX XML string and return an array of [lat, lng] coordinates plus
 * computed distance and elevation gain.
 *
 * @throws {Error} if the GPX contains no track points.
 */
export function parseGPX(gpxString: string): GPXResult {
  const coordinates: [number, number][] = [];
  const elevations: number[] = [];

  let match: RegExpExecArray | null;

  // Reset lastIndex for safety (global regex)
  TRKPT_REGEX.lastIndex = 0;

  while ((match = TRKPT_REGEX.exec(gpxString)) !== null) {
    const lat = Number.parseFloat(match[1]);
    const lng = Number.parseFloat(match[2]);
    const body = match[3] ?? "";

    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

    coordinates.push([lat, lng]);

    const eleMatch = ELE_REGEX.exec(body);
    if (eleMatch) {
      const ele = Number.parseFloat(eleMatch[1]);
      if (!Number.isNaN(ele)) {
        elevations.push(ele);
      }
    }
  }

  if (coordinates.length === 0) {
    throw new Error("GPX file contains no track points");
  }

  // Distance: sum of haversine between consecutive points
  let distance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    distance += haversine(coordinates[i - 1], coordinates[i]);
  }

  // Elevation gain: sum of positive elevation deltas
  let elevationGain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const diff = elevations[i] - elevations[i - 1];
    if (diff > 0) {
      elevationGain += diff;
    }
  }

  return {
    coordinates,
    distance: Math.round(distance),
    elevationGain: Math.round(elevationGain),
  };
}
