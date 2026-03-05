# Supabase Pro Optimizations

**Date:** 2026-03-05
**Status:** Approved

## 1. pg_cron Scheduled Jobs

Migrate existing external cron triggers to pg_cron + add stale booking cleanup.

| Job                      | Schedule | Description                                                                |
| ------------------------ | -------- | -------------------------------------------------------------------------- |
| `auto_complete_events`   | Hourly   | Complete published events 48h+ past end date, award badges via pg_net call |
| `event_reminders`        | Hourly   | Notify users with bookings for events in next 24h                          |
| `cleanup_stale_bookings` | Every 6h | Cancel pending bookings with no payment proof after 48h                    |

**Files:** `supabase/migrations/001_pg_cron_jobs.sql`
**Existing API routes kept as manual fallback.**

## 2. Realtime Booking Counts

Live "X spots left" on event detail pages via Postgres Changes subscription.

- `LiveBookingCount` client component subscribes to bookings table changes
- Re-fetches `get_total_participants` RPC on change
- Replaces static count on event detail page

**Files:**

- New: `src/components/events/LiveBookingCount.tsx`
- Modify: `src/app/(frontend)/(participant)/events/[id]/page.tsx`

## 3. Dashboard-Only (No Code)

- PITR: Dashboard > Database > Backups
- pg_stat_statements: Dashboard > Extensions
- Query Performance: Dashboard > Query Performance
