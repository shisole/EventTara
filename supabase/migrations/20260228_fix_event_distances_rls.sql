-- Fix event_distances RLS policies: organizer_id is organizer_profiles.id, not auth.uid()

-- Drop broken policies
DROP POLICY "event_distances_insert_organizer" ON event_distances;
DROP POLICY "event_distances_update_organizer" ON event_distances;
DROP POLICY "event_distances_delete_organizer" ON event_distances;

-- Recreate with correct join through organizer_profiles
CREATE POLICY "event_distances_insert_organizer"
  ON event_distances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_distances.event_id
        AND events.organizer_id IN (
          SELECT id FROM organizer_profiles WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "event_distances_update_organizer"
  ON event_distances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_distances.event_id
        AND events.organizer_id IN (
          SELECT id FROM organizer_profiles WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "event_distances_delete_organizer"
  ON event_distances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_distances.event_id
        AND events.organizer_id IN (
          SELECT id FROM organizer_profiles WHERE user_id = auth.uid()
        )
    )
  );
