-- ===========================================
-- organizer_waitlist: collect organizer interest before launch
-- ===========================================
CREATE TABLE organizer_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  org_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organizer_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up (anonymous inserts)
CREATE POLICY "organizer_waitlist_insert_anon"
  ON organizer_waitlist FOR INSERT
  WITH CHECK (true);

-- Public select for count queries only (head: true)
CREATE POLICY "organizer_waitlist_select_public"
  ON organizer_waitlist FOR SELECT
  USING (true);
