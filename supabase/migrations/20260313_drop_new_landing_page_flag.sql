-- Remove the new_landing_page feature flag column (now the default)
ALTER TABLE cms_feature_flags DROP COLUMN IF EXISTS new_landing_page;
