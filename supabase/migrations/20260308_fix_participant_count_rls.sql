-- Fix get_total_participants to bypass RLS by using SECURITY DEFINER.
-- The function only returns a count (no sensitive data), but RLS on
-- bookings blocks reads for anonymous / non-organizer visitors, so
-- the public event page always showed "0 adventurers joined".
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
$$ LANGUAGE sql STABLE SECURITY DEFINER;
