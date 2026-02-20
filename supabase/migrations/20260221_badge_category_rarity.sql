ALTER TABLE badges
  ADD COLUMN category text NOT NULL DEFAULT 'special'
    CHECK (category IN ('distance', 'adventure', 'location', 'special')),
  ADD COLUMN rarity text NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'));
