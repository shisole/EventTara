-- welcome_pages table
CREATE TABLE welcome_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  badge_id UUID REFERENCES badges(id),
  club_id UUID REFERENCES clubs(id),
  redirect_url TEXT NOT NULL DEFAULT '/events',
  hero_image_url TEXT,
  max_claims INT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- welcome_page_claims table (tracks who claimed, prevents doubles)
CREATE TABLE welcome_page_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  welcome_page_id UUID NOT NULL REFERENCES welcome_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (welcome_page_id, user_id)
);

CREATE INDEX idx_welcome_claims_page ON welcome_page_claims(welcome_page_id);

-- RLS
ALTER TABLE welcome_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_active" ON welcome_pages FOR SELECT USING (is_active = true);
CREATE POLICY "insert_own" ON welcome_pages FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "update_own" ON welcome_pages FOR UPDATE USING (auth.uid() = created_by);

ALTER TABLE welcome_page_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON welcome_page_claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON welcome_page_claims FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed "EventTara Pioneer" badge
INSERT INTO badges (title, description, image_url, category, rarity, type, criteria_key)
VALUES (
  'EventTara Pioneer',
  'Among the first to join EventTara — a true trailblazer',
  '⚡',
  'special',
  'legendary',
  'system',
  'welcome_pioneer'
) ON CONFLICT DO NOTHING;
