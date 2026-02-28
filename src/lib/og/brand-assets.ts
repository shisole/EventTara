import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedCursiveFont: ArrayBuffer | null = null;
let cachedSansFont: ArrayBuffer | null = null;
let cachedFaviconB64: string | null = null;

/**
 * Load the Dancing Script Bold font for use in OG ImageResponse.
 * Fetches from Google Fonts API and caches in memory.
 */
async function fetchGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; OGImageRenderer)" } },
  ).then((r) => r.text());

  const urlMatch = /src:\s*url\(([^)]+)\)/.exec(css);
  if (!urlMatch) throw new Error(`Failed to parse ${family} font URL`);

  return fetch(urlMatch[1]).then((r) => r.arrayBuffer());
}

export async function loadCursiveFont(): Promise<ArrayBuffer> {
  if (cachedCursiveFont) return cachedCursiveFont;
  cachedCursiveFont = await fetchGoogleFont("Dancing Script", 700);
  return cachedCursiveFont;
}

export async function loadSansFont(): Promise<ArrayBuffer> {
  if (cachedSansFont) return cachedSansFont;
  cachedSansFont = await fetchGoogleFont("Inter", 400);
  return cachedSansFont;
}

/**
 * Load the favicon as a base64 data URI for embedding in OG images.
 */
export async function loadFaviconDataUri(): Promise<string> {
  if (cachedFaviconB64) return cachedFaviconB64;

  const faviconPath = path.join(process.cwd(), "public", "favicon-192x192.png");
  const buffer = await readFile(faviconPath);
  const b64 = buffer.toString("base64");
  cachedFaviconB64 = `data:image/png;base64,${b64}`;
  return cachedFaviconB64;
}
