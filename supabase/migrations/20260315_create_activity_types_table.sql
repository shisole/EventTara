-- Create activity_types table for CMS-managed activity types
CREATE TABLE IF NOT EXISTS activity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  short_label text NOT NULL,
  plural_label text NOT NULL,
  icon text NOT NULL DEFAULT '🏃',
  image_url text,
  color_preset text NOT NULL DEFAULT 'gray',
  supports_distance boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'outdoor' CHECK (category IN ('outdoor', 'indoor')),
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
INSERT INTO activity_types (slug, label, short_label, plural_label, icon, image_url, color_preset, supports_distance, category, sort_order)
VALUES
  ('hiking', 'Hiking', 'Hiking', 'Hikes', '🥾', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop', 'emerald', false, 'outdoor', 1),
  ('mtb', 'Mountain Biking', 'MTB', 'MTB Rides', '🚵', 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600&h=400&fit=crop', 'amber', false, 'outdoor', 2),
  ('road_bike', 'Road Biking', 'Road Bike', 'Road Rides', '🚴', 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop', 'blue', true, 'outdoor', 3),
  ('running', 'Running', 'Running', 'Runs', '🏃', 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop', 'orange', true, 'outdoor', 4),
  ('trail_run', 'Trail Running', 'Trail Run', 'Trail Runs', '🏔️', 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=400&fit=crop', 'yellow', true, 'outdoor', 5);
