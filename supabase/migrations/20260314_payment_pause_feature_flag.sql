-- Add payment_pause feature flag to cms_feature_flags
ALTER TABLE cms_feature_flags ADD COLUMN payment_pause boolean NOT NULL DEFAULT false;
