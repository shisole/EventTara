/**
 * Usernames that cannot be claimed by regular users.
 * Checked case-insensitively against the normalized (lowercased) input.
 */
export const RESERVED_USERNAMES = new Set([
  // Platform roles & authority
  "admin",
  "administrator",
  "moderator",
  "mod",
  "superadmin",
  "sysadmin",
  "root",
  "owner",
  "staff",
  "team",
  "support",
  "helpdesk",

  // Brand / product
  "eventtara",
  "event-tara",
  "event.tara",
  "tara",
  "official",
  "verified",

  // System / technical
  "system",
  "bot",
  "api",
  "webhook",
  "noreply",
  "no-reply",
  "mailer",
  "postmaster",
  "webmaster",
  "info",
  "contact",
  "security",
  "abuse",

  // Common impersonation targets
  "ceo",
  "cto",
  "cfo",
  "founder",
  "cofounder",

  // Reserved paths that could collide with routes
  "login",
  "signup",
  "register",
  "logout",
  "settings",
  "dashboard",
  "profile",
  "account",
  "feed",
  "events",
  "explore",
  "search",
  "notifications",
  "messages",
  "about",
  "help",
  "terms",
  "privacy",
  "billing",
  "pricing",
  "clubs",
  "guides",
  "bookings",
  "my-events",

  // Generic reserved
  "test",
  "demo",
  "example",
  "null",
  "undefined",
  "anonymous",
  "guest",
  "unknown",
  "deleted",
  "user",
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase().trim());
}
