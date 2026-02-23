-- Add status column to booking_companions for per-companion approval
ALTER TABLE public.booking_companions
  ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'confirmed', 'cancelled'));

-- Backfill: set companion status based on their booking's payment_status
UPDATE public.booking_companions bc
SET status = CASE
  WHEN b.payment_status = 'paid' THEN 'confirmed'
  WHEN b.payment_status = 'rejected' THEN 'cancelled'
  ELSE 'pending'
END
FROM public.bookings b
WHERE bc.booking_id = b.id;

-- Update get_total_participants to only count non-cancelled companions
CREATE OR REPLACE FUNCTION get_total_participants(p_event_id UUID)
RETURNS BIGINT AS $$
  SELECT
    COALESCE((SELECT COUNT(*) FROM public.bookings WHERE event_id = p_event_id AND status IN ('pending', 'confirmed')), 0)
    +
    COALESCE((SELECT COUNT(*) FROM public.booking_companions bc
      JOIN public.bookings b ON b.id = bc.booking_id
      WHERE b.event_id = p_event_id AND b.status IN ('pending', 'confirmed')
      AND bc.status != 'cancelled'), 0);
$$ LANGUAGE sql STABLE;
