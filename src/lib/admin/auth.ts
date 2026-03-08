/**
 * Check whether a Supabase user ID is in the admin allow-list.
 * Uses ADMIN_DEV_STAGING_USER_IDS on preview/development deployments,
 * ADMIN_USER_IDS on production. The env var is a comma-separated string of UUIDs.
 */
export function isAdminUser(userId: string): boolean {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  if (env === "production") {
    const raw = process.env.ADMIN_USER_IDS ?? "";
    if (!raw) return false;
    return raw
      .split(",")
      .map((id) => id.trim())
      .includes(userId);
  }
  // Non-production: merge both lists so prod + staging/dev admins all have access
  const parts = [process.env.ADMIN_USER_IDS, process.env.ADMIN_DEV_STAGING_USER_IDS]
    .filter(Boolean)
    .join(",");
  if (!parts) return false;
  return parts
    .split(",")
    .map((id) => id.trim())
    .includes(userId);
}
