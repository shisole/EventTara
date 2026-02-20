-- Migration: Change coordinates column from POINT to JSONB
-- Expected shape: { "lat": number, "lng": number }
-- This allows storing event coordinates as a simple JSON object
-- compatible with TypeScript { lat: number; lng: number } type.

ALTER TABLE events
  ALTER COLUMN coordinates TYPE jsonb
  USING CASE
    WHEN coordinates IS NOT NULL THEN
      jsonb_build_object('lat', coordinates[0]::float, 'lng', coordinates[1]::float)
    ELSE NULL
  END;

COMMENT ON COLUMN events.coordinates IS 'Event location coordinates as JSON: { "lat": number, "lng": number }';
