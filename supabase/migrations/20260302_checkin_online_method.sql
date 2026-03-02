-- Add 'online' to the event_checkins.method check constraint
-- for participant self-check-in via the web app
ALTER TABLE public.event_checkins
  DROP CONSTRAINT event_checkins_method_check;

ALTER TABLE public.event_checkins
  ADD CONSTRAINT event_checkins_method_check
  CHECK (method IN ('qr', 'manual', 'online'));
