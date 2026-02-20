-- Companion table
CREATE TABLE public.booking_companions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_booking_companions_booking_id ON public.booking_companions(booking_id);
CREATE INDEX idx_booking_companions_qr_code ON public.booking_companions(qr_code);

-- RLS
ALTER TABLE public.booking_companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view companions of their bookings" ON public.booking_companions
  FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));

CREATE POLICY "Organizers can view companions" ON public.booking_companions
  FOR SELECT USING (booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.events e ON e.id = b.event_id
    JOIN public.organizer_profiles op ON op.id = e.organizer_id
    WHERE op.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert companions for their bookings" ON public.booking_companions
  FOR INSERT WITH CHECK (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));

CREATE POLICY "Organizers can update companions (check-in)" ON public.booking_companions
  FOR UPDATE USING (booking_id IN (
    SELECT b.id FROM public.bookings b
    JOIN public.events e ON e.id = b.event_id
    JOIN public.organizer_profiles op ON op.id = e.organizer_id
    WHERE op.user_id = auth.uid()
  ));

-- Helper function: total participants (bookings + companions) for an event
CREATE OR REPLACE FUNCTION get_total_participants(p_event_id UUID)
RETURNS BIGINT AS $$
  SELECT
    COALESCE((SELECT COUNT(*) FROM public.bookings WHERE event_id = p_event_id AND status IN ('pending', 'confirmed')), 0)
    +
    COALESCE((SELECT COUNT(*) FROM public.booking_companions bc
      JOIN public.bookings b ON b.id = bc.booking_id
      WHERE b.event_id = p_event_id AND b.status IN ('pending', 'confirmed')), 0);
$$ LANGUAGE sql STABLE;
