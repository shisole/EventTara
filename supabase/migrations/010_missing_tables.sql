-- Tables that were created manually in production but never had migrations:
-- mountains, event_mountains, guides, event_guides, guide_reviews,
-- event_routes, strava_connections, strava_activities, strava_webhook_subscriptions

-- ============================================================================
-- 1. Mountains
-- ============================================================================

CREATE TABLE IF NOT EXISTS mountains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL,
  elevation_masl INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mountains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mountains_select_public" ON mountains FOR SELECT USING (true);

-- ============================================================================
-- 2. Event-Mountains junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_mountains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  mountain_id UUID NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
  route_name TEXT,
  difficulty_override INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, mountain_id)
);

ALTER TABLE event_mountains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_mountains_select_public" ON event_mountains FOR SELECT USING (true);
CREATE POLICY "event_mountains_insert_organizer" ON event_mountains FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_mountains.event_id
      AND events.organizer_id = auth.uid()
  ));
CREATE POLICY "event_mountains_delete_organizer" ON event_mountains FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_mountains.event_id
      AND events.organizer_id = auth.uid()
  ));

-- ============================================================================
-- 3. Guides
-- ============================================================================

CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  contact_number TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guides_select_public" ON guides FOR SELECT USING (true);
CREATE POLICY "guides_insert_authenticated" ON guides FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "guides_update_creator" ON guides FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY "guides_delete_creator" ON guides FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- 4. Event-Guides junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, guide_id)
);

ALTER TABLE event_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_guides_select_public" ON event_guides FOR SELECT USING (true);
CREATE POLICY "event_guides_insert_organizer" ON event_guides FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_guides.event_id
      AND events.organizer_id = auth.uid()
  ));
CREATE POLICY "event_guides_delete_organizer" ON event_guides FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_guides.event_id
      AND events.organizer_id = auth.uid()
  ));

-- ============================================================================
-- 5. Guide Reviews
-- ============================================================================

CREATE TABLE IF NOT EXISTS guide_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guide_id, user_id, event_id)
);

ALTER TABLE guide_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guide_reviews_select_public" ON guide_reviews FOR SELECT USING (true);
CREATE POLICY "guide_reviews_insert_authenticated" ON guide_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "guide_reviews_update_own" ON guide_reviews FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "guide_reviews_delete_own" ON guide_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Event Routes (one-to-one with events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  strava_route_id INTEGER,
  gpx_url TEXT,
  source TEXT NOT NULL CHECK (source IN ('strava', 'gpx')),
  name TEXT NOT NULL,
  distance INTEGER,
  elevation_gain INTEGER,
  summary_polyline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_routes_select_public" ON event_routes FOR SELECT USING (true);
CREATE POLICY "event_routes_insert_organizer" ON event_routes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_routes.event_id
      AND events.organizer_id = auth.uid()
  ));
CREATE POLICY "event_routes_update_organizer" ON event_routes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_routes.event_id
      AND events.organizer_id = auth.uid()
  ));
CREATE POLICY "event_routes_delete_organizer" ON event_routes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_routes.event_id
      AND events.organizer_id = auth.uid()
  ));

-- ============================================================================
-- 7. Strava Connections
-- ============================================================================

CREATE TABLE IF NOT EXISTS strava_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  strava_athlete_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  athlete_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strava_connections_select_own" ON strava_connections FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "strava_connections_insert_own" ON strava_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "strava_connections_update_own" ON strava_connections FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "strava_connections_delete_own" ON strava_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. Strava Activities
-- ============================================================================

CREATE TABLE IF NOT EXISTS strava_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strava_activity_id INTEGER NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  distance REAL NOT NULL DEFAULT 0,
  moving_time INTEGER NOT NULL DEFAULT 0,
  elapsed_time INTEGER NOT NULL DEFAULT 0,
  total_elevation_gain REAL NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  summary_polyline TEXT,
  matched_automatically BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, strava_activity_id)
);

ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strava_activities_select_own" ON strava_activities FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "strava_activities_insert_own" ON strava_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "strava_activities_update_own" ON strava_activities FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "strava_activities_delete_own" ON strava_activities FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. Strava Webhook Subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS strava_webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id INTEGER NOT NULL UNIQUE,
  verify_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE strava_webhook_subscriptions ENABLE ROW LEVEL SECURITY;
-- No public access — only accessed via service role in webhook handler
