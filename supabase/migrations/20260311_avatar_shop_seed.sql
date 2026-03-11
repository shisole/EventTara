-- Seed data: starter animals + initial shop items
-- Migration: 20260311_avatar_shop_seed

-- ============================================================
-- Starter Animals (8)
-- ============================================================
INSERT INTO avatar_animals (slug, name, image_url, sort_order) VALUES
  ('bear',  'Bear',  '/avatars/animals/bear.svg',  1),
  ('cat',   'Cat',   '/avatars/animals/cat.svg',   2),
  ('dog',   'Dog',   '/avatars/animals/dog.svg',   3),
  ('bunny', 'Bunny', '/avatars/animals/bunny.svg', 4),
  ('fox',   'Fox',   '/avatars/animals/fox.svg',   5),
  ('panda', 'Panda', '/avatars/animals/panda.svg', 6),
  ('koala', 'Koala', '/avatars/animals/koala.svg', 7),
  ('frog',  'Frog',  '/avatars/animals/frog.svg',  8)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Shop Items: Accessories (5) — common
-- ============================================================
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('cozy-beanie',    'Cozy Beanie',    'accessory', '/avatars/accessory/cozy-beanie.svg',    80,  'common', 1),
  ('baseball-cap',   'Baseball Cap',   'accessory', '/avatars/accessory/baseball-cap.svg',   80,  'common', 2),
  ('red-scarf',      'Red Scarf',      'accessory', '/avatars/accessory/red-scarf.svg',      60,  'common', 3),
  ('cool-sunglasses','Cool Sunglasses','accessory', '/avatars/accessory/cool-sunglasses.svg',120, 'common', 4),
  ('trail-headband', 'Trail Headband', 'accessory', '/avatars/accessory/trail-headband.svg', 100, 'common', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Shop Items: Backgrounds (4) — uncommon / rare
-- ============================================================
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('sunset-gradient', 'Sunset Gradient', 'background', '/avatars/background/sunset-gradient.svg', 150, 'uncommon', 1),
  ('forest-trail',    'Forest Trail',    'background', '/avatars/background/forest-trail.svg',    150, 'uncommon', 2),
  ('mountain-peak',   'Mountain Peak',   'background', '/avatars/background/mountain-peak.svg',   200, 'rare',     3),
  ('starry-night',    'Starry Night',    'background', '/avatars/background/starry-night.svg',    300, 'rare',     4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Shop Items: Borders (3) — rare / legendary
-- ============================================================
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('golden-ring',  'Golden Ring',  'border', '/avatars/border/golden-ring.svg',  250, 'rare',      1),
  ('neon-glow',    'Neon Glow',    'border', '/avatars/border/neon-glow.svg',    250, 'rare',      2),
  ('rainbow',      'Rainbow',      'border', '/avatars/border/rainbow.svg',      500, 'legendary', 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Shop Items: Skins (3) — rare / legendary
-- ============================================================
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('winter-bear', 'Winter Bear', 'skin', '/avatars/skin/winter-bear.svg', 300, 'rare',      1),
  ('pirate-cat',  'Pirate Cat',  'skin', '/avatars/skin/pirate-cat.svg',  300, 'rare',      2),
  ('ninja-fox',   'Ninja Fox',   'skin', '/avatars/skin/ninja-fox.svg',   400, 'legendary', 3)
ON CONFLICT (slug) DO NOTHING;
