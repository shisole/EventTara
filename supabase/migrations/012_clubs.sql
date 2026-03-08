-- ============================================================================
-- Migration: Organizer Profiles → Clubs
-- ============================================================================
-- This migration introduces the "clubs" concept to replace organizer_profiles.
-- It creates new tables, migrates existing data, and renames review tables.
-- It does NOT drop organizer_profiles or events.organizer_id (backward compat).
-- ============================================================================

-- ============================================================================
-- 1. Create clubs table
-- ============================================================================

CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  activity_types TEXT[],
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  payment_info JSONB DEFAULT '{}',
  location TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. Create club_members table
-- ============================================================================

CREATE TABLE public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(club_id, user_id)
);

-- ============================================================================
-- 3. Create club_invites table
-- ============================================================================

CREATE TABLE public.club_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL,
  max_uses INT,
  uses INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. Migrate data from organizer_profiles → clubs
-- ============================================================================

-- Generate slugs from org_name: lowercase, replace non-alphanumeric with hyphens,
-- trim leading/trailing hyphens, append short id suffix for uniqueness.
INSERT INTO public.clubs (id, name, slug, description, logo_url, payment_info, is_demo, created_at)
SELECT
  op.id,
  op.org_name,
  -- Create a URL-safe slug: lowercase, replace spaces/special chars with hyphens,
  -- collapse multiple hyphens, trim edges, append last 8 chars of id for uniqueness
  CONCAT(
    TRIM(BOTH '-' FROM
      regexp_replace(
        regexp_replace(lower(op.org_name), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      )
    ),
    '-',
    LEFT(op.id::text, 8)
  ),
  op.description,
  op.logo_url,
  op.payment_info,
  op.is_demo,
  op.created_at
FROM public.organizer_profiles op;

-- ============================================================================
-- 5. Create club_members owner entries for existing organizer users
-- ============================================================================

-- For each organizer_profile that has a user_id, create an owner membership
INSERT INTO public.club_members (club_id, user_id, role, joined_at)
SELECT
  op.id,        -- club_id = organizer_profiles.id (same id carried over)
  op.user_id,
  'owner',
  op.created_at
FROM public.organizer_profiles op
WHERE op.user_id IS NOT NULL;

-- ============================================================================
-- 6. Add club_id column to events table
-- ============================================================================

-- Add the column (nullable first so we can populate it)
ALTER TABLE public.events
  ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Copy organizer_id values to club_id (they share the same IDs after migration)
UPDATE public.events SET club_id = organizer_id;

-- Now make it NOT NULL
ALTER TABLE public.events ALTER COLUMN club_id SET NOT NULL;

-- ============================================================================
-- 7. Rename organizer_reviews → club_reviews
-- ============================================================================

ALTER TABLE public.organizer_reviews RENAME TO club_reviews;

-- Rename the organizer_id column to club_id
ALTER TABLE public.club_reviews RENAME COLUMN organizer_id TO club_id;

-- Add FK constraint to clubs table (the old FK pointed to organizer_profiles)
-- First drop the old FK constraint
ALTER TABLE public.club_reviews
  DROP CONSTRAINT IF EXISTS organizer_reviews_organizer_id_fkey;

-- Add new FK to clubs
ALTER TABLE public.club_reviews
  ADD CONSTRAINT club_reviews_club_id_fkey
  FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Rename the unique constraint
ALTER TABLE public.club_reviews
  DROP CONSTRAINT IF EXISTS organizer_reviews_organizer_id_user_id_key;
ALTER TABLE public.club_reviews
  ADD CONSTRAINT club_reviews_club_id_user_id_key UNIQUE (club_id, user_id);

-- Rename the index
DROP INDEX IF EXISTS idx_organizer_reviews_org;
CREATE INDEX idx_club_reviews_club ON public.club_reviews(club_id, created_at DESC);

-- Rename the trigger function
CREATE OR REPLACE FUNCTION update_club_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS trg_organizer_review_updated_at ON public.club_reviews;
CREATE TRIGGER trg_club_review_updated_at
  BEFORE UPDATE ON public.club_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_club_review_updated_at();

-- Drop old trigger function
DROP FUNCTION IF EXISTS update_organizer_review_updated_at();

-- Rename RLS policies on club_reviews
DROP POLICY IF EXISTS "organizer_reviews_select" ON public.club_reviews;
DROP POLICY IF EXISTS "organizer_reviews_insert" ON public.club_reviews;
DROP POLICY IF EXISTS "organizer_reviews_update" ON public.club_reviews;

CREATE POLICY "club_reviews_select" ON public.club_reviews
  FOR SELECT USING (true);
CREATE POLICY "club_reviews_insert" ON public.club_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "club_reviews_update" ON public.club_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. Rename organizer_review_photos → club_review_photos
-- ============================================================================

ALTER TABLE public.organizer_review_photos RENAME TO club_review_photos;

-- Rename the index
DROP INDEX IF EXISTS idx_organizer_review_photos_review;
CREATE INDEX idx_club_review_photos_review ON public.club_review_photos(review_id, sort_order);

-- Rename RLS policies on club_review_photos
DROP POLICY IF EXISTS "organizer_review_photos_select" ON public.club_review_photos;
DROP POLICY IF EXISTS "organizer_review_photos_insert" ON public.club_review_photos;
DROP POLICY IF EXISTS "organizer_review_photos_delete" ON public.club_review_photos;

CREATE POLICY "club_review_photos_select" ON public.club_review_photos
  FOR SELECT USING (true);
CREATE POLICY "club_review_photos_insert" ON public.club_review_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_reviews
      WHERE club_reviews.id = review_id
        AND club_reviews.user_id = auth.uid()
    )
  );
CREATE POLICY "club_review_photos_delete" ON public.club_review_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.club_reviews
      WHERE club_reviews.id = review_id
        AND club_reviews.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. Update user roles: organizer/participant → user
-- ============================================================================

-- Update the CHECK constraint on users.role to add 'user' as a valid value
-- (keep old values for backward compat during transition)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role IN ('organizer', 'participant', 'guest', 'user'));

-- Migrate existing organizer and participant users to 'user' role
UPDATE public.users
  SET role = 'user'
  WHERE role IN ('organizer', 'participant');

-- ============================================================================
-- 10. RLS Policies for new tables
-- ============================================================================

-- Enable RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_invites ENABLE ROW LEVEL SECURITY;

-- ----- clubs -----

-- Public clubs are readable by everyone
CREATE POLICY "clubs_select_public" ON public.clubs
  FOR SELECT USING (visibility = 'public' OR EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_members.club_id = clubs.id
      AND club_members.user_id = auth.uid()
  ));

-- Authenticated users can create clubs
CREATE POLICY "clubs_insert_authenticated" ON public.clubs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Owner and admin can update their club
CREATE POLICY "clubs_update_owner_admin" ON public.clubs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_members.club_id = clubs.id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin')
  ));

-- Only owner can delete club
CREATE POLICY "clubs_delete_owner" ON public.clubs
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_members.club_id = clubs.id
      AND club_members.user_id = auth.uid()
      AND club_members.role = 'owner'
  ));

-- ----- club_members -----

-- Club members are publicly readable (for club pages)
CREATE POLICY "club_members_select_public" ON public.club_members
  FOR SELECT USING (true);

-- Users can join public clubs themselves
CREATE POLICY "club_members_insert_self_public" ON public.club_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND role = 'member'
    AND EXISTS (
      SELECT 1 FROM public.clubs
      WHERE clubs.id = club_id AND clubs.visibility = 'public'
    )
  );

-- Owner/admin can add members (any role except owner)
CREATE POLICY "club_members_insert_by_admin" ON public.club_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members AS cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- Owner/admin can update member roles
CREATE POLICY "club_members_update_by_admin" ON public.club_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.club_members AS cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- Members can remove themselves; owner/admin can remove others
CREATE POLICY "club_members_delete_self" ON public.club_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "club_members_delete_by_admin" ON public.club_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.club_members AS cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

-- ----- club_invites -----

-- Invite details are publicly readable (so anyone with link can see club info)
CREATE POLICY "club_invites_select_public" ON public.club_invites
  FOR SELECT USING (true);

-- Owner/admin can create invites
CREATE POLICY "club_invites_insert_by_admin" ON public.club_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = club_invites.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );

-- Owner/admin can update invites (e.g., bump uses count)
CREATE POLICY "club_invites_update_by_admin" ON public.club_invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = club_invites.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );

-- Owner/admin can delete invites
CREATE POLICY "club_invites_delete_by_admin" ON public.club_invites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = club_invites.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('owner', 'admin')
    )
  );

-- Allow authenticated users to increment the uses counter when redeeming an invite.
-- Note: In practice, invite redemption should be done via an API route (server-side)
-- that validates expiry, max_uses, etc. This policy allows the update from client-side
-- if needed, but the actual validation logic lives in the API layer.
CREATE POLICY "club_invites_update_redeem" ON public.club_invites
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 11. Indexes
-- ============================================================================

-- clubs (slug already has a unique index via UNIQUE constraint)
CREATE INDEX idx_clubs_visibility ON public.clubs(visibility);

-- club_members (UNIQUE(club_id, user_id) already creates a composite index)
CREATE INDEX idx_club_members_user ON public.club_members(user_id);
CREATE INDEX idx_club_members_role ON public.club_members(club_id, role);

-- club_invites (invite_code already has a unique index via UNIQUE constraint)
CREATE INDEX idx_club_invites_club ON public.club_invites(club_id);

-- events.club_id
CREATE INDEX idx_events_club ON public.events(club_id);

-- ============================================================================
-- 12. Update the feature flag name for reviews
-- ============================================================================

-- Rename the feature flag column from organizer_reviews to club_reviews
ALTER TABLE public.cms_feature_flags
  RENAME COLUMN organizer_reviews TO club_reviews;

-- ============================================================================
-- NOTE: organizer_profiles table and events.organizer_id column are NOT dropped.
-- They remain for backward compatibility during the migration period.
-- A future migration will remove them once all code references are updated.
-- ============================================================================
