-- Avatar borders: gamified collectible decorative rings for user avatars

CREATE TABLE avatar_borders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  tier text NOT NULL CHECK (tier IN ('common', 'rare', 'epic', 'legendary')),
  criteria_type text NOT NULL CHECK (criteria_type IN (
    'signup_date', 'event_count', 'event_type_count',
    'all_activities', 'mountain_region', 'organizer_event_count'
  )),
  criteria_value jsonb NOT NULL DEFAULT '{}',
  border_color text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE user_avatar_borders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  border_id uuid NOT NULL REFERENCES avatar_borders(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  CONSTRAINT user_avatar_borders_user_border_key UNIQUE (user_id, border_id)
);

ALTER TABLE users
  ADD COLUMN active_border_id uuid REFERENCES avatar_borders(id) ON DELETE SET NULL;

-- RLS policies

ALTER TABLE avatar_borders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_avatar_borders ENABLE ROW LEVEL SECURITY;

-- Avatar borders: readable by everyone
CREATE POLICY "avatar_borders_select_public"
  ON avatar_borders FOR SELECT USING (true);

-- User avatar borders: users can read their own, public can read any (for displaying borders)
CREATE POLICY "user_avatar_borders_select_public"
  ON user_avatar_borders FOR SELECT USING (true);

CREATE POLICY "user_avatar_borders_insert_system"
  ON user_avatar_borders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed initial avatar borders
INSERT INTO avatar_borders (slug, name, description, tier, criteria_type, criteria_value, border_color, sort_order) VALUES
  -- Pioneer (signup date)
  ('pioneer', 'EventTara Pioneer', 'Among the first to join EventTara', 'legendary', 'signup_date', '{"before": "2026-04-01"}', '#f59e0b', 0),

  -- Event count milestones
  ('first-adventure', 'First Adventure', 'Completed your first event', 'common', 'event_count', '{"min_events": 1}', '#10b981', 10),
  ('getting-started', 'Getting Started', 'Completed 3 events', 'common', 'event_count', '{"min_events": 3}', '#14b8a6', 11),
  ('regular-adventurer', 'Regular Adventurer', 'Completed 10 events', 'rare', 'event_count', '{"min_events": 10}', '#6366f1', 12),
  ('seasoned-explorer', 'Seasoned Explorer', 'Completed 15 events', 'rare', 'event_count', '{"min_events": 15}', '#8b5cf6', 13),
  ('event-veteran', 'Event Veteran', 'Completed 25 events', 'epic', 'event_count', '{"min_events": 25}', '#ec4899', 14),
  ('event-legend', 'Event Legend', 'Completed 50 events', 'legendary', 'event_count', '{"min_events": 50}', '#f59e0b', 15),

  -- Activity specialist
  ('hiking-enthusiast', 'Hiking Enthusiast', 'Completed 5 hiking events', 'common', 'event_type_count', '{"event_type": "hiking", "min_events": 5}', '#22c55e', 20),
  ('summit-seeker', 'Summit Seeker', 'Completed 10 hiking events', 'rare', 'event_type_count', '{"event_type": "hiking", "min_events": 10}', '#6366f1', 21),
  ('trail-runner', 'Trail Runner', 'Completed 5 trail running events', 'common', 'event_type_count', '{"event_type": "trail_run", "min_events": 5}', '#22c55e', 22),
  ('mtb-rider', 'MTB Rider', 'Completed 5 MTB events', 'common', 'event_type_count', '{"event_type": "mtb", "min_events": 5}', '#22c55e', 23),
  ('road-warrior', 'Road Warrior', 'Completed 5 road bike events', 'common', 'event_type_count', '{"event_type": "road_bike", "min_events": 5}', '#22c55e', 24),
  ('speed-demon', 'Speed Demon', 'Completed 5 running events', 'common', 'event_type_count', '{"event_type": "running", "min_events": 5}', '#22c55e', 25),

  -- All-Rounder
  ('all-rounder', 'All-Rounder', 'Completed at least one event of every activity type', 'epic', 'all_activities', '{"required_types": ["hiking", "mtb", "road_bike", "running", "trail_run"]}', '#ec4899', 30),

  -- Mountain region
  ('igbaras-conqueror', 'Igbaras Mountain Conqueror', 'Conquered 8 mountains in Iloilo', 'epic', 'mountain_region', '{"province": "Iloilo", "mountain_count": 8}', '#ec4899', 40),

  -- Organizer tiers
  ('event-host', 'Event Host', 'Organized 5 events', 'common', 'organizer_event_count', '{"min_events": 5}', '#22c55e', 50),
  ('community-builder', 'Community Builder', 'Organized 10 events', 'rare', 'organizer_event_count', '{"min_events": 10}', '#6366f1', 51),
  ('trail-blazer', 'Trail Blazer', 'Organized 20 events', 'epic', 'organizer_event_count', '{"min_events": 20}', '#ec4899', 52);
