-- Downgrade pioneer avatar border from legendary to epic tier
UPDATE avatar_borders SET tier = 'epic'
WHERE slug = 'pioneer' AND tier = 'legendary';
