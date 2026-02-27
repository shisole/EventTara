-- Allow organizers to insert check-ins for participants of their events
CREATE POLICY "Organizers can check in participants" ON public.event_checkins
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id IN (
        SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
      )
    )
  );
