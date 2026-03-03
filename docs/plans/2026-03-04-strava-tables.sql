-- Strava Integration Tables
-- Run this in the Supabase SQL Editor

-- =============================================================================
-- 1. strava_connections
-- Stores OAuth tokens and athlete data for users who connect their Strava account
-- =============================================================================
CREATE TABLE public.strava_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_athlete_id bigint NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text,
  athlete_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT strava_connections_user_id_key UNIQUE (user_id)
);

-- Index for looking up connections by Strava athlete ID
CREATE INDEX idx_strava_connections_athlete_id ON public.strava_connections(strava_athlete_id);

-- Auto-update updated_at on modification
CREATE TRIGGER set_strava_connections_updated_at
  BEFORE UPDATE ON public.strava_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 2. strava_activities
-- Stores synced Strava activities, optionally linked to a booking
-- =============================================================================
CREATE TABLE public.strava_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strava_activity_id bigint NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL,
  distance numeric NOT NULL,
  moving_time integer NOT NULL,
  elapsed_time integer NOT NULL,
  total_elevation_gain numeric NOT NULL,
  start_date timestamptz NOT NULL,
  summary_polyline text,
  matched_automatically boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT strava_activities_strava_activity_id_key UNIQUE (strava_activity_id)
);

-- Index for looking up activities by user
CREATE INDEX idx_strava_activities_user_id ON public.strava_activities(user_id);
-- Index for matching activities to bookings by date
CREATE INDEX idx_strava_activities_start_date ON public.strava_activities(start_date);
-- Index for looking up activities by booking
CREATE INDEX idx_strava_activities_booking_id ON public.strava_activities(booking_id);

-- =============================================================================
-- 3. event_routes
-- Stores route data for events (from Strava route or GPX upload)
-- =============================================================================
CREATE TABLE public.event_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  strava_route_id bigint,
  gpx_url text,
  source text NOT NULL CHECK (source IN ('strava', 'gpx')),
  name text NOT NULL,
  distance numeric,
  elevation_gain numeric,
  summary_polyline text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_routes_event_id_key UNIQUE (event_id)
);

-- =============================================================================
-- 4. strava_webhook_subscriptions
-- Tracks active Strava webhook subscriptions (typically just one row)
-- =============================================================================
CREATE TABLE public.strava_webhook_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id integer NOT NULL,
  verify_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- RLS Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- strava_connections: users can only read/write their own connection
CREATE POLICY "Users can view own strava connection"
  ON public.strava_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strava connection"
  ON public.strava_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strava connection"
  ON public.strava_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strava connection"
  ON public.strava_connections FOR DELETE
  USING (auth.uid() = user_id);

-- strava_activities: users can read/write their own activities
CREATE POLICY "Users can view own strava activities"
  ON public.strava_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strava activities"
  ON public.strava_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strava activities"
  ON public.strava_activities FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own strava activities"
  ON public.strava_activities FOR DELETE
  USING (auth.uid() = user_id);

-- event_routes: anyone can read (public event data), organizers can write
CREATE POLICY "Anyone can view event routes"
  ON public.event_routes FOR SELECT
  USING (true);

CREATE POLICY "Organizers can insert event routes"
  ON public.event_routes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update event routes"
  ON public.event_routes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_id
      AND events.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_id
      AND events.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete event routes"
  ON public.event_routes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- strava_webhook_subscriptions: only service role (no user access needed)
-- No RLS policies = no access via anon/authenticated; only service_role bypasses RLS

-- =============================================================================
-- handle_updated_at function (if not already present)
-- =============================================================================
-- Uncomment below if the function doesn't already exist in your database:
--
-- CREATE OR REPLACE FUNCTION public.handle_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
