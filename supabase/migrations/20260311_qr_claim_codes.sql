-- QR Claim Codes: batch-generated one-time-use QR codes that award badges
-- Each QR links to a physical item (e.g., bag tag) and awards a badge when scanned.

-- Batches group QR codes by badge + campaign
CREATE TABLE IF NOT EXISTS qr_claim_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Individual QR codes within a batch
CREATE TABLE IF NOT EXISTS qr_claim_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES qr_claim_batches(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  serial_number INT NOT NULL,
  claimed_by UUID REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast token lookup
CREATE INDEX IF NOT EXISTS idx_qr_claim_codes_token ON qr_claim_codes (token);

-- RLS
ALTER TABLE qr_claim_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_claim_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read batches (admin check at API layer)
CREATE POLICY "qr_claim_batches_select_authenticated"
  ON qr_claim_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "qr_claim_batches_insert_authenticated"
  ON qr_claim_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can read codes (admin check at API layer)
CREATE POLICY "qr_claim_codes_select_authenticated"
  ON qr_claim_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "qr_claim_codes_insert_authenticated"
  ON qr_claim_codes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow updates for claiming (the RPC uses SECURITY DEFINER, but this covers direct access)
CREATE POLICY "qr_claim_codes_update_authenticated"
  ON qr_claim_codes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anon to read codes (for the claim page to show badge preview before login)
CREATE POLICY "qr_claim_codes_select_anon"
  ON qr_claim_codes FOR SELECT
  TO anon
  USING (true);

-- Atomic claim function: locks row, validates, awards badge, returns result
CREATE OR REPLACE FUNCTION claim_qr_code(p_token TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code RECORD;
  v_batch RECORD;
  v_badge RECORD;
  v_already_has_badge BOOLEAN;
BEGIN
  -- Lock the code row to prevent race conditions
  SELECT id, batch_id, serial_number, claimed_by, claimed_at
  INTO v_code
  FROM qr_claim_codes
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid QR code');
  END IF;

  IF v_code.claimed_by IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'This QR code has already been redeemed');
  END IF;

  -- Get batch info
  SELECT id, badge_id, name, quantity
  INTO v_batch
  FROM qr_claim_batches
  WHERE id = v_code.batch_id;

  -- Get badge info
  SELECT id, title, description, image_url, category, rarity
  INTO v_badge
  FROM badges
  WHERE id = v_batch.badge_id;

  -- Mark code as claimed
  UPDATE qr_claim_codes
  SET claimed_by = p_user_id, claimed_at = now()
  WHERE id = v_code.id;

  -- Check if user already has this badge
  SELECT EXISTS(
    SELECT 1 FROM user_badges
    WHERE user_id = p_user_id AND badge_id = v_batch.badge_id
  ) INTO v_already_has_badge;

  -- Award badge (ON CONFLICT DO NOTHING for idempotency)
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, v_batch.badge_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'serial_number', v_code.serial_number,
    'batch_quantity', v_batch.quantity,
    'batch_name', v_batch.name,
    'badge_title', v_badge.title,
    'badge_description', v_badge.description,
    'badge_image_url', v_badge.image_url,
    'badge_category', v_badge.category,
    'badge_rarity', v_badge.rarity,
    'already_had_badge', v_already_has_badge
  );
END;
$$;

GRANT EXECUTE ON FUNCTION claim_qr_code(TEXT, UUID) TO authenticated;
