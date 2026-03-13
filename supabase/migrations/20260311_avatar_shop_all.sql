-- =============================================================================
-- Avatar Shop, TaraTokens & Cosmetic Shop — Combined Migration
-- Run this single file to set up the entire feature.
-- =============================================================================

-- ============================================================
-- 1. Feature flag
-- ============================================================
ALTER TABLE cms_feature_flags ADD COLUMN IF NOT EXISTS avatar_shop_enabled BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. avatar_animals — starter animal catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS avatar_animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE avatar_animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read avatar animals"
  ON avatar_animals FOR SELECT
  USING (true);

-- ============================================================
-- 3. tara_tokens — cached balance per user
-- ============================================================
CREATE TABLE IF NOT EXISTS tara_tokens (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tara_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token balance"
  ON tara_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. token_transactions — immutable append-only ledger
-- ============================================================
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount int NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'check_in', 'hosting', 'daily_login', 'streak_bonus',
    'milestone', 'purchase', 'badge_earned', 'first_event', 'admin_grant'
  )),
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_token_transactions_user
  ON token_transactions(user_id, created_at DESC);

-- ============================================================
-- 5. shop_items — items catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('accessory', 'background', 'border', 'skin')),
  image_url text NOT NULL,
  preview_url text,
  price int NOT NULL CHECK (price > 0),
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active shop items"
  ON shop_items FOR SELECT
  USING (is_active = true);

-- ============================================================
-- 6. user_inventory — purchased items
-- ============================================================
CREATE TABLE IF NOT EXISTS user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_item_id uuid NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_item_id)
);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own inventory"
  ON user_inventory FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. user_avatar_config — equipped state
-- ============================================================
CREATE TABLE IF NOT EXISTS user_avatar_config (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  animal_id uuid REFERENCES avatar_animals(id),
  equipped_accessory_id uuid REFERENCES shop_items(id),
  equipped_background_id uuid REFERENCES shop_items(id),
  equipped_border_id uuid REFERENCES shop_items(id),
  equipped_skin_id uuid REFERENCES shop_items(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_avatar_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own avatar config"
  ON user_avatar_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar config"
  ON user_avatar_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar config"
  ON user_avatar_config FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 8. Add columns to users table
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_picked_avatar boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_login date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_streak int NOT NULL DEFAULT 0;

-- ============================================================
-- 9. RPC: award_tokens
-- ============================================================
CREATE OR REPLACE FUNCTION award_tokens(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_reference_id text DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance int;
BEGIN
  -- Upsert the balance
  INSERT INTO tara_tokens (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = tara_tokens.balance + p_amount,
    updated_at = now();

  -- Get the new balance
  SELECT balance INTO v_new_balance
  FROM tara_tokens
  WHERE user_id = p_user_id;

  -- Insert transaction record
  INSERT INTO token_transactions (user_id, amount, reason, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id);

  RETURN v_new_balance;
END;
$$;

-- ============================================================
-- 10. RPC: purchase_shop_item
-- ============================================================
CREATE OR REPLACE FUNCTION purchase_shop_item(
  p_user_id uuid,
  p_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_name text;
  v_item_price int;
  v_item_active boolean;
  v_already_owned boolean;
  v_current_balance int;
  v_new_balance int;
BEGIN
  -- Check item exists and is active
  SELECT name, price, is_active
  INTO v_item_name, v_item_price, v_item_active
  FROM shop_items
  WHERE id = p_item_id;

  IF v_item_name IS NULL THEN
    RETURN jsonb_build_object('error', 'Item not found');
  END IF;

  IF NOT v_item_active THEN
    RETURN jsonb_build_object('error', 'Item is not available');
  END IF;

  -- Check not already owned
  SELECT EXISTS(
    SELECT 1 FROM user_inventory
    WHERE user_id = p_user_id AND shop_item_id = p_item_id
  ) INTO v_already_owned;

  IF v_already_owned THEN
    RETURN jsonb_build_object('error', 'Item already owned');
  END IF;

  -- Check balance
  SELECT balance INTO v_current_balance
  FROM tara_tokens
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL OR v_current_balance < v_item_price THEN
    RETURN jsonb_build_object('error', 'Insufficient TaraTokens');
  END IF;

  -- Deduct balance atomically
  UPDATE tara_tokens
  SET balance = balance - v_item_price,
      updated_at = now()
  WHERE user_id = p_user_id
    AND balance >= v_item_price;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Insufficient TaraTokens');
  END IF;

  -- Get new balance
  SELECT balance INTO v_new_balance
  FROM tara_tokens
  WHERE user_id = p_user_id;

  -- Add to inventory
  INSERT INTO user_inventory (user_id, shop_item_id)
  VALUES (p_user_id, p_item_id);

  -- Record transaction
  INSERT INTO token_transactions (user_id, amount, reason, reference_id)
  VALUES (p_user_id, -v_item_price, 'purchase', p_item_id::text);

  RETURN jsonb_build_object(
    'success', true,
    'item_name', v_item_name,
    'new_balance', v_new_balance
  );
END;
$$;

-- ============================================================
-- 11. Seed: starter animals (8)
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
-- 12. Seed: shop items — accessories (5)
-- ============================================================
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('cozy-beanie',    'Cozy Beanie',    'accessory', '/avatars/accessories/hat-beanie.svg',    80,  'common', 1),
  ('baseball-cap',   'Baseball Cap',   'accessory', '/avatars/accessories/hat-cap.svg',       80,  'common', 2),
  ('red-scarf',      'Red Scarf',      'accessory', '/avatars/accessories/scarf-red.svg',     60,  'common', 3),
  ('cool-sunglasses','Cool Sunglasses','accessory', '/avatars/accessories/glasses-sun.svg',   120, 'common', 4),
  ('trail-headband', 'Trail Headband', 'accessory', '/avatars/accessories/headband-hike.svg', 100, 'common', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 13. Seed: shop items — backgrounds (4)
-- ============================================================
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('sunset-gradient', 'Sunset Gradient', 'background', '/avatars/backgrounds/bg-sunset.svg',   150, 'uncommon', 1),
  ('forest-trail',    'Forest Trail',    'background', '/avatars/backgrounds/bg-forest.svg',   150, 'uncommon', 2),
  ('mountain-peak',   'Mountain Peak',   'background', '/avatars/backgrounds/bg-mountain.svg', 200, 'rare',     3),
  ('starry-night',    'Starry Night',    'background', '/avatars/backgrounds/bg-starry.svg',   300, 'rare',     4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 14. Seed: shop items — borders (3)
-- ============================================================
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('golden-ring',  'Golden Ring',  'border', '/avatars/borders/border-gold.svg',    250, 'rare',      1),
  ('neon-glow',    'Neon Glow',    'border', '/avatars/borders/border-neon.svg',    250, 'rare',      2),
  ('rainbow',      'Rainbow',      'border', '/avatars/borders/border-rainbow.svg', 500, 'legendary', 3)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 15. Seed: shop items — skins (3)
-- ============================================================
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('winter-bear', 'Winter Bear', 'skin', '/avatars/skins/skin-winter-bear.svg', 300, 'rare',      1),
  ('pirate-cat',  'Pirate Cat',  'skin', '/avatars/skins/skin-pirate-cat.svg',  300, 'rare',      2),
  ('ninja-fox',   'Ninja Fox',   'skin', '/avatars/skins/skin-ninja-fox.svg',   400, 'legendary', 3)
ON CONFLICT (slug) DO NOTHING;
