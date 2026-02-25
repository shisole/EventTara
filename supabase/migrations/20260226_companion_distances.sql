-- Add event_distance_id to booking_companions so each companion can have their own distance
ALTER TABLE booking_companions
  ADD COLUMN event_distance_id uuid REFERENCES event_distances(id);
