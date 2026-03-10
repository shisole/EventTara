-- Add 'event_published' (and missing 'review_request') to notifications type constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'booking_confirmed', 'event_reminder', 'badge_earned',
  'border_earned', 'feed_like', 'feed_repost',
  'feed_comment_like', 'feed_mention', 'review_request',
  'event_published'
));
