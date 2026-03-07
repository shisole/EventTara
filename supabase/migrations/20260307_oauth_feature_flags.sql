-- Add individual OAuth feature flags for Google, Strava, and Facebook login
ALTER TABLE cms_feature_flags
  ADD COLUMN IF NOT EXISTS oauth_google boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS oauth_strava boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS oauth_facebook boolean NOT NULL DEFAULT false;
