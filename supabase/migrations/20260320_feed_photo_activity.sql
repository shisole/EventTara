-- Add 'photo' to activity_type check constraints on feed tables
-- Drop and recreate constraints to include 'photo'

-- feed_reactions
ALTER TABLE feed_reactions DROP CONSTRAINT IF EXISTS feed_reactions_activity_type_check;
ALTER TABLE feed_reactions ADD CONSTRAINT feed_reactions_activity_type_check
  CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border', 'review', 'photo'));

-- feed_comments
ALTER TABLE feed_comments DROP CONSTRAINT IF EXISTS feed_comments_activity_type_check;
ALTER TABLE feed_comments ADD CONSTRAINT feed_comments_activity_type_check
  CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border', 'review', 'photo'));

-- feed_reposts
ALTER TABLE feed_reposts DROP CONSTRAINT IF EXISTS feed_reposts_activity_type_check;
ALTER TABLE feed_reposts ADD CONSTRAINT feed_reposts_activity_type_check
  CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border', 'review', 'photo'));
