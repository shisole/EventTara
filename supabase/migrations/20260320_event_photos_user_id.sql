-- Add user_id to event_photos so we know who uploaded each photo
ALTER TABLE event_photos ADD COLUMN user_id uuid REFERENCES auth.users(id);

CREATE INDEX idx_event_photos_user_id ON event_photos(user_id);

-- RLS: anyone can view event photos
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event photos"
  ON event_photos FOR SELECT
  USING (true);

-- Authenticated users can insert their own photos
CREATE POLICY "Authenticated users can insert event photos"
  ON event_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete own event photos"
  ON event_photos FOR DELETE
  USING (auth.uid() = user_id);
