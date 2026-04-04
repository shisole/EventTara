-- Email unsubscribes for marketing email opt-out
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for unsubscribe"
  ON email_unsubscribes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role full access"
  ON email_unsubscribes FOR ALL
  USING (true);
