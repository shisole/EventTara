-- ===========================================
-- user_follows: who follows whom
-- ===========================================
CREATE TABLE user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_follows_no_self CHECK (follower_id != following_id),
  CONSTRAINT user_follows_unique UNIQUE (follower_id, following_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_follows_select_public"
  ON user_follows FOR SELECT
  USING (true);

CREATE POLICY "user_follows_insert_own"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "user_follows_delete_own"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ===========================================
-- feed_reactions: emoji reactions on feed items
-- ===========================================
CREATE TABLE feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border')),
  activity_id uuid NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('heart')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT feed_reactions_unique UNIQUE (user_id, activity_type, activity_id)
);

CREATE INDEX idx_feed_reactions_activity ON feed_reactions(activity_type, activity_id);

ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_reactions_select_public"
  ON feed_reactions FOR SELECT
  USING (true);

CREATE POLICY "feed_reactions_insert_own"
  ON feed_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_reactions_delete_own"
  ON feed_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- feed_comments: comments on feed items
-- ===========================================
CREATE TABLE feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('booking', 'checkin', 'badge', 'border')),
  activity_id uuid NOT NULL,
  text varchar(300) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_feed_comments_activity ON feed_comments(activity_type, activity_id);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_comments_select_public"
  ON feed_comments FOR SELECT
  USING (true);

CREATE POLICY "feed_comments_insert_own"
  ON feed_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_comments_delete_own"
  ON feed_comments FOR DELETE
  USING (auth.uid() = user_id);
