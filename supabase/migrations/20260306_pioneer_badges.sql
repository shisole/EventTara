-- Pioneer badges: rename existing check-in pioneer, add new pioneer + first_review badges
-- Also schedules a cron job to award pioneer badges every 6 hours

-- 1. Rename existing check-in pioneer badge
UPDATE badges
SET title       = 'Check-in Pioneer',
    description = 'Among the first 100 users to check in on EventTara'
WHERE criteria_key = 'pioneer'
  AND type = 'system';

-- 2. Insert new system badges (idempotent with ON CONFLICT)
INSERT INTO badges (title, description, image_url, category, rarity, type, criteria_key)
VALUES
  ('Pioneer Participant', 'Among the first 250 users to join EventTara', '🌟', 'special', 'legendary', 'system', 'pioneer_participant'),
  ('Pioneer Organizer', 'Among the first 50 organizers on EventTara', '🏔️', 'special', 'legendary', 'system', 'pioneer_organizer'),
  ('First Review', 'Wrote your first organizer review on EventTara', '✍️', 'special', 'rare', 'system', 'first_review')
ON CONFLICT (criteria_key) WHERE criteria_key IS NOT NULL DO NOTHING;

-- 3. pg_cron function to call the award endpoint
CREATE OR REPLACE FUNCTION award_pioneer_badges_via_http()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  _cron_secret text;
  _site_url    text;
BEGIN
  -- Read secrets from vault (or fall back to current_setting)
  SELECT decrypted_secret INTO _cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret'
  LIMIT 1;

  SELECT decrypted_secret INTO _site_url
  FROM vault.decrypted_secrets
  WHERE name = 'site_url'
  LIMIT 1;

  IF _cron_secret IS NULL OR _site_url IS NULL THEN
    RAISE WARNING 'award_pioneer_badges_via_http: missing vault secrets (cron_secret or site_url)';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url     := _site_url || '/api/cron/award-pioneer-badges',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'x-cron-secret', _cron_secret
    ),
    body    := '{}'::jsonb
  );
END;
$$;

-- 4. Schedule: every 6 hours at minute 45
SELECT cron.schedule(
  'award-pioneer-badges',
  '45 */6 * * *',
  $$ SELECT award_pioneer_badges_via_http(); $$
);
