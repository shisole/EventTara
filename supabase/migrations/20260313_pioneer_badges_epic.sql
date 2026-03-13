-- Downgrade pioneer badges from legendary to epic rarity
UPDATE badges SET rarity = 'epic', image_url = '🚀'
WHERE criteria_key = 'pioneer' AND type = 'system';

UPDATE badges SET rarity = 'epic', image_url = '⭐'
WHERE criteria_key = 'pioneer_participant' AND type = 'system';

UPDATE badges SET rarity = 'epic', image_url = '🏕️'
WHERE criteria_key = 'pioneer_organizer' AND type = 'system';
