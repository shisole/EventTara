-- Quiz responses for onboarding demographics
CREATE TABLE quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  anonymous_id UUID NOT NULL,
  activities TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  first_name TEXT,
  age_range TEXT CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  location TEXT,
  discovery_source TEXT CHECK (discovery_source IN ('social_media', 'friend', 'google', 'poster', 'other')),
  completed_at TIMESTAMPTZ,
  skipped_at_step INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_anonymous_id_unique UNIQUE (anonymous_id);

CREATE INDEX idx_quiz_responses_anonymous_id ON quiz_responses(anonymous_id);
CREATE INDEX idx_quiz_responses_user_id ON quiz_responses(user_id);

-- RLS: anyone can insert (anonymous visitors), only owner can read their own
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz responses"
  ON quiz_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own quiz responses"
  ON quiz_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Update quiz responses by anonymous_id"
  ON quiz_responses FOR UPDATE
  USING (true)
  WITH CHECK (true);
