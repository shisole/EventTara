-- Backfill: create a welcome page for every club that doesn't already have one.
-- Uses the club slug as the welcome page code and the club owner as created_by.
INSERT INTO welcome_pages (code, title, subtitle, club_id, redirect_url, is_active, created_by)
SELECT
  c.slug,
  'Welcome to ' || c.name || '!',
  'Scan to join the crew',
  c.id,
  '/clubs/' || c.slug,
  true,
  cm.user_id
FROM clubs c
JOIN club_members cm ON cm.club_id = c.id AND cm.role = 'owner'
WHERE NOT EXISTS (
  SELECT 1 FROM welcome_pages wp WHERE wp.club_id = c.id
);
