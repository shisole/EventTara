-- Club Forum Categories
CREATE TABLE IF NOT EXISTS club_forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, slug)
);

ALTER TABLE club_forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view categories"
  ON club_forum_categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_categories.club_id
    AND club_members.user_id = auth.uid()
  ));

CREATE POLICY "Club admins can manage categories"
  ON club_forum_categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_categories.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role IN ('owner', 'admin')
  ));

-- Club Forum Threads
CREATE TABLE IF NOT EXISTS club_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES club_forum_categories(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'discussion' CHECK (type IN ('discussion', 'announcement', 'poll')),
  poll_options JSONB,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  reply_count INT NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view threads"
  ON club_forum_threads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_threads.club_id
    AND club_members.user_id = auth.uid()
  ));

CREATE POLICY "Club members can create threads"
  ON club_forum_threads FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_threads.club_id
      AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors and moderators can update threads"
  ON club_forum_threads FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_threads.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE POLICY "Authors and moderators can delete threads"
  ON club_forum_threads FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM club_members WHERE club_members.club_id = club_forum_threads.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE INDEX idx_forum_threads_club_id ON club_forum_threads(club_id);
CREATE INDEX idx_forum_threads_category ON club_forum_threads(category_id);
CREATE INDEX idx_forum_threads_last_activity ON club_forum_threads(club_id, is_pinned DESC, last_activity_at DESC);

-- Club Forum Replies
CREATE TABLE IF NOT EXISTS club_forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES club_forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE club_forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view replies"
  ON club_forum_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM club_forum_threads t
    JOIN club_members cm ON cm.club_id = t.club_id
    WHERE t.id = club_forum_replies.thread_id
    AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Club members can create replies on unlocked threads"
  ON club_forum_replies FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM club_forum_threads t
      JOIN club_members cm ON cm.club_id = t.club_id
      WHERE t.id = club_forum_replies.thread_id
      AND cm.user_id = auth.uid()
      AND t.is_locked = false
    )
  );

CREATE POLICY "Authors and moderators can delete replies"
  ON club_forum_replies FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM club_forum_threads t
      JOIN club_members cm ON cm.club_id = t.club_id
      WHERE t.id = club_forum_replies.thread_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin', 'moderator')
    )
  );

CREATE INDEX idx_forum_replies_thread ON club_forum_replies(thread_id, created_at);

-- Club Forum Poll Votes
CREATE TABLE IF NOT EXISTS club_forum_poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES club_forum_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(thread_id, user_id)
);

ALTER TABLE club_forum_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members can view poll votes"
  ON club_forum_poll_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM club_forum_threads t
    JOIN club_members cm ON cm.club_id = t.club_id
    WHERE t.id = club_forum_poll_votes.thread_id
    AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Club members can vote"
  ON club_forum_poll_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM club_forum_threads t
      JOIN club_members cm ON cm.club_id = t.club_id
      WHERE t.id = club_forum_poll_votes.thread_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can change their vote"
  ON club_forum_poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to increment reply count and update last_activity_at
CREATE OR REPLACE FUNCTION update_thread_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE club_forum_threads
    SET reply_count = reply_count + 1, last_activity_at = now()
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE club_forum_threads
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_thread_on_reply
AFTER INSERT OR DELETE ON club_forum_replies
FOR EACH ROW EXECUTE FUNCTION update_thread_on_reply();
