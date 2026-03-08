-- Create badge_shares table for tracking social shares
CREATE TABLE badge_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'link_copy')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Users can only insert their own shares, but anyone can read for analytics
ALTER TABLE badge_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own badge shares"
  ON badge_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read access to badge shares for analytics"
  ON badge_shares
  FOR SELECT
  USING (true);
