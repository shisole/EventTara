-- Downgrade pioneer avatar border from legendary to epic tier
UPDATE avatar_borders SET tier = 'epic'
WHERE criteria_key = 'pioneer' AND tier = 'legendary';
