-- =============================================================================
-- pg_cron Scheduled Jobs for EventTara
-- =============================================================================
-- Prerequisites (enable in Supabase Dashboard > Database > Extensions):
--   1. pg_cron
--   2. pg_net (for HTTP calls to Next.js API routes)
--
-- After running this migration, set these secrets in Supabase Vault
-- (Dashboard > Settings > Vault):
--   - app_url:     your deployed URL (e.g., https://www.eventtara.com)
--   - cron_secret:  same value as your CRON_SECRET env var
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Auto-complete events (hourly)
-- ---------------------------------------------------------------------------
-- Uses pg_net to call the existing /api/cron/auto-complete-events route.
-- This keeps the complex badge-awarding + email logic in TypeScript.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION cron_auto_complete_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  -- Read secrets from Supabase Vault
  SELECT decrypted_secret INTO v_url
    FROM vault.decrypted_secrets
    WHERE name = 'app_url';

  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
    WHERE name = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE WARNING '[pg_cron] app_url or cron_secret not found in vault — skipping auto-complete';
    RETURN;
  END IF;

  -- Call existing API route via pg_net
  PERFORM net.http_post(
    url := v_url || '/api/cron/auto-complete-events',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_secret
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Event reminders (hourly)
-- ---------------------------------------------------------------------------
-- Pure SQL: inserts notification rows for users with confirmed bookings
-- for events happening tomorrow. The existing Edge Function trigger on the
-- notifications table handles push notification delivery.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION cron_event_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tomorrow_start timestamptz;
  v_tomorrow_end timestamptz;
  v_inserted int;
BEGIN
  v_tomorrow_start := date_trunc('day', now() AT TIME ZONE 'Asia/Manila' + interval '1 day');
  v_tomorrow_end := v_tomorrow_start + interval '1 day' - interval '1 second';

  -- Insert reminder notifications for confirmed bookings on tomorrow's events.
  -- Uses NOT EXISTS to avoid duplicate reminders (idempotent).
  INSERT INTO notifications (user_id, type, title, body, href)
  SELECT DISTINCT
    b.user_id,
    'event_reminder',
    'Event Tomorrow',
    e.title || ' is happening tomorrow at ' || e.location || '. Don''t forget!',
    '/events/' || e.id
  FROM events e
  JOIN bookings b ON b.event_id = e.id AND b.status = 'confirmed'
  WHERE e.status = 'published'
    AND e.date >= v_tomorrow_start
    AND e.date <= v_tomorrow_end
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = b.user_id
        AND n.type = 'event_reminder'
        AND n.href = '/events/' || e.id
        AND n.created_at >= now() - interval '24 hours'
    );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    RAISE LOG '[pg_cron] event_reminders: sent % reminder(s)', v_inserted;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Cleanup stale bookings (every 6 hours)
-- ---------------------------------------------------------------------------
-- Cancels pending bookings older than 48 hours with no payment verification.
-- Also cancels associated booking companions.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION cron_cleanup_stale_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled int;
BEGIN
  -- Cancel stale companions first (FK integrity)
  UPDATE booking_companions bc
  SET status = 'cancelled'
  FROM bookings b
  WHERE bc.booking_id = b.id
    AND b.status = 'pending'
    AND b.payment_verified_at IS NULL
    AND b.created_at < now() - interval '48 hours'
    AND bc.status != 'cancelled';

  -- Cancel stale bookings
  UPDATE bookings
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND payment_verified_at IS NULL
    AND created_at < now() - interval '48 hours';

  GET DIAGNOSTICS v_cancelled = ROW_COUNT;

  IF v_cancelled > 0 THEN
    RAISE LOG '[pg_cron] cleanup_stale_bookings: cancelled % booking(s)', v_cancelled;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Schedule the jobs with pg_cron
-- ---------------------------------------------------------------------------
-- NOTE: These run as the 'postgres' role which has full access.
-- The SECURITY DEFINER on each function ensures proper execution context.
-- ---------------------------------------------------------------------------

-- Auto-complete events: every hour at minute 0
SELECT cron.schedule(
  'auto-complete-events',
  '0 * * * *',
  $$SELECT cron_auto_complete_events()$$
);

-- Event reminders: every hour at minute 15
SELECT cron.schedule(
  'event-reminders',
  '15 * * * *',
  $$SELECT cron_event_reminders()$$
);

-- Cleanup stale bookings: every 6 hours at minute 30
SELECT cron.schedule(
  'cleanup-stale-bookings',
  '30 */6 * * *',
  $$SELECT cron_cleanup_stale_bookings()$$
);
