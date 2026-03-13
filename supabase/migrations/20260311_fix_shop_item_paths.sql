-- Fix shop_items image_url paths to match actual file locations
-- Run this on databases that already ran the old seed

UPDATE shop_items SET image_url = '/avatars/accessories/hat-beanie.svg'    WHERE slug = 'cozy-beanie';
UPDATE shop_items SET image_url = '/avatars/accessories/hat-cap.svg'       WHERE slug = 'baseball-cap';
UPDATE shop_items SET image_url = '/avatars/accessories/scarf-red.svg'     WHERE slug = 'red-scarf';
UPDATE shop_items SET image_url = '/avatars/accessories/glasses-sun.svg'   WHERE slug = 'cool-sunglasses';
UPDATE shop_items SET image_url = '/avatars/accessories/headband-hike.svg' WHERE slug = 'trail-headband';

UPDATE shop_items SET image_url = '/avatars/backgrounds/bg-sunset.svg'   WHERE slug = 'sunset-gradient';
UPDATE shop_items SET image_url = '/avatars/backgrounds/bg-forest.svg'   WHERE slug = 'forest-trail';
UPDATE shop_items SET image_url = '/avatars/backgrounds/bg-mountain.svg' WHERE slug = 'mountain-peak';
UPDATE shop_items SET image_url = '/avatars/backgrounds/bg-starry.svg'   WHERE slug = 'starry-night';

UPDATE shop_items SET image_url = '/avatars/borders/border-gold.svg'    WHERE slug = 'golden-ring';
UPDATE shop_items SET image_url = '/avatars/borders/border-neon.svg'    WHERE slug = 'neon-glow';
UPDATE shop_items SET image_url = '/avatars/borders/border-rainbow.svg' WHERE slug = 'rainbow';

UPDATE shop_items SET image_url = '/avatars/skins/skin-winter-bear.svg' WHERE slug = 'winter-bear';
UPDATE shop_items SET image_url = '/avatars/skins/skin-pirate-cat.svg'  WHERE slug = 'pirate-cat';
UPDATE shop_items SET image_url = '/avatars/skins/skin-ninja-fox.svg'   WHERE slug = 'ninja-fox';
