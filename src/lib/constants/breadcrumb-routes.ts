/**
 * Breadcrumb route configuration.
 *
 * Each entry maps a URL pattern to an ordered array of breadcrumb segments.
 * Patterns use `:id` / `:username` as placeholders for dynamic path segments.
 *
 * Entries are ordered most-specific first so the first match wins.
 */

export interface BreadcrumbSegment {
  /** Display label. `null` means "use dynamic title from BreadcrumbContext". */
  label: string | null;
  /** Link target. `undefined` means this is the current (non-linked) segment. */
  href?: string;
}

export interface BreadcrumbRoute {
  /** URL pattern with `:id` / `:username` placeholders (e.g. `/events/:id/book`). */
  pattern: string;
  /** Ordered breadcrumb segments (excluding the leading "Home" which is always prepended). */
  segments: BreadcrumbSegment[];
  /** Label shown while the dynamic title is still loading. */
  fallbackLabel?: string;
}

/**
 * Build a regex from a pattern string.
 * `:id` and `:username` become named capture groups matching `[^/]+`.
 */
export function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const withParams = escaped.replaceAll(/:(\w+)/g, "(?<$1>[^/]+)");
  return new RegExp(`^${withParams}$`);
}

// prettier-ignore
export const BREADCRUMB_ROUTES: BreadcrumbRoute[] = [
  // ── Events ──────────────────────────────────────────────
  {
    pattern: "/events/:id/book",
    segments: [
      { label: "Events", href: "/events" },
      { label: null, href: "/events/:id" },
      { label: "Book" },
    ],
    fallbackLabel: "Event",
  },
  {
    pattern: "/events/:id",
    segments: [
      { label: "Events", href: "/events" },
      { label: null },
    ],
    fallbackLabel: "Event",
  },
  {
    pattern: "/events",
    segments: [{ label: "Events" }],
  },

  // ── Guides ──────────────────────────────────────────────
  {
    pattern: "/guides/:id",
    segments: [
      { label: "Guides", href: "/guides" },
      { label: null },
    ],
    fallbackLabel: "Guide",
  },

  // ── Badges ──────────────────────────────────────────────
  {
    pattern: "/badges/:id",
    segments: [
      { label: "Badges", href: "/badges" },
      { label: null },
    ],
    fallbackLabel: "Badge",
  },

  // ── Organizers ──────────────────────────────────────────
  {
    pattern: "/organizers/:id",
    segments: [
      { label: "Organizers", href: "/organizers" },
      { label: null },
    ],
    fallbackLabel: "Organizer",
  },

  // ── Feed / Post ─────────────────────────────────────────
  {
    pattern: "/post/:id",
    segments: [
      { label: "Feed", href: "/feed" },
      { label: "Post" },
    ],
  },
  {
    pattern: "/feed",
    segments: [{ label: "Feed" }],
  },

  // ── Profile ─────────────────────────────────────────────
  {
    pattern: "/profile/:username",
    segments: [{ label: null }],
    fallbackLabel: "Profile",
  },

  // ── Standalone pages ────────────────────────────────────
  {
    pattern: "/my-events",
    segments: [{ label: "My Events" }],
  },
  {
    pattern: "/achievements",
    segments: [{ label: "Achievements" }],
  },
  {
    pattern: "/notifications",
    segments: [{ label: "Notifications" }],
  },
  {
    pattern: "/contact",
    segments: [{ label: "Contact" }],
  },

  // ── Dashboard ───────────────────────────────────────────
  {
    pattern: "/dashboard/events/new",
    segments: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events", href: "/dashboard/events" },
      { label: "New Event" },
    ],
  },
  {
    pattern: "/dashboard/events/:id/edit",
    segments: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events", href: "/dashboard/events" },
      { label: null, href: "/dashboard/events/:id" },
      { label: "Edit" },
    ],
    fallbackLabel: "Event",
  },
  {
    pattern: "/dashboard/events/:id/checkin",
    segments: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events", href: "/dashboard/events" },
      { label: null, href: "/dashboard/events/:id" },
      { label: "Check-in" },
    ],
    fallbackLabel: "Event",
  },
  {
    pattern: "/dashboard/events/:id",
    segments: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events", href: "/dashboard/events" },
      { label: null },
    ],
    fallbackLabel: "Event",
  },
  {
    pattern: "/dashboard/events",
    segments: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Events" },
    ],
  },
  {
    pattern: "/dashboard/settings",
    segments: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Settings" },
    ],
  },
  {
    pattern: "/dashboard",
    segments: [{ label: "Dashboard" }],
  },

  // ── Auth ────────────────────────────────────────────────
  {
    pattern: "/login",
    segments: [{ label: "Login" }],
  },
  {
    pattern: "/signup",
    segments: [{ label: "Sign Up" }],
  },
  {
    pattern: "/forgot-password",
    segments: [{ label: "Forgot Password" }],
  },
  {
    pattern: "/reset-password",
    segments: [{ label: "Reset Password" }],
  },
  {
    pattern: "/guest-setup",
    segments: [{ label: "Guest Setup" }],
  },
];
