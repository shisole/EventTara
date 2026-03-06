-- Add is_demo flag to events and organizer_profiles for identifying seeded/demo data
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE organizer_profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
