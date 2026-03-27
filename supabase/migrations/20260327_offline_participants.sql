-- Add offline_participants to events so organizers can reserve slots
-- for participants who registered/paid outside the platform.
ALTER TABLE public.events
  ADD COLUMN offline_participants INT NOT NULL DEFAULT 0;

-- Update get_total_participants to include offline slots so that
-- capacity checks (booking API, event page, book page) all respect them.
CREATE OR REPLACE FUNCTION get_total_participants(p_event_id UUID)
RETURNS BIGINT AS $$
  SELECT
    COALESCE((SELECT offline_participants FROM public.events WHERE id = p_event_id), 0)
    +
    COALESCE((SELECT COUNT(*) FROM public.bookings
      WHERE event_id = p_event_id AND status IN ('pending', 'confirmed')
      AND participant_cancelled = FALSE), 0)
    +
    COALESCE((SELECT COUNT(*) FROM public.booking_companions bc
      JOIN public.bookings b ON b.id = bc.booking_id
      WHERE b.event_id = p_event_id AND b.status IN ('pending', 'confirmed')
      AND bc.status != 'cancelled'), 0);
$$ LANGUAGE sql STABLE SECURITY DEFINER;
