/**
 * Generate a URL-safe slug from a club name.
 * Converts to lowercase, removes special characters, replaces spaces with hyphens,
 * collapses consecutive hyphens, trims hyphens, and limits to 60 characters.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .replaceAll(/\s+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "")
    .slice(0, 60);
}
