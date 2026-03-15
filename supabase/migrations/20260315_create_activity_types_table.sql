-- Create activity_types table for CMS-managed activity types
CREATE TABLE IF NOT EXISTS activity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  short_label text NOT NULL,
  plural_label text NOT NULL,
  icon text NOT NULL DEFAULT '🏃',
  color_preset text NOT NULL DEFAULT 'gray',
  supports_distance boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'outdoor' CHECK (category IN ('outdoor', 'indoor', 'fitness')),
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public SELECT, authenticated INSERT/UPDATE/DELETE (admin check at API layer)
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read activity types"
  ON activity_types FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert activity types"
  ON activity_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update activity types"
  ON activity_types FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete activity types"
  ON activity_types FOR DELETE
  TO authenticated
  USING (true);

-- Seed with existing 5 activity types matching current constants
INSERT INTO activity_types (slug, label, short_label, plural_label, icon, color_preset, supports_distance, category, sort_order)
VALUES
  ('hiking', 'Hiking', 'Hiking', 'Hikes', '🥾', 'emerald', false, 'outdoor', 1),
  ('mtb', 'Mountain Biking', 'MTB', 'MTB Rides', '🚵', 'amber', false, 'outdoor', 2),
  ('road_bike', 'Road Biking', 'Road Bike', 'Road Rides', '🚴', 'blue', true, 'outdoor', 3),
  ('running', 'Running', 'Running', 'Runs', '🏃', 'orange', true, 'outdoor', 4),
  ('trail_run', 'Trail Running', 'Trail Run', 'Trail Runs', '🏔️', 'yellow', true, 'outdoor', 5);
