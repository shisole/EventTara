-- App testimonials (curated by admin)
CREATE TABLE IF NOT EXISTS public.app_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  avatar_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active testimonials"
  ON public.app_testimonials FOR SELECT
  USING (is_active = true);

-- Event reviews (user-submitted)
CREATE TABLE IF NOT EXISTS public.event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
  ON public.event_reviews FOR SELECT
  USING (true);

CREATE POLICY "Checked-in users can insert their own review"
  ON public.event_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.event_checkins
      WHERE event_checkins.event_id = event_reviews.event_id
      AND event_checkins.user_id = auth.uid()
    )
  );

CREATE INDEX idx_event_reviews_event_id ON public.event_reviews(event_id);
CREATE INDEX idx_event_reviews_user_id ON public.event_reviews(user_id);
