/**
 * Static Philippine province/city geographic data.
 * ~100 entries: 81 provinces + major NCR cities.
 * Used for fallback geocoding from location text (no external API needed).
 */

export interface ProvinceEntry {
  name: string;
  region: string;
  islandGroup: 'luzon' | 'visayas' | 'mindanao';
  lat: number;
  lng: number;
}

export const PHILIPPINE_PROVINCES: ProvinceEntry[] = [
  // ── NCR Cities ──
  { name: 'Manila', region: 'NCR', islandGroup: 'luzon', lat: 14.5995, lng: 120.9842 },
  { name: 'Quezon City', region: 'NCR', islandGroup: 'luzon', lat: 14.6760, lng: 121.0437 },
  { name: 'Makati', region: 'NCR', islandGroup: 'luzon', lat: 14.5547, lng: 121.0244 },
  { name: 'Taguig', region: 'NCR', islandGroup: 'luzon', lat: 14.5176, lng: 121.0509 },
  { name: 'Pasig', region: 'NCR', islandGroup: 'luzon', lat: 14.5764, lng: 121.0851 },
  { name: 'Mandaluyong', region: 'NCR', islandGroup: 'luzon', lat: 14.5794, lng: 121.0359 },
  { name: 'San Juan', region: 'NCR', islandGroup: 'luzon', lat: 14.6019, lng: 121.0355 },
  { name: 'Pasay', region: 'NCR', islandGroup: 'luzon', lat: 14.5378, lng: 121.0014 },
  { name: 'Paranaque', region: 'NCR', islandGroup: 'luzon', lat: 14.4793, lng: 121.0198 },
  { name: 'Las Pinas', region: 'NCR', islandGroup: 'luzon', lat: 14.4445, lng: 120.9939 },
  { name: 'Muntinlupa', region: 'NCR', islandGroup: 'luzon', lat: 14.4081, lng: 121.0415 },
  { name: 'Marikina', region: 'NCR', islandGroup: 'luzon', lat: 14.6507, lng: 121.1029 },
  { name: 'Caloocan', region: 'NCR', islandGroup: 'luzon', lat: 14.6500, lng: 120.9667 },
  { name: 'Malabon', region: 'NCR', islandGroup: 'luzon', lat: 14.6625, lng: 120.9567 },
  { name: 'Navotas', region: 'NCR', islandGroup: 'luzon', lat: 14.6667, lng: 120.9417 },
  { name: 'Valenzuela', region: 'NCR', islandGroup: 'luzon', lat: 14.6942, lng: 120.9604 },
  { name: 'Pateros', region: 'NCR', islandGroup: 'luzon', lat: 14.5456, lng: 121.0672 },

  // ── Luzon Provinces ──
  { name: 'Abra', region: 'CAR', islandGroup: 'luzon', lat: 17.5951, lng: 120.7983 },
  { name: 'Apayao', region: 'CAR', islandGroup: 'luzon', lat: 18.0119, lng: 121.1710 },
  { name: 'Benguet', region: 'CAR', islandGroup: 'luzon', lat: 16.4023, lng: 120.5960 },
  { name: 'Ifugao', region: 'CAR', islandGroup: 'luzon', lat: 16.8531, lng: 121.1710 },
  { name: 'Kalinga', region: 'CAR', islandGroup: 'luzon', lat: 17.4741, lng: 121.3685 },
  { name: 'Mountain Province', region: 'CAR', islandGroup: 'luzon', lat: 17.0440, lng: 121.1002 },
  { name: 'Ilocos Norte', region: 'Region I', islandGroup: 'luzon', lat: 18.1647, lng: 120.7116 },
  { name: 'Ilocos Sur', region: 'Region I', islandGroup: 'luzon', lat: 17.2208, lng: 120.5979 },
  { name: 'La Union', region: 'Region I', islandGroup: 'luzon', lat: 16.6159, lng: 120.3209 },
  { name: 'Pangasinan', region: 'Region I', islandGroup: 'luzon', lat: 15.8949, lng: 120.2863 },
  { name: 'Batanes', region: 'Region II', islandGroup: 'luzon', lat: 20.4487, lng: 121.9702 },
  { name: 'Cagayan', region: 'Region II', islandGroup: 'luzon', lat: 18.2489, lng: 121.8787 },
  { name: 'Isabela', region: 'Region II', islandGroup: 'luzon', lat: 16.9754, lng: 121.8107 },
  { name: 'Nueva Vizcaya', region: 'Region II', islandGroup: 'luzon', lat: 16.3301, lng: 121.1710 },
  { name: 'Quirino', region: 'Region II', islandGroup: 'luzon', lat: 16.4900, lng: 121.5382 },
  { name: 'Aurora', region: 'Region III', islandGroup: 'luzon', lat: 15.9786, lng: 121.6323 },
  { name: 'Bataan', region: 'Region III', islandGroup: 'luzon', lat: 14.6417, lng: 120.4818 },
  { name: 'Bulacan', region: 'Region III', islandGroup: 'luzon', lat: 14.7943, lng: 120.8800 },
  { name: 'Nueva Ecija', region: 'Region III', islandGroup: 'luzon', lat: 15.5784, lng: 121.0687 },
  { name: 'Pampanga', region: 'Region III', islandGroup: 'luzon', lat: 15.0794, lng: 120.6200 },
  { name: 'Tarlac', region: 'Region III', islandGroup: 'luzon', lat: 15.4455, lng: 120.5970 },
  { name: 'Zambales', region: 'Region III', islandGroup: 'luzon', lat: 15.5082, lng: 120.0691 },
  { name: 'Batangas', region: 'Region IV-A', islandGroup: 'luzon', lat: 13.7565, lng: 121.0583 },
  { name: 'Cavite', region: 'Region IV-A', islandGroup: 'luzon', lat: 14.2829, lng: 120.8686 },
  { name: 'Laguna', region: 'Region IV-A', islandGroup: 'luzon', lat: 14.2691, lng: 121.4113 },
  { name: 'Quezon', region: 'Region IV-A', islandGroup: 'luzon', lat: 14.0313, lng: 122.1106 },
  { name: 'Rizal', region: 'Region IV-A', islandGroup: 'luzon', lat: 14.6042, lng: 121.3035 },
  { name: 'Marinduque', region: 'Region IV-B', islandGroup: 'luzon', lat: 13.4017, lng: 121.9694 },
  { name: 'Occidental Mindoro', region: 'Region IV-B', islandGroup: 'luzon', lat: 13.1024, lng: 120.7651 },
  { name: 'Oriental Mindoro', region: 'Region IV-B', islandGroup: 'luzon', lat: 12.9867, lng: 121.4064 },
  { name: 'Palawan', region: 'Region IV-B', islandGroup: 'luzon', lat: 9.8349, lng: 118.7384 },
  { name: 'Romblon', region: 'Region IV-B', islandGroup: 'luzon', lat: 12.5778, lng: 122.2714 },
  { name: 'Albay', region: 'Region V', islandGroup: 'luzon', lat: 13.1775, lng: 123.7280 },
  { name: 'Camarines Norte', region: 'Region V', islandGroup: 'luzon', lat: 14.1389, lng: 122.7632 },
  { name: 'Camarines Sur', region: 'Region V', islandGroup: 'luzon', lat: 13.5250, lng: 123.3486 },
  { name: 'Catanduanes', region: 'Region V', islandGroup: 'luzon', lat: 13.7089, lng: 124.2422 },
  { name: 'Masbate', region: 'Region V', islandGroup: 'luzon', lat: 12.3574, lng: 123.5504 },
  { name: 'Sorsogon', region: 'Region V', islandGroup: 'luzon', lat: 12.9362, lng: 124.0050 },

  // ── Visayas Provinces ──
  { name: 'Aklan', region: 'Region VI', islandGroup: 'visayas', lat: 11.8166, lng: 122.0942 },
  { name: 'Antique', region: 'Region VI', islandGroup: 'visayas', lat: 11.3689, lng: 122.0610 },
  { name: 'Capiz', region: 'Region VI', islandGroup: 'visayas', lat: 11.5800, lng: 122.6310 },
  { name: 'Guimaras', region: 'Region VI', islandGroup: 'visayas', lat: 10.5880, lng: 122.6280 },
  { name: 'Iloilo', region: 'Region VI', islandGroup: 'visayas', lat: 10.7202, lng: 122.5621 },
  { name: 'Negros Occidental', region: 'Region VI', islandGroup: 'visayas', lat: 10.0000, lng: 122.5333 },
  { name: 'Bohol', region: 'Region VII', islandGroup: 'visayas', lat: 9.8500, lng: 124.0150 },
  { name: 'Cebu', region: 'Region VII', islandGroup: 'visayas', lat: 10.3157, lng: 123.8854 },
  { name: 'Negros Oriental', region: 'Region VII', islandGroup: 'visayas', lat: 9.6168, lng: 123.1076 },
  { name: 'Siquijor', region: 'Region VII', islandGroup: 'visayas', lat: 9.2145, lng: 123.5721 },
  { name: 'Biliran', region: 'Region VIII', islandGroup: 'visayas', lat: 11.5833, lng: 124.4667 },
  { name: 'Eastern Samar', region: 'Region VIII', islandGroup: 'visayas', lat: 11.5000, lng: 125.5000 },
  { name: 'Leyte', region: 'Region VIII', islandGroup: 'visayas', lat: 10.4167, lng: 124.9500 },
  { name: 'Northern Samar', region: 'Region VIII', islandGroup: 'visayas', lat: 12.2536, lng: 124.3958 },
  { name: 'Samar', region: 'Region VIII', islandGroup: 'visayas', lat: 11.7500, lng: 124.9500 },
  { name: 'Southern Leyte', region: 'Region VIII', islandGroup: 'visayas', lat: 10.1500, lng: 125.1500 },

  // ── Mindanao Provinces ──
  { name: 'Zamboanga del Norte', region: 'Region IX', islandGroup: 'mindanao', lat: 8.1527, lng: 123.2586 },
  { name: 'Zamboanga del Sur', region: 'Region IX', islandGroup: 'mindanao', lat: 7.8383, lng: 123.2968 },
  { name: 'Zamboanga Sibugay', region: 'Region IX', islandGroup: 'mindanao', lat: 7.5222, lng: 122.8198 },
  { name: 'Bukidnon', region: 'Region X', islandGroup: 'mindanao', lat: 8.0515, lng: 125.0990 },
  { name: 'Camiguin', region: 'Region X', islandGroup: 'mindanao', lat: 9.1733, lng: 124.7292 },
  { name: 'Lanao del Norte', region: 'Region X', islandGroup: 'mindanao', lat: 8.0773, lng: 124.0150 },
  { name: 'Misamis Occidental', region: 'Region X', islandGroup: 'mindanao', lat: 8.3375, lng: 123.7072 },
  { name: 'Misamis Oriental', region: 'Region X', islandGroup: 'mindanao', lat: 8.5046, lng: 124.6220 },
  { name: 'Davao del Norte', region: 'Region XI', islandGroup: 'mindanao', lat: 7.5643, lng: 125.8546 },
  { name: 'Davao del Sur', region: 'Region XI', islandGroup: 'mindanao', lat: 6.7656, lng: 125.3284 },
  { name: 'Davao Oriental', region: 'Region XI', islandGroup: 'mindanao', lat: 7.3172, lng: 126.5420 },
  { name: 'Davao de Oro', region: 'Region XI', islandGroup: 'mindanao', lat: 7.7200, lng: 126.1450 },
  { name: 'Davao Occidental', region: 'Region XI', islandGroup: 'mindanao', lat: 6.1053, lng: 125.6076 },
  { name: 'Cotabato', region: 'Region XII', islandGroup: 'mindanao', lat: 7.2047, lng: 124.2310 },
  { name: 'Sarangani', region: 'Region XII', islandGroup: 'mindanao', lat: 5.9630, lng: 125.1953 },
  { name: 'South Cotabato', region: 'Region XII', islandGroup: 'mindanao', lat: 6.2969, lng: 124.8531 },
  { name: 'Sultan Kudarat', region: 'Region XII', islandGroup: 'mindanao', lat: 6.5069, lng: 124.4197 },
  { name: 'Agusan del Norte', region: 'Region XIII', islandGroup: 'mindanao', lat: 8.9456, lng: 125.5319 },
  { name: 'Agusan del Sur', region: 'Region XIII', islandGroup: 'mindanao', lat: 8.1534, lng: 125.9560 },
  { name: 'Dinagat Islands', region: 'Region XIII', islandGroup: 'mindanao', lat: 10.1280, lng: 125.6083 },
  { name: 'Surigao del Norte', region: 'Region XIII', islandGroup: 'mindanao', lat: 9.7877, lng: 125.4950 },
  { name: 'Surigao del Sur', region: 'Region XIII', islandGroup: 'mindanao', lat: 8.5000, lng: 126.1500 },
  { name: 'Basilan', region: 'BARMM', islandGroup: 'mindanao', lat: 6.4221, lng: 121.9690 },
  { name: 'Lanao del Sur', region: 'BARMM', islandGroup: 'mindanao', lat: 7.8232, lng: 124.4357 },
  { name: 'Maguindanao del Norte', region: 'BARMM', islandGroup: 'mindanao', lat: 7.2047, lng: 124.4310 },
  { name: 'Maguindanao del Sur', region: 'BARMM', islandGroup: 'mindanao', lat: 6.9422, lng: 124.3561 },
  { name: 'Sulu', region: 'BARMM', islandGroup: 'mindanao', lat: 6.0474, lng: 121.0028 },
  { name: 'Tawi-Tawi', region: 'BARMM', islandGroup: 'mindanao', lat: 5.1337, lng: 119.9509 },
];

// Build a lookup map for fast matching (lowercase name -> entry)
const provinceLookup = new Map<string, ProvinceEntry>();
for (const entry of PHILIPPINE_PROVINCES) {
  provinceLookup.set(entry.name.toLowerCase(), entry);
}

// Common aliases
const ALIASES: Record<string, string> = {
  'bgc': 'taguig',
  'bonifacio global city': 'taguig',
  'fort bonifacio': 'taguig',
  'metro manila': 'manila',
  'ncr': 'manila',
  'subic': 'zambales',
  'subic bay': 'zambales',
  'subic bay freeport zone': 'zambales',
  'clark': 'pampanga',
  'clark freeport zone': 'pampanga',
  'tagaytay': 'cavite',
  'baguio': 'benguet',
  'manila bay': 'manila',
  'qc': 'quezon city',
  'davao': 'davao del sur',
};

/**
 * Extract province/city from a location string and return its coordinates.
 * Tries the last comma-separated part first (e.g., "Mt. Pulag, Benguet" -> "Benguet"),
 * then tries all parts, then tries alias matching.
 */
export function findProvinceFromLocation(location: string): ProvinceEntry | null {
  if (!location) return null;

  const parts = location.split(',').map((p) => p.trim().toLowerCase());

  // Try last part first (most location strings end with province/city)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];

    // Direct match
    const direct = provinceLookup.get(part);
    if (direct) return direct;

    // Alias match
    const aliased = ALIASES[part];
    if (aliased) {
      const entry = provinceLookup.get(aliased);
      if (entry) return entry;
    }

    // Fuzzy: check if any province name is contained in this part or vice versa
    for (const [name, entry] of provinceLookup) {
      if (part.includes(name) || name.includes(part)) {
        return entry;
      }
    }
  }

  return null;
}
