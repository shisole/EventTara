-- Create event_distances table for distance categories (running, trail run, road bike events)
CREATE TABLE event_distances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  distance_km numeric NOT NULL,
  label text,
  price numeric NOT NULL,
  max_participants integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Each event can only have one entry per distance
ALTER TABLE event_distances
  ADD CONSTRAINT event_distances_event_id_distance_km_key UNIQUE (event_id, distance_km);

-- Enable RLS
ALTER TABLE event_distances ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "event_distances_select_public"
  ON event_distances FOR SELECT
  USING (true);

-- Insert: only the event organizer
CREATE POLICY "event_distances_insert_organizer"
  ON event_distances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_distances.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Update: only the event organizer
CREATE POLICY "event_distances_update_organizer"
  ON event_distances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_distances.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Delete: only the event organizer
CREATE POLICY "event_distances_delete_organizer"
  ON event_distances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_distances.event_id
        AND events.organizer_id = auth.uid()
    )
  );

-- Add event_distance_id to bookings (nullable — not all events use distance categories)
ALTER TABLE bookings
  ADD COLUMN event_distance_id uuid REFERENCES event_distances(id);
