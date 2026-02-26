-- Add type and criteria_key columns to badges table for system-level badges
-- type: distinguishes event badges (organizer-created) from system badges (platform achievements)
-- criteria_key: unique identifier for system badges (e.g., 'first_hike', 'pioneer')

-- Add type column with default 'event' so existing badges are unaffected
ALTER TABLE badges
  ADD COLUMN type text NOT NULL DEFAULT 'event'
  CONSTRAINT badges_type_check CHECK (type IN ('event', 'system'));

-- Add criteria_key column (nullable, only used by system badges)
ALTER TABLE badges
  ADD COLUMN criteria_key text;

-- Partial unique index: criteria_key must be unique when not null
CREATE UNIQUE INDEX badges_criteria_key_unique
  ON badges (criteria_key)
  WHERE criteria_key IS NOT NULL;

-- Make event_id nullable (system badges have no associated event)
-- Original schema defines event_id as NOT NULL, so this ALTER is required
ALTER TABLE badges
  ALTER COLUMN event_id DROP NOT NULL;

-- Data integrity: event badges must have event_id, system badges must have criteria_key
ALTER TABLE badges
  ADD CONSTRAINT badges_type_integrity CHECK (
    (type = 'event' AND event_id IS NOT NULL)
    OR (type = 'system' AND criteria_key IS NOT NULL)
  );
