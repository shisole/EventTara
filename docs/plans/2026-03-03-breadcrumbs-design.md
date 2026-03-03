# Breadcrumbs Design

## Approach

Route-based config map (Approach A). A central config maps URL path patterns to breadcrumb segments. A single `<Breadcrumbs>` client component reads `usePathname()` and resolves segments. Dynamic titles (event names, guide names) are set via `BreadcrumbContext`.

## Files

- `src/lib/constants/breadcrumb-routes.ts` — route config map
- `src/components/ui/Breadcrumbs.tsx` — breadcrumb component
- `src/lib/contexts/BreadcrumbContext.tsx` — context for dynamic titles

## Route Map

| URL Pattern                      | Breadcrumb Trail                                     |
| -------------------------------- | ---------------------------------------------------- |
| `/events`                        | Home > Events                                        |
| `/events/[id]`                   | Home > Events > {Event Title}                        |
| `/events/[id]/book`              | Home > Events > {Event Title} > Book                 |
| `/my-events`                     | Home > My Events                                     |
| `/feed`                          | Home > Feed                                          |
| `/achievements`                  | Home > Achievements                                  |
| `/profile/[username]`            | Home > {Username}                                    |
| `/guides/[id]`                   | Home > Guides > {Guide Name}                         |
| `/badges/[id]`                   | Home > Badges > {Badge Name}                         |
| `/organizers/[id]`               | Home > Organizers > {Organizer Name}                 |
| `/post/[id]`                     | Home > Feed > Post                                   |
| `/notifications`                 | Home > Notifications                                 |
| `/contact`                       | Home > Contact                                       |
| `/dashboard`                     | Home > Dashboard                                     |
| `/dashboard/events`              | Home > Dashboard > Events                            |
| `/dashboard/events/new`          | Home > Dashboard > Events > New Event                |
| `/dashboard/events/[id]`         | Home > Dashboard > Events > {Event Title}            |
| `/dashboard/events/[id]/edit`    | Home > Dashboard > Events > {Event Title} > Edit     |
| `/dashboard/events/[id]/checkin` | Home > Dashboard > Events > {Event Title} > Check-in |
| `/dashboard/settings`            | Home > Dashboard > Settings                          |
| `/login`                         | Home > Login                                         |
| `/signup`                        | Home > Sign Up                                       |

Hidden on `/` (home page).

## Dynamic Titles

Pages with dynamic segments render `<BreadcrumbTitle title="..." />` to set the display name via context. Falls back to a generic label (e.g., "Event") while loading.

Pages that need it: event detail/edit/checkin/book, guide detail, badge detail, organizer detail, profile.

## Visual Design

- Positioned below navbar, above page content (inside main content area)
- `text-sm`, muted color (`text-gray-500 dark:text-gray-400`)
- Chevron separator between segments
- Last segment: plain text (not a link)
- Parent segments: links with subtle hover underline
- Home segment: "Home" text
- Mobile: same layout, long titles truncate with ellipsis
- Dashboard: breadcrumb inside `<main>` (right of sidebar)
