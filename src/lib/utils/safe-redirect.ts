/**
 * Validates that a redirect URL is safe (relative path only).
 * Prevents open redirect attacks via crafted `next` / `returnUrl` parameters.
 */
export function safeRedirectUrl(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;

  // Must start with a single slash and not contain protocol-relative URLs
  if (!url.startsWith("/") || url.startsWith("//") || url.includes("://")) {
    return fallback;
  }

  return url;
}
