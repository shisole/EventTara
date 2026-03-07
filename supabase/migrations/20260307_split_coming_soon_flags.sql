-- Split show_coming_soon into individual per-section Coming Soon flags
-- Preserve current state: if show_coming_soon was true, all new flags default to true
ALTER TABLE cms_feature_flags
  ADD COLUMN IF NOT EXISTS coming_soon_strava boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS coming_soon_gamification boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS coming_soon_bento boolean NOT NULL DEFAULT true;

-- Copy existing show_coming_soon value to each new flag
UPDATE cms_feature_flags
SET coming_soon_strava = show_coming_soon,
    coming_soon_gamification = show_coming_soon,
    coming_soon_bento = show_coming_soon;

-- Drop the old column
ALTER TABLE cms_feature_flags DROP COLUMN IF EXISTS show_coming_soon;
