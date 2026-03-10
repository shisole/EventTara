CREATE TABLE club_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Duck Race',
  num_winners INT NOT NULL DEFAULT 1,
  duration_seconds INT NOT NULL DEFAULT 10,
  badge_id UUID REFERENCES badges(id),
  status TEXT NOT NULL DEFAULT 'pending',
  winner_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  participant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT club_races_status_check CHECK (status IN ('pending', 'completed'))
);

CREATE INDEX idx_club_races_club ON club_races(club_id);
ALTER TABLE club_races ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view races" ON club_races FOR SELECT USING (true);
CREATE POLICY "Club admins can create races" ON club_races FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_races.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role IN ('owner', 'admin')
  )
);
CREATE POLICY "Club admins can update races" ON club_races FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_races.club_id
    AND club_members.user_id = auth.uid()
    AND club_members.role IN ('owner', 'admin')
  )
);
