-- Add columns for organizer-managed participants
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS manual_status TEXT CHECK (manual_status IN ('paid', 'reserved', 'pending')),
  ADD COLUMN IF NOT EXISTS manual_name TEXT,
  ADD COLUMN IF NOT EXISTS manual_contact TEXT;

-- Allow user_id to be nullable (for manual entries without an account)
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;

-- Index for quick lookup of organizer-added participants
CREATE INDEX IF NOT EXISTS idx_bookings_added_by ON bookings(added_by) WHERE added_by IS NOT NULL;

-- RLS: Allow organizers to insert bookings for their events (manual participant management)
CREATE POLICY "Organizers can add participants to their events" ON public.bookings
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id IN (
        SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
      )
    )
    AND added_by = auth.uid()
  );
