-- Add Strava showcase feature flags to cms_feature_flags
-- Run in Supabase SQL Editor

ALTER TABLE cms_feature_flags
  ADD COLUMN IF NOT EXISTS strava_showcase_features boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS strava_showcase_stats boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS strava_showcase_route_map boolean NOT NULL DEFAULT true;
