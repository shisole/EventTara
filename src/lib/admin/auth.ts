/**
 * Check whether a Supabase user ID is in the ADMIN_USER_IDS allow-list.
 * The env var is a comma-separated string of UUIDs.
 */
export function isAdminUser(userId: string): boolean {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  if (!raw) return false;
  const ids = raw.split(",").map((id) => id.trim());
  return ids.includes(userId);
}
