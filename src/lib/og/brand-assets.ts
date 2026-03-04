import { readFile } from "node:fs/promises";
import path from "node:path";

const fontsDir = path.join(process.cwd(), "src", "lib", "og", "fonts");

/**
 * Load the Dancing Script Bold font from the local bundle.
 */
export async function loadCursiveFont(): Promise<ArrayBuffer> {
  const buffer = await readFile(path.join(fontsDir, "DancingScript-Bold.ttf"));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/**
 * Load the Inter Regular font from the local bundle.
 */
export async function loadSansFont(): Promise<ArrayBuffer> {
  const buffer = await readFile(path.join(fontsDir, "Inter-Regular.ttf"));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/**
 * Load the favicon as a base64 data URI for embedding in OG images.
 */
export async function loadFaviconDataUri(): Promise<string> {
  const faviconPath = path.join(process.cwd(), "public", "favicon-192x192.png");
  const buffer = await readFile(faviconPath);
  const b64 = buffer.toString("base64");
  return `data:image/png;base64,${b64}`;
}
