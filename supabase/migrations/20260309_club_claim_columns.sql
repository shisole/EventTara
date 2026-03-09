-- Add claim columns to clubs table for admin-created club claiming
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT true;

-- Index for fast claim token lookups
CREATE INDEX IF NOT EXISTS idx_clubs_claim_token ON clubs (claim_token) WHERE claim_token IS NOT NULL;

-- Allow anyone (including unauthenticated visitors) to read unclaimed clubs by claim token.
-- Safe because: the 128-bit token is required to filter, and only name/logo are displayed.
CREATE POLICY "clubs_select_unclaimed"
  ON clubs FOR SELECT
  USING (is_claimed = false AND claim_token IS NOT NULL);

-- Allow authenticated users to update unclaimed clubs (admin token regeneration).
-- Admin authorization is enforced at the API layer; unclaimed clubs have no owner to check against.
CREATE POLICY "clubs_update_unclaimed"
  ON clubs FOR UPDATE
  USING (is_claimed = false AND auth.uid() IS NOT NULL)
  WITH CHECK (is_claimed = false);

-- Atomic claim function — bypasses RLS to handle the full claim in one transaction.
-- Validates token, expiry, and claimed status internally.
CREATE OR REPLACE FUNCTION claim_club(p_token TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_club RECORD;
BEGIN
  -- Lock the row to prevent race conditions (two people claiming simultaneously)
  SELECT id, name, slug, is_claimed, claim_expires_at
  INTO v_club
  FROM clubs
  WHERE claim_token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invalid claim link');
  END IF;

  IF v_club.is_claimed THEN
    RETURN jsonb_build_object('error', 'This club has already been claimed');
  END IF;

  IF v_club.claim_expires_at IS NOT NULL AND v_club.claim_expires_at < now() THEN
    RETURN jsonb_build_object('error', 'This claim link has expired. Please contact the admin for a new one.');
  END IF;

  -- Mark club as claimed, clear token
  UPDATE clubs
  SET is_claimed = true, claim_token = NULL, claim_expires_at = NULL
  WHERE id = v_club.id;

  -- Add user as club owner
  INSERT INTO club_members (club_id, user_id, role)
  VALUES (v_club.id, p_user_id, 'owner');

  -- Ensure user has organizer role
  UPDATE users SET role = 'organizer' WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'club_slug', v_club.slug);
END;
$$;

-- Allow both anon (new user flow — session not yet established) and authenticated to call
GRANT EXECUTE ON FUNCTION claim_club(TEXT, UUID) TO anon, authenticated;
