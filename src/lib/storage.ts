/**
 * Convert a Supabase storage public URL to a CDN-proxied path.
 *
 * Input:  https://xxx.supabase.co/storage/v1/object/public/covers/photo.jpg
 * Output: /storage/covers/photo.jpg
 *
 * This routes through our own domain (Vercel/Cloudflare edge) instead of
 * hitting Supabase storage directly, reducing Supabase bandwidth usage.
 * The /storage/* rewrite in next.config.mjs proxies back to Supabase with
 * a 1-year Cache-Control header.
 */
export function cdnUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return url;

  const storagePrefix = `${supabaseUrl}/storage/v1/object/public/`;
  if (!url.startsWith(storagePrefix)) return url;

  return `/storage/${url.slice(storagePrefix.length)}`;
}
