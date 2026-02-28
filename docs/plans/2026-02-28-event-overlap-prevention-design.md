# Event Overlap Prevention Design

## Problem

Participants and organizers can currently book/create events that overlap in time with no warnings or prevention. This can lead to scheduling conflicts.

## Approach

API-level validation in the event creation and booking APIs. No database schema changes needed — reuse existing `date` (start datetime) and `end_date` (optional end datetime) fields.

## Rules

### Time Range Computation

- **With `end_date`:** event occupies `[date, end_date)`
- **Without `end_date`:** event occupies `[date, end-of-day 23:59:59)`
- **Overlap formula:** `startA < endB AND startB < endA`
- **Boundary touching allowed:** Event A ending at 12:00 and Event B starting at 12:00 is NOT an overlap

### Organizer Checks (Event Creation/Update)

- Runs in `POST /api/events` and `PATCH /api/events/[id]`
- Queries organizer's other events with status in (`published`, `draft`)
- Excludes `cancelled` and `completed` events
- Returns 409 with conflicting event title and date

### Participant Checks (Booking)

- Runs in `POST /api/bookings`
- Queries user's active bookings (status in `pending`, `confirmed`)
- Fetches linked events (status in `published`)
- Excludes cancelled bookings
- Returns 409 with conflicting event info

## Edge Cases

| Scenario                                       | Behavior                            |
| ---------------------------------------------- | ----------------------------------- |
| Event A ends at 12:00, Event B starts at 12:00 | Allowed (strict `<` comparison)     |
| Event without end_date on same day as another  | Blocked from start time to 23:59:59 |
| Cancelled booking + new booking same time      | Allowed                             |
| Draft event + new event same time              | Blocked for organizer               |
| Completed event + new event same time          | Allowed                             |

## Error Messages

**Organizer:** "Cannot create this event — it overlaps with your event [Title] on [Date]. Adjust the date/time or update the other event first."

**Participant:** "You can't book this event — you already have [Title] on [Date]. Cancel that booking first if you'd like to join this one instead."

## Out of Scope

- Calendar UI showing blocked times
- Force override option
- Buffer time between events
- Client-side pre-validation
