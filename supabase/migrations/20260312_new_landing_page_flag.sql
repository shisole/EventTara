-- Add new_landing_page feature flag
ALTER TABLE cms_feature_flags
  ADD COLUMN IF NOT EXISTS new_landing_page boolean NOT NULL DEFAULT false;

-- Ensure the singleton row has the new column set
UPDATE cms_feature_flags SET new_landing_page = false WHERE id = 1;
