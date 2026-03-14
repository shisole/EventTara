-- Change strava_route_id from INTEGER to TEXT to support large Strava route IDs
-- (e.g. 3467575946256382810 exceeds both INT and JS Number.MAX_SAFE_INTEGER)
ALTER TABLE event_routes ALTER COLUMN strava_route_id TYPE text USING strava_route_id::text;
