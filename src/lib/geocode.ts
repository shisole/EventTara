import { unstable_cache } from "next/cache";

/**
 * Geocode a location string to precise coordinates using Nominatim (OpenStreetMap).
 * Results are cached for 24 hours to avoid repeated API calls.
 */
export const geocodeLocation = unstable_cache(
  async (location: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const query = encodeURIComponent(`${location}, Philippines`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
          headers: { "User-Agent": "EventTara/1.0 (https://eventtara.com)" },
        },
      );

      if (!res.ok) {
        console.warn(`[geocode] Nominatim returned ${res.status} for "${location}"`);
        return null;
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return null;

      const { lat, lon } = data[0];
      return { lat: Number.parseFloat(lat), lng: Number.parseFloat(lon) };
    } catch (error) {
      console.warn(`[geocode] Failed to geocode "${location}":`, error);
      return null;
    }
  },
  ["geocode-location"],
  { revalidate: 86400 }, // 24 hours
);
