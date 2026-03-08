-- Create user_badge_showcase table for featured badges on profile
CREATE TABLE user_badge_showcase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- RLS: Users can only view/modify their own showcase
ALTER TABLE user_badge_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badge showcase"
  ON user_badge_showcase
  FOR SELECT
  USING (auth.uid() = user_id OR true);

CREATE POLICY "Users can update their own badge showcase"
  ON user_badge_showcase
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badge showcase"
  ON user_badge_showcase
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own badge showcase"
  ON user_badge_showcase
  FOR DELETE
  USING (auth.uid() = user_id);
