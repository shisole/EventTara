-- Add 'new_club' and 'new_event' to activity_type CHECK constraints on feed tables

ALTER TABLE feed_reactions
  DROP CONSTRAINT feed_reactions_activity_type_check,
  ADD CONSTRAINT feed_reactions_activity_type_check
    CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border', 'review', 'photo', 'new_club', 'new_event'));

ALTER TABLE feed_comments
  DROP CONSTRAINT feed_comments_activity_type_check,
  ADD CONSTRAINT feed_comments_activity_type_check
    CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border', 'review', 'photo', 'new_club', 'new_event'));

ALTER TABLE feed_reposts
  DROP CONSTRAINT feed_reposts_activity_type_check,
  ADD CONSTRAINT feed_reposts_activity_type_check
    CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border', 'review', 'photo', 'new_club', 'new_event'));
