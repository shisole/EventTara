-- Allow completed events (and their photos) to be publicly visible,
-- so organizer profile pages can display past events.

DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
CREATE POLICY "Published events are viewable by everyone" ON public.events
  FOR SELECT USING (status IN ('published', 'completed') OR organizer_id IN (
    SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Event photos viewable with event" ON public.event_photos;
CREATE POLICY "Event photos viewable with event" ON public.event_photos
  FOR SELECT USING (event_id IN (
    SELECT id FROM public.events WHERE status IN ('published', 'completed')
  ));
