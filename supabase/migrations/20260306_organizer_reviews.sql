-- Organizer Reviews: direct reviews for organizers (separate from per-event reviews)

-- 1. Main reviews table
CREATE TABLE IF NOT EXISTS organizer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES organizer_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text varchar(1000),
  is_anonymous boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organizer_id, user_id)
);

-- Index for listing reviews by organizer
CREATE INDEX idx_organizer_reviews_org ON organizer_reviews(organizer_id, created_at DESC);

-- 2. Review photos table
CREATE TABLE IF NOT EXISTS organizer_review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES organizer_reviews(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizer_review_photos_review ON organizer_review_photos(review_id, sort_order);

-- 3. Feature flag column
ALTER TABLE cms_feature_flags
  ADD COLUMN IF NOT EXISTS organizer_reviews boolean NOT NULL DEFAULT false;

-- 4. RLS policies
ALTER TABLE organizer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_review_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "organizer_reviews_select" ON organizer_reviews
  FOR SELECT USING (true);

-- Authenticated users can insert their own review
CREATE POLICY "organizer_reviews_insert" ON organizer_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own review
CREATE POLICY "organizer_reviews_update" ON organizer_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Anyone can read review photos
CREATE POLICY "organizer_review_photos_select" ON organizer_review_photos
  FOR SELECT USING (true);

-- Users can insert photos for their own reviews
CREATE POLICY "organizer_review_photos_insert" ON organizer_review_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizer_reviews
      WHERE organizer_reviews.id = review_id
        AND organizer_reviews.user_id = auth.uid()
    )
  );

-- Users can delete photos from their own reviews
CREATE POLICY "organizer_review_photos_delete" ON organizer_review_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organizer_reviews
      WHERE organizer_reviews.id = review_id
        AND organizer_reviews.user_id = auth.uid()
    )
  );

-- 5. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_organizer_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizer_review_updated_at
  BEFORE UPDATE ON organizer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_organizer_review_updated_at();
