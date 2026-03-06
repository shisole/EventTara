-- Add ewallet_payments feature flag
ALTER TABLE cms_feature_flags
  ADD COLUMN IF NOT EXISTS ewallet_payments boolean NOT NULL DEFAULT false;
