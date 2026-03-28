-- Event itinerary entries (time + title per row, ordered by sort_order)
CREATE TABLE IF NOT EXISTS public.event_itinerary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  time text NOT NULL,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.event_itinerary ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view event itinerary"
  ON public.event_itinerary FOR SELECT
  USING (true);

-- Club editors (owner/admin/moderator) can insert
CREATE POLICY "Club editors can insert itinerary"
  ON public.event_itinerary FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.club_members cm ON cm.club_id = e.club_id
      WHERE e.id = event_itinerary.event_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Club editors can update
CREATE POLICY "Club editors can update itinerary"
  ON public.event_itinerary FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.club_members cm ON cm.club_id = e.club_id
      WHERE e.id = event_itinerary.event_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin', 'moderator')
    )
  );

-- Club editors can delete
CREATE POLICY "Club editors can delete itinerary"
  ON public.event_itinerary FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.club_members cm ON cm.club_id = e.club_id
      WHERE e.id = event_itinerary.event_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin', 'moderator')
    )
  );
