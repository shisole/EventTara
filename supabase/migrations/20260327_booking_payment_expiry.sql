-- Add expiry and payment reminder tracking columns to bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_reminder_sent_at timestamptz;

-- Index for cron queries on pending expired bookings
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at
  ON bookings (expires_at)
  WHERE payment_status = 'pending' AND status = 'pending';

-- Add new notification types
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'booking_confirmed',
      'event_reminder',
      'badge_earned',
      'border_earned',
      'feed_like',
      'feed_repost',
      'feed_comment_like',
      'feed_mention',
      'review_request',
      'event_published',
      'forum_reply',
      'forum_mention',
      'booking_expired',
      'payment_reminder',
      'payment_proof_uploaded'
    )
  );
