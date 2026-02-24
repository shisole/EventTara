# Event Filters Redesign

## Goal

Replace the current multi-row filter layout with an Airbnb-style horizontal chip bar. Add organizer, guide, and date range filters. Add skeleton loading states.

## Filter Chips

```
[Search bar                                                    ]
[Type ▼] [When ▼] [Date ▼] [Organizer ▼] [Guide ▼]
```

- Each chip is a button that opens a popover below it
- Inactive: gray outline, label only (e.g., "Type")
- Active: filled/highlighted, shows selected value (e.g., "Hiking")
- Horizontal scroll on mobile
- Guide chip only visible when `type=hiking`; auto-cleared when type changes

## Chip Popovers

| Chip      | Popover Content                      | Selection      |
| --------- | ------------------------------------ | -------------- |
| Type      | Activity type list                   | Radio (single) |
| When      | Upcoming / Now / Past                | Radio (single) |
| Date      | Inline date range picker (from → to) | Range          |
| Organizer | Scrollable org name list             | Radio (single) |
| Guide     | Scrollable guide name list           | Radio (single) |

- Each popover has Clear + Apply buttons
- Clicking outside closes the popover
- When + Date are mutually exclusive (selecting one clears the other)

## URL Params

```
/events?type=hiking&when=upcoming&from=2026-02-24&to=2026-03-15&org={id}&guide={id}&search=text
```

All params optional. Same params used by both Server Component (initial load) and API route (pagination).

## Data Sources

- Organizer list: `organizer_profiles` with at least one published event — fetched in Server Component
- Guide list: `guides` linked to published hiking events via `event_guides` — fetched in Server Component
- Both passed as props to the filter component

## Loading UX

- Skeleton placeholder cards replace the event grid while filters are loading
- Skeleton cards match EventCard dimensions (image area + text lines)
- Driven by `isPending` from `useTransition`

## Files to Change

- `src/components/events/EventFilters.tsx` — rewrite to chip bar + popovers
- `src/components/events/EventCardSkeleton.tsx` — new skeleton component
- `src/app/(frontend)/(participant)/events/page.tsx` — add org/guide/date params, fetch dropdown data
- `src/app/(frontend)/api/events/route.ts` — support `org`, `guide`, `from`, `to` params
- `src/components/events/EventsListClient.tsx` — pass new params to API, show skeletons when pending
