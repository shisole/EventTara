-- Allow cancelling the main participant while keeping companions active
ALTER TABLE public.bookings
  ADD COLUMN participant_cancelled BOOLEAN NOT NULL DEFAULT FALSE;

-- Update get_total_participants to exclude cancelled main participants
CREATE OR REPLACE FUNCTION get_total_participants(p_event_id UUID)
RETURNS BIGINT AS $$
  SELECT
    COALESCE((SELECT COUNT(*) FROM public.bookings
      WHERE event_id = p_event_id AND status IN ('pending', 'confirmed')
      AND participant_cancelled = FALSE), 0)
    +
    COALESCE((SELECT COUNT(*) FROM public.booking_companions bc
      JOIN public.bookings b ON b.id = bc.booking_id
      WHERE b.event_id = p_event_id AND b.status IN ('pending', 'confirmed')
      AND bc.status != 'cancelled'), 0);
$$ LANGUAGE sql STABLE;
