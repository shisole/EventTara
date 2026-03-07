-- Add guest_name column for anonymous/guest reviews
ALTER TABLE organizer_reviews
  ADD COLUMN IF NOT EXISTS guest_name text DEFAULT NULL;
