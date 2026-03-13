-- Strava activity milestone badges
-- Awarded based on cumulative Strava activity data (distance, elevation)

INSERT INTO badges (id, title, description, image_url, category, rarity, type, criteria_key)
SELECT gen_random_uuid(), 'First Tracked', 'Logged your first Strava activity on EventTara', '📡', 'special', 'common', 'system', 'strava_activities_1'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE criteria_key = 'strava_activities_1');

INSERT INTO badges (id, title, description, image_url, category, rarity, type, criteria_key)
SELECT gen_random_uuid(), '50K Club', 'Accumulated 50km of total Strava distance', '🛤️', 'distance', 'common', 'system', 'strava_distance_50k'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE criteria_key = 'strava_distance_50k');

INSERT INTO badges (id, title, description, image_url, category, rarity, type, criteria_key)
SELECT gen_random_uuid(), 'Century Athlete', 'Accumulated 100km of total Strava distance', '💯', 'distance', 'rare', 'system', 'strava_distance_100k'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE criteria_key = 'strava_distance_100k');

INSERT INTO badges (id, title, description, image_url, category, rarity, type, criteria_key)
SELECT gen_random_uuid(), '500K Legend', 'Accumulated 500km of total Strava distance', '🗺️', 'distance', 'epic', 'system', 'strava_distance_500k'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE criteria_key = 'strava_distance_500k');

INSERT INTO badges (id, title, description, image_url, category, rarity, type, criteria_key)
SELECT gen_random_uuid(), 'Hill Climber', 'Accumulated 5,000m of total Strava elevation gain', '⛰️', 'adventure', 'common', 'system', 'strava_elevation_5000m'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE criteria_key = 'strava_elevation_5000m');

INSERT INTO badges (id, title, description, image_url, category, rarity, type, criteria_key)
SELECT gen_random_uuid(), 'Skyward', 'Accumulated 10,000m of total Strava elevation gain', '☁️', 'adventure', 'rare', 'system', 'strava_elevation_10000m'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE criteria_key = 'strava_elevation_10000m');

INSERT INTO badges (id, title, description, image_url, category, rarity, type, criteria_key)
SELECT gen_random_uuid(), 'Everest', 'Accumulated 29,032m of total Strava elevation gain — the height of Mount Everest', '🏔️', 'adventure', 'legendary', 'system', 'strava_elevation_29000m'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE criteria_key = 'strava_elevation_29000m');
