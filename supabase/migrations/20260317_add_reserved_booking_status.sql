-- Add 'reserved' to the allowed booking status values
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'reserved'));

-- Update existing confirmed bookings that were manually added (no linked account)
-- to 'reserved' status since they haven't been claimed yet
UPDATE bookings
SET status = 'reserved', manual_status = 'reserved'
WHERE status = 'confirmed'
  AND user_id IS NULL
  AND added_by IS NOT NULL;
