-- Add 'animal' to shop_items category check constraint
ALTER TABLE shop_items DROP CONSTRAINT shop_items_category_check;
ALTER TABLE shop_items ADD CONSTRAINT shop_items_category_check
  CHECK (category IN ('accessory', 'animal', 'background', 'border', 'skin'));

-- Add 8 animal avatars as shop items (25 tokens each)
-- These match the existing avatar_animals rows by slug
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('bear',  'Bear',  'animal', '/avatars/animals/bear.svg',  25, 'common', 1),
  ('cat',   'Cat',   'animal', '/avatars/animals/cat.svg',   25, 'common', 2),
  ('dog',   'Dog',   'animal', '/avatars/animals/dog.svg',   25, 'common', 3),
  ('bunny', 'Bunny', 'animal', '/avatars/animals/bunny.svg', 25, 'common', 4),
  ('fox',   'Fox',   'animal', '/avatars/animals/fox.svg',   25, 'common', 5),
  ('panda', 'Panda', 'animal', '/avatars/animals/panda.svg', 25, 'common', 6),
  ('koala', 'Koala', 'animal', '/avatars/animals/koala.svg', 25, 'common', 7),
  ('frog',  'Frog',  'animal', '/avatars/animals/frog.svg',  25, 'common', 8)
ON CONFLICT (slug) DO NOTHING;
