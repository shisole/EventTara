-- ===========================================
-- feed_comment_likes: likes on individual comments
-- ===========================================
CREATE TABLE feed_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES feed_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT feed_comment_likes_unique UNIQUE (user_id, comment_id)
);

CREATE INDEX idx_feed_comment_likes_comment ON feed_comment_likes(comment_id);

ALTER TABLE feed_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_comment_likes_select_public"
  ON feed_comment_likes FOR SELECT
  USING (true);

CREATE POLICY "feed_comment_likes_insert_own"
  ON feed_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_comment_likes_delete_own"
  ON feed_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- Add new notification types for comment likes and mentions
-- ===========================================
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'booking_confirmed', 'event_reminder', 'badge_earned',
  'border_earned', 'feed_like', 'feed_repost',
  'feed_comment_like', 'feed_mention'
));
