-- Allow authenticated users to insert system badges (no event_id).
-- Admin authorization is enforced at the API layer.
-- This covers standalone badges like QR claim badges that aren't tied to events.
CREATE POLICY "Authenticated can insert system badges"
  ON public.badges
  FOR INSERT
  TO authenticated
  WITH CHECK (event_id IS NULL);
