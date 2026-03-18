-- Simplify user roles: collapse 'participant' and 'organizer' into 'user'.
-- Only 'user' and 'guest' remain meaningful.

-- 1. Migrate existing rows
UPDATE users SET role = 'user' WHERE role IN ('participant', 'organizer');

-- 2. Set default
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- 3. Drop old CHECK constraint and create new one
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'guest'));

-- 4. Recreate claim_club without the "UPDATE users SET role = 'organizer'" line
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

  RETURN jsonb_build_object('success', true, 'club_slug', v_club.slug);
END;
$$;
