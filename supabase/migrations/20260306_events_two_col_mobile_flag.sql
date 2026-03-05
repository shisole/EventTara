-- Add events_two_col_mobile feature flag
ALTER TABLE cms_feature_flags
  ADD COLUMN IF NOT EXISTS events_two_col_mobile boolean NOT NULL DEFAULT false;
