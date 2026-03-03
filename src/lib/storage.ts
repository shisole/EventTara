/**
 * Convert a Supabase storage or R2 public URL to a CDN-proxied path.
 *
 * Supabase:
 *   Input:  https://xxx.supabase.co/storage/v1/object/public/covers/photo.jpg
 *   Output: /storage/covers/photo.jpg
 *
 * R2:
 *   Input:  https://pub-xxx.r2.dev/events/photo.jpg
 *   Output: /r2/events/photo.jpg
 *
 * This routes through our own domain (Vercel/Cloudflare edge) instead of
 * hitting storage directly, reducing bandwidth usage.
 * The /storage/* and /r2/* rewrites in next.config.mjs proxy back to the
 * origin with a 1-year Cache-Control header.
 */
export function cdnUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Supabase storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const storagePrefix = `${supabaseUrl}/storage/v1/object/public/`;
    if (url.startsWith(storagePrefix)) {
      return `/storage/${url.slice(storagePrefix.length)}`;
    }
  }

  // Cloudflare R2 — detect by pattern so it works in client components too
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  if (r2PublicUrl && url.startsWith(r2PublicUrl)) {
    return `/r2/${url.slice(r2PublicUrl.length + 1)}`;
  }
  const r2Regex = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/(.+)$/;
  const r2Match = r2Regex.exec(url);
  if (r2Match) {
    return `/r2/${r2Match[1]}`;
  }

  return url;
}
