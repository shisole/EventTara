import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedFont: ArrayBuffer | null = null;
let cachedFaviconB64: string | null = null;

/**
 * Load the Dancing Script Bold font for use in OG ImageResponse.
 * Fetches from Google Fonts API and caches in memory.
 */
export async function loadCursiveFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;

  // Google Fonts static URL for Dancing Script Bold (woff2 → need ttf for Satori)
  // Fetch the CSS first to get the actual font file URL
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap",
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; OGImageRenderer)" } },
  ).then((r) => r.text());

  // Extract the font URL from the CSS
  const urlMatch = /src:\s*url\(([^)]+)\)/.exec(css);
  if (!urlMatch) throw new Error("Failed to parse Dancing Script font URL");

  const fontData = await fetch(urlMatch[1]).then((r) => r.arrayBuffer());
  cachedFont = fontData;
  return fontData;
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
