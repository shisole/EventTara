-- Add show_coming_soon feature flag (defaults to true to preserve current behavior)
ALTER TABLE cms_feature_flags
  ADD COLUMN IF NOT EXISTS show_coming_soon boolean NOT NULL DEFAULT true;
