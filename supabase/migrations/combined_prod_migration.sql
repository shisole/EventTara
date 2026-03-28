BEGIN;

-- ============================================================================
-- Migration 1: 009_cms_tables.sql
-- CMS singleton tables (site settings, navigation, hero carousel, feature flags, pages)
-- ============================================================================

-- Base CMS tables (originally created manually in prod)
-- These must exist before any feature-flag ALTER TABLE migrations

-- 1. cms_site_settings (singleton)
CREATE TABLE IF NOT EXISTS cms_site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  site_name TEXT NOT NULL DEFAULT 'EventTara',
  tagline TEXT,
  site_description TEXT,
  site_url TEXT,
  contact_email TEXT,
  copyright_text TEXT,
  nav_layout TEXT NOT NULL DEFAULT 'strip',
  parallax_image_url TEXT,
  seo_title_template TEXT,
  seo_keywords TEXT,
  seo_og_locale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cms_site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_site_settings_select" ON cms_site_settings;
CREATE POLICY "cms_site_settings_select" ON cms_site_settings FOR SELECT USING (true);

-- 2. cms_navigation (singleton)
CREATE TABLE IF NOT EXISTS cms_navigation (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  header_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  footer_tagline TEXT,
  footer_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  footer_legal_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cms_navigation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_navigation_select" ON cms_navigation;
CREATE POLICY "cms_navigation_select" ON cms_navigation FOR SELECT USING (true);

-- 3. cms_hero_carousel (singleton)
CREATE TABLE IF NOT EXISTS cms_hero_carousel (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cms_hero_carousel ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_hero_carousel_select" ON cms_hero_carousel;
CREATE POLICY "cms_hero_carousel_select" ON cms_hero_carousel FOR SELECT USING (true);

-- 4. cms_feature_flags (singleton)
CREATE TABLE IF NOT EXISTS cms_feature_flags (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  activity_feed BOOLEAN NOT NULL DEFAULT false,
  strava_showcase_features BOOLEAN NOT NULL DEFAULT false,
  strava_showcase_stats BOOLEAN NOT NULL DEFAULT false,
  strava_showcase_route_map BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row
INSERT INTO cms_feature_flags (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE cms_feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_feature_flags_select" ON cms_feature_flags;
CREATE POLICY "cms_feature_flags_select" ON cms_feature_flags FOR SELECT USING (true);

-- 5. cms_pages (multi-row)
CREATE TABLE IF NOT EXISTS cms_pages (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  content_html TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  last_updated_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cms_pages_select" ON cms_pages;
CREATE POLICY "cms_pages_select" ON cms_pages FOR SELECT USING (true);

-- ============================================================================
-- Migration 2: 010_missing_tables.sql
-- Mountains, event-mountains, guides, event-guides, guide reviews, event routes,
-- Strava connections, Strava activities, Strava webhook subscriptions
-- ============================================================================

-- Tables that were created manually in production but never had migrations:
-- mountains, event_mountains, guides, event_guides, guide_reviews,
-- event_routes, strava_connections, strava_activities, strava_webhook_subscriptions

-- ============================================================================
-- 1. Mountains
-- ============================================================================

CREATE TABLE IF NOT EXISTS mountains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL,
  elevation_masl INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE mountains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mountains_select_public" ON mountains;
CREATE POLICY "mountains_select_public" ON mountains FOR SELECT USING (true);

-- ============================================================================
-- 2. Event-Mountains junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_mountains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  mountain_id UUID NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
  route_name TEXT,
  difficulty_override INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, mountain_id)
);

ALTER TABLE event_mountains ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_mountains_select_public" ON event_mountains;
CREATE POLICY "event_mountains_select_public" ON event_mountains FOR SELECT USING (true);
DROP POLICY IF EXISTS "event_mountains_insert_organizer" ON event_mountains;
CREATE POLICY "event_mountains_insert_organizer" ON event_mountains FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_mountains.event_id
      AND events.organizer_id = auth.uid()
  ));
DROP POLICY IF EXISTS "event_mountains_delete_organizer" ON event_mountains;
CREATE POLICY "event_mountains_delete_organizer" ON event_mountains FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_mountains.event_id
      AND events.organizer_id = auth.uid()
  ));

-- ============================================================================
-- 3. Guides
-- ============================================================================

CREATE TABLE IF NOT EXISTS guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  contact_number TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guides_select_public" ON guides;
CREATE POLICY "guides_select_public" ON guides FOR SELECT USING (true);
DROP POLICY IF EXISTS "guides_insert_authenticated" ON guides;
CREATE POLICY "guides_insert_authenticated" ON guides FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "guides_update_creator" ON guides;
CREATE POLICY "guides_update_creator" ON guides FOR UPDATE
  USING (created_by = auth.uid());
DROP POLICY IF EXISTS "guides_delete_creator" ON guides;
CREATE POLICY "guides_delete_creator" ON guides FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- 4. Event-Guides junction table
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, guide_id)
);

ALTER TABLE event_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_guides_select_public" ON event_guides;
CREATE POLICY "event_guides_select_public" ON event_guides FOR SELECT USING (true);
DROP POLICY IF EXISTS "event_guides_insert_organizer" ON event_guides;
CREATE POLICY "event_guides_insert_organizer" ON event_guides FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_guides.event_id
      AND events.organizer_id = auth.uid()
  ));
DROP POLICY IF EXISTS "event_guides_delete_organizer" ON event_guides;
CREATE POLICY "event_guides_delete_organizer" ON event_guides FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_guides.event_id
      AND events.organizer_id = auth.uid()
  ));

-- ============================================================================
-- 5. Guide Reviews
-- ============================================================================

CREATE TABLE IF NOT EXISTS guide_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guide_id, user_id, event_id)
);

ALTER TABLE guide_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guide_reviews_select_public" ON guide_reviews;
CREATE POLICY "guide_reviews_select_public" ON guide_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "guide_reviews_insert_authenticated" ON guide_reviews;
CREATE POLICY "guide_reviews_insert_authenticated" ON guide_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "guide_reviews_update_own" ON guide_reviews;
CREATE POLICY "guide_reviews_update_own" ON guide_reviews FOR UPDATE
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "guide_reviews_delete_own" ON guide_reviews;
CREATE POLICY "guide_reviews_delete_own" ON guide_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Event Routes (one-to-one with events)
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  strava_route_id INTEGER,
  gpx_url TEXT,
  source TEXT NOT NULL CHECK (source IN ('strava', 'gpx')),
  name TEXT NOT NULL,
  distance INTEGER,
  elevation_gain INTEGER,
  summary_polyline TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE event_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "event_routes_select_public" ON event_routes;
CREATE POLICY "event_routes_select_public" ON event_routes FOR SELECT USING (true);
DROP POLICY IF EXISTS "event_routes_insert_organizer" ON event_routes;
CREATE POLICY "event_routes_insert_organizer" ON event_routes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_routes.event_id
      AND events.organizer_id = auth.uid()
  ));
DROP POLICY IF EXISTS "event_routes_update_organizer" ON event_routes;
CREATE POLICY "event_routes_update_organizer" ON event_routes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_routes.event_id
      AND events.organizer_id = auth.uid()
  ));
DROP POLICY IF EXISTS "event_routes_delete_organizer" ON event_routes;
CREATE POLICY "event_routes_delete_organizer" ON event_routes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM events WHERE events.id = event_routes.event_id
      AND events.organizer_id = auth.uid()
  ));

-- ============================================================================
-- 7. Strava Connections
-- ============================================================================

CREATE TABLE IF NOT EXISTS strava_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  strava_athlete_id INTEGER NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  athlete_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE strava_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "strava_connections_select_own" ON strava_connections;
CREATE POLICY "strava_connections_select_own" ON strava_connections FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "strava_connections_insert_own" ON strava_connections;
CREATE POLICY "strava_connections_insert_own" ON strava_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "strava_connections_update_own" ON strava_connections;
CREATE POLICY "strava_connections_update_own" ON strava_connections FOR UPDATE
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "strava_connections_delete_own" ON strava_connections;
CREATE POLICY "strava_connections_delete_own" ON strava_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. Strava Activities
-- ============================================================================

CREATE TABLE IF NOT EXISTS strava_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strava_activity_id INTEGER NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  distance REAL NOT NULL DEFAULT 0,
  moving_time INTEGER NOT NULL DEFAULT 0,
  elapsed_time INTEGER NOT NULL DEFAULT 0,
  total_elevation_gain REAL NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  summary_polyline TEXT,
  matched_automatically BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, strava_activity_id)
);

ALTER TABLE strava_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "strava_activities_select_own" ON strava_activities;
CREATE POLICY "strava_activities_select_own" ON strava_activities FOR SELECT
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "strava_activities_insert_own" ON strava_activities;
CREATE POLICY "strava_activities_insert_own" ON strava_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "strava_activities_update_own" ON strava_activities;
CREATE POLICY "strava_activities_update_own" ON strava_activities FOR UPDATE
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "strava_activities_delete_own" ON strava_activities;
CREATE POLICY "strava_activities_delete_own" ON strava_activities FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. Strava Webhook Subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS strava_webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id INTEGER NOT NULL UNIQUE,
  verify_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE strava_webhook_subscriptions ENABLE ROW LEVEL SECURITY;
-- No public access — only accessed via service role in webhook handler

-- ============================================================================
-- Migration 3: 011_quiz_responses.sql
-- Quiz responses table for onboarding demographics
-- ============================================================================

-- Quiz responses for onboarding demographics
CREATE TABLE IF NOT EXISTS quiz_responses (
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

DO $$ BEGIN
  ALTER TABLE quiz_responses ADD CONSTRAINT quiz_responses_anonymous_id_unique UNIQUE (anonymous_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_quiz_responses_anonymous_id ON quiz_responses(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_id ON quiz_responses(user_id);

-- RLS: anyone can insert (anonymous visitors), only owner can read their own
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert quiz responses" ON quiz_responses;
CREATE POLICY "Anyone can insert quiz responses"
  ON quiz_responses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own quiz responses" ON quiz_responses;
CREATE POLICY "Users can read own quiz responses"
  ON quiz_responses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update quiz responses by anonymous_id" ON quiz_responses;
CREATE POLICY "Update quiz responses by anonymous_id"
  ON quiz_responses FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Migration 4: 012_clubs.sql
-- Clubs system: clubs, club_members, club_invites, data migration from
-- organizer_profiles, rename organizer_reviews to club_reviews, user role changes
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS public.clubs (
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

CREATE TABLE IF NOT EXISTS public.club_members (
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

CREATE TABLE IF NOT EXISTS public.club_invites (
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
-- Only run if organizer_profiles exists and clubs is empty (not yet migrated)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizer_profiles')
     AND NOT EXISTS (SELECT 1 FROM public.clubs LIMIT 1) THEN
    INSERT INTO public.clubs (id, name, slug, description, logo_url, payment_info, is_demo, created_at)
    SELECT
      op.id,
      op.org_name,
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
  END IF;
END $$;

-- ============================================================================
-- 5. Create club_members owner entries for existing organizer users
-- ============================================================================

-- For each organizer_profile that has a user_id, create an owner membership
-- Only run if organizer_profiles exists and club_members is empty (not yet migrated)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizer_profiles')
     AND NOT EXISTS (SELECT 1 FROM public.club_members LIMIT 1) THEN
    INSERT INTO public.club_members (club_id, user_id, role, joined_at)
    SELECT
      op.id,
      op.user_id,
      'owner',
      op.created_at
    FROM public.organizer_profiles op
    WHERE op.user_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 6. Add club_id column to events table
-- ============================================================================

-- Add the column (nullable first so we can populate it)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Copy organizer_id values to club_id (they share the same IDs after migration)
-- Only run if organizer_id column still exists and club_id is not yet populated
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'organizer_id')
     AND EXISTS (SELECT 1 FROM public.events WHERE club_id IS NULL LIMIT 1) THEN
    UPDATE public.events SET club_id = organizer_id;
  END IF;
END $$;

-- Now make it NOT NULL (only if not already NOT NULL)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'club_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.events ALTER COLUMN club_id SET NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 7. Rename organizer_reviews → club_reviews
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizer_reviews') THEN
    ALTER TABLE public.organizer_reviews RENAME TO club_reviews;
  END IF;
END $$;

-- Rename the organizer_id column to club_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'club_reviews' AND column_name = 'organizer_id') THEN
    ALTER TABLE public.club_reviews RENAME COLUMN organizer_id TO club_id;
  END IF;
END $$;

-- Add FK constraint to clubs table (the old FK pointed to organizer_profiles)
-- First drop the old FK constraint
ALTER TABLE public.club_reviews
  DROP CONSTRAINT IF EXISTS organizer_reviews_organizer_id_fkey;

-- Add new FK to clubs
DO $$ BEGIN
  ALTER TABLE public.club_reviews
    ADD CONSTRAINT club_reviews_club_id_fkey
    FOREIGN KEY (club_id) REFERENCES public.clubs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- Rename the unique constraint
ALTER TABLE public.club_reviews
  DROP CONSTRAINT IF EXISTS organizer_reviews_organizer_id_user_id_key;
DO $$ BEGIN
  ALTER TABLE public.club_reviews
    ADD CONSTRAINT club_reviews_club_id_user_id_key UNIQUE (club_id, user_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

-- Rename the index
DROP INDEX IF EXISTS idx_organizer_reviews_org;
CREATE INDEX IF NOT EXISTS idx_club_reviews_club ON public.club_reviews(club_id, created_at DESC);

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
DROP TRIGGER IF EXISTS trg_club_review_updated_at ON public.club_reviews;
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

DROP POLICY IF EXISTS "club_reviews_select" ON public.club_reviews;
CREATE POLICY "club_reviews_select" ON public.club_reviews
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "club_reviews_insert" ON public.club_reviews;
CREATE POLICY "club_reviews_insert" ON public.club_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "club_reviews_update" ON public.club_reviews;
CREATE POLICY "club_reviews_update" ON public.club_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. Rename organizer_review_photos → club_review_photos
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizer_review_photos') THEN
    ALTER TABLE public.organizer_review_photos RENAME TO club_review_photos;
  END IF;
END $$;

-- Rename the index
DROP INDEX IF EXISTS idx_organizer_review_photos_review;
CREATE INDEX IF NOT EXISTS idx_club_review_photos_review ON public.club_review_photos(review_id, sort_order);

-- Rename RLS policies on club_review_photos
DROP POLICY IF EXISTS "organizer_review_photos_select" ON public.club_review_photos;
DROP POLICY IF EXISTS "organizer_review_photos_insert" ON public.club_review_photos;
DROP POLICY IF EXISTS "organizer_review_photos_delete" ON public.club_review_photos;

DROP POLICY IF EXISTS "club_review_photos_select" ON public.club_review_photos;
CREATE POLICY "club_review_photos_select" ON public.club_review_photos
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "club_review_photos_insert" ON public.club_review_photos;
CREATE POLICY "club_review_photos_insert" ON public.club_review_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_reviews
      WHERE club_reviews.id = review_id
        AND club_reviews.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "club_review_photos_delete" ON public.club_review_photos;
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
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_role_check
    CHECK (role IN ('organizer', 'participant', 'guest', 'user'));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

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
DROP POLICY IF EXISTS "clubs_select_public" ON public.clubs;
CREATE POLICY "clubs_select_public" ON public.clubs
  FOR SELECT USING (visibility = 'public' OR EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_members.club_id = clubs.id
      AND club_members.user_id = auth.uid()
  ));

-- Authenticated users can create clubs
DROP POLICY IF EXISTS "clubs_insert_authenticated" ON public.clubs;
CREATE POLICY "clubs_insert_authenticated" ON public.clubs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Owner and admin can update their club
DROP POLICY IF EXISTS "clubs_update_owner_admin" ON public.clubs;
CREATE POLICY "clubs_update_owner_admin" ON public.clubs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_members.club_id = clubs.id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin')
  ));

-- Only owner can delete club
DROP POLICY IF EXISTS "clubs_delete_owner" ON public.clubs;
CREATE POLICY "clubs_delete_owner" ON public.clubs
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_members.club_id = clubs.id
      AND club_members.user_id = auth.uid()
      AND club_members.role = 'owner'
  ));

-- ----- club_members -----

-- Club members are publicly readable (for club pages)
DROP POLICY IF EXISTS "club_members_select_public" ON public.club_members;
CREATE POLICY "club_members_select_public" ON public.club_members
  FOR SELECT USING (true);

-- Users can join public clubs themselves
DROP POLICY IF EXISTS "club_members_insert_self_public" ON public.club_members;
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
DROP POLICY IF EXISTS "club_members_insert_by_admin" ON public.club_members;
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
DROP POLICY IF EXISTS "club_members_update_by_admin" ON public.club_members;
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
DROP POLICY IF EXISTS "club_members_delete_self" ON public.club_members;
CREATE POLICY "club_members_delete_self" ON public.club_members
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "club_members_delete_by_admin" ON public.club_members;
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
DROP POLICY IF EXISTS "club_invites_select_public" ON public.club_invites;
CREATE POLICY "club_invites_select_public" ON public.club_invites
  FOR SELECT USING (true);

-- Owner/admin can create invites
DROP POLICY IF EXISTS "club_invites_insert_by_admin" ON public.club_invites;
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
DROP POLICY IF EXISTS "club_invites_update_by_admin" ON public.club_invites;
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
DROP POLICY IF EXISTS "club_invites_delete_by_admin" ON public.club_invites;
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
DROP POLICY IF EXISTS "club_invites_update_redeem" ON public.club_invites;
CREATE POLICY "club_invites_update_redeem" ON public.club_invites
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- 11. Indexes
-- ============================================================================

-- clubs (slug already has a unique index via UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_clubs_visibility ON public.clubs(visibility);

-- club_members (UNIQUE(club_id, user_id) already creates a composite index)
CREATE INDEX IF NOT EXISTS idx_club_members_user ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_role ON public.club_members(club_id, role);

-- club_invites (invite_code already has a unique index via UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_club_invites_club ON public.club_invites(club_id);

-- events.club_id
CREATE INDEX IF NOT EXISTS idx_events_club ON public.events(club_id);

-- ============================================================================
-- 12. Update the feature flag name for reviews
-- ============================================================================

-- Rename the feature flag column from organizer_reviews to club_reviews
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cms_feature_flags' AND column_name = 'organizer_reviews') THEN
    ALTER TABLE public.cms_feature_flags
      RENAME COLUMN organizer_reviews TO club_reviews;
  END IF;
END $$;

-- ============================================================================
-- NOTE: organizer_profiles table and events.organizer_id column are NOT dropped.
-- They remain for backward compatibility during the migration period.
-- A future migration will remove them once all code references are updated.
-- ============================================================================

-- ============================================================================
-- Migration 5: 013_remove_organizer_id.sql
-- Remove events.organizer_id column and migrate all RLS policies to use
-- club_id + club_members instead
-- ============================================================================

-- ============================================================================
-- Migration: Remove events.organizer_id and migrate RLS to club_id + club_members
-- ============================================================================

-- ============================================================================
-- 1. Drop all RLS policies that reference events.organizer_id
-- ============================================================================

-- events table
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Organizers can manage own events" ON public.events;

-- event_photos table
DROP POLICY IF EXISTS "Organizers can manage event photos" ON public.event_photos;

-- bookings table
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can update event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can add participants to their events" ON public.bookings;

-- badges table
DROP POLICY IF EXISTS "Organizers can manage badges" ON public.badges;

-- user_badges table
DROP POLICY IF EXISTS "Organizers can award badges" ON public.user_badges;

-- event_checkins table
DROP POLICY IF EXISTS "Organizers can view event checkins" ON public.event_checkins;
DROP POLICY IF EXISTS "Organizers can check in participants" ON public.event_checkins;

-- booking_companions table
DROP POLICY IF EXISTS "Organizers can view companions" ON public.booking_companions;
DROP POLICY IF EXISTS "Organizers can update companions (check-in)" ON public.booking_companions;

-- event_distances table
DROP POLICY IF EXISTS "event_distances_insert_organizer" ON public.event_distances;
DROP POLICY IF EXISTS "event_distances_update_organizer" ON public.event_distances;
DROP POLICY IF EXISTS "event_distances_delete_organizer" ON public.event_distances;

-- event_mountains table
DROP POLICY IF EXISTS "event_mountains_insert_organizer" ON public.event_mountains;
DROP POLICY IF EXISTS "event_mountains_delete_organizer" ON public.event_mountains;

-- event_guides table
DROP POLICY IF EXISTS "event_guides_insert_organizer" ON public.event_guides;
DROP POLICY IF EXISTS "event_guides_delete_organizer" ON public.event_guides;

-- event_routes table
DROP POLICY IF EXISTS "event_routes_insert_organizer" ON public.event_routes;
DROP POLICY IF EXISTS "event_routes_update_organizer" ON public.event_routes;
DROP POLICY IF EXISTS "event_routes_delete_organizer" ON public.event_routes;

-- ============================================================================
-- 2. Drop organizer_id column from events
-- ============================================================================

-- CASCADE drops any remaining policies that reference organizer_id
-- (prod may have differently-named policies than the migration expects)
ALTER TABLE public.events DROP COLUMN IF EXISTS organizer_id CASCADE;

-- ============================================================================
-- 3. Recreate RLS policies using club_id + club_members
-- ============================================================================

-- Role hierarchy:
--   owner (4) > admin (3) > moderator (2) > member (1)
-- CLUB_PERMISSIONS mapping:
--   create/delete events, manage/award badges → admin+  → ('owner','admin')
--   edit events, manage bookings/checkins/companions/distances → moderator+ → ('owner','admin','moderator')
--   view own club events → member+ → ('owner','admin','moderator','member')

-- ---------- events ----------

DROP POLICY IF EXISTS "Published events are viewable by everyone" ON public.events;
CREATE POLICY "Published events are viewable by everyone" ON public.events
  FOR SELECT USING (
    status IN ('published', 'completed')
    OR club_id IN (
      SELECT club_id FROM public.club_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Club staff can manage own events" ON public.events;
CREATE POLICY "Club staff can manage own events" ON public.events
  FOR ALL USING (
    club_id IN (
      SELECT club_id FROM public.club_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ---------- event_photos ----------

DROP POLICY IF EXISTS "Club staff can manage event photos" ON public.event_photos;
CREATE POLICY "Club staff can manage event photos" ON public.event_photos
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- bookings ----------

DROP POLICY IF EXISTS "Club staff can view event bookings" ON public.bookings;
CREATE POLICY "Club staff can view event bookings" ON public.bookings
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

DROP POLICY IF EXISTS "Club staff can update event bookings" ON public.bookings;
CREATE POLICY "Club staff can update event bookings" ON public.bookings
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

DROP POLICY IF EXISTS "Club staff can add participants to their events" ON public.bookings;
CREATE POLICY "Club staff can add participants to their events" ON public.bookings
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
    AND added_by = auth.uid()
  );

-- ---------- badges ----------

DROP POLICY IF EXISTS "Club staff can manage badges" ON public.badges;
CREATE POLICY "Club staff can manage badges" ON public.badges
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- ---------- user_badges ----------

DROP POLICY IF EXISTS "Club staff can award badges" ON public.user_badges;
CREATE POLICY "Club staff can award badges" ON public.user_badges
  FOR INSERT WITH CHECK (
    badge_id IN (
      SELECT b.id FROM public.badges b
      JOIN public.events e ON b.event_id = e.id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

-- ---------- event_checkins ----------

DROP POLICY IF EXISTS "Club staff can view event checkins" ON public.event_checkins;
CREATE POLICY "Club staff can view event checkins" ON public.event_checkins
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

DROP POLICY IF EXISTS "Club staff can check in participants" ON public.event_checkins;
CREATE POLICY "Club staff can check in participants" ON public.event_checkins
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- booking_companions ----------

DROP POLICY IF EXISTS "Club staff can view companions" ON public.booking_companions;
CREATE POLICY "Club staff can view companions" ON public.booking_companions
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.events e ON e.id = b.event_id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

DROP POLICY IF EXISTS "Club staff can update companions (check-in)" ON public.booking_companions;
CREATE POLICY "Club staff can update companions (check-in)" ON public.booking_companions
  FOR UPDATE USING (
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.events e ON e.id = b.event_id
      WHERE e.club_id IN (
        SELECT club_id FROM public.club_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
      )
    )
  );

-- ---------- event_distances ----------

DROP POLICY IF EXISTS "event_distances_insert_club_staff" ON public.event_distances;
CREATE POLICY "event_distances_insert_club_staff" ON public.event_distances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

DROP POLICY IF EXISTS "event_distances_update_club_staff" ON public.event_distances;
CREATE POLICY "event_distances_update_club_staff" ON public.event_distances
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

DROP POLICY IF EXISTS "event_distances_delete_club_staff" ON public.event_distances;
CREATE POLICY "event_distances_delete_club_staff" ON public.event_distances
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_distances.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_mountains ----------

DROP POLICY IF EXISTS "event_mountains_insert_club_staff" ON public.event_mountains;
CREATE POLICY "event_mountains_insert_club_staff" ON public.event_mountains
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_mountains.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

DROP POLICY IF EXISTS "event_mountains_delete_club_staff" ON public.event_mountains;
CREATE POLICY "event_mountains_delete_club_staff" ON public.event_mountains
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_mountains.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_guides ----------

DROP POLICY IF EXISTS "event_guides_insert_club_staff" ON public.event_guides;
CREATE POLICY "event_guides_insert_club_staff" ON public.event_guides
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_guides.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

DROP POLICY IF EXISTS "event_guides_delete_club_staff" ON public.event_guides;
CREATE POLICY "event_guides_delete_club_staff" ON public.event_guides
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_guides.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ---------- event_routes ----------

DROP POLICY IF EXISTS "event_routes_insert_club_staff" ON public.event_routes;
CREATE POLICY "event_routes_insert_club_staff" ON public.event_routes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

DROP POLICY IF EXISTS "event_routes_update_club_staff" ON public.event_routes;
CREATE POLICY "event_routes_update_club_staff" ON public.event_routes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

DROP POLICY IF EXISTS "event_routes_delete_club_staff" ON public.event_routes;
CREATE POLICY "event_routes_delete_club_staff" ON public.event_routes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_routes.event_id
        AND events.club_id IN (
          SELECT club_id FROM public.club_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'moderator')
        )
    )
  );

-- ============================================================================
-- Migration 6: 20260308_badge_shares.sql
-- Badge shares table for tracking social sharing of badges
-- ============================================================================

-- Create badge_shares table for tracking social shares
CREATE TABLE IF NOT EXISTS badge_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'link_copy')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Users can only insert their own shares, but anyone can read for analytics
ALTER TABLE badge_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own badge shares" ON badge_shares;
CREATE POLICY "Users can insert their own badge shares"
  ON badge_shares
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read access to badge shares for analytics" ON badge_shares;
CREATE POLICY "Public read access to badge shares for analytics"
  ON badge_shares
  FOR SELECT
  USING (true);

-- ============================================================================
-- Migration 7: 20260308_user_badge_showcase.sql
-- User badge showcase table for featured badges on profile pages
-- ============================================================================

-- Create user_badge_showcase table for featured badges on profile
CREATE TABLE IF NOT EXISTS user_badge_showcase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- RLS: Users can only view/modify their own showcase
ALTER TABLE user_badge_showcase ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own badge showcase" ON user_badge_showcase;
CREATE POLICY "Users can view their own badge showcase"
  ON user_badge_showcase
  FOR SELECT
  USING (auth.uid() = user_id OR true);

DROP POLICY IF EXISTS "Users can update their own badge showcase" ON user_badge_showcase;
CREATE POLICY "Users can update their own badge showcase"
  ON user_badge_showcase
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own badge showcase" ON user_badge_showcase;
CREATE POLICY "Users can insert their own badge showcase"
  ON user_badge_showcase
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own badge showcase" ON user_badge_showcase;
CREATE POLICY "Users can delete their own badge showcase"
  ON user_badge_showcase
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Migration 8: 20260309_add_difficulty_level.sql
-- Add difficulty_level column to events table
-- ============================================================================

-- Add difficulty_level column to events (used for hiking, trail run, MTB)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS difficulty_level INTEGER;

-- ============================================================================
-- Migration 9: 20260309_fix_clubs_rls.sql
-- Fix clubs and club_members RLS policies (auth.role() -> auth.uid(),
-- add creator-as-owner bootstrap policy)
-- ============================================================================

-- ============================================================================
-- Fix clubs + club_members RLS policies
-- ============================================================================

-- 1. Fix clubs INSERT policy: use auth.uid() instead of auth.role()
DROP POLICY IF EXISTS "clubs_insert_authenticated" ON public.clubs;
CREATE POLICY "clubs_insert_authenticated" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Fix club_members: allow creator to set themselves as owner on a new club
--    The existing policies only allow role='member' self-insert or require
--    an existing owner/admin, creating a chicken-and-egg problem.
DROP POLICY IF EXISTS "club_members_insert_creator_as_owner" ON public.club_members;
CREATE POLICY "club_members_insert_creator_as_owner" ON public.club_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND role = 'owner'
    AND NOT EXISTS (
      SELECT 1 FROM public.club_members AS cm
      WHERE cm.club_id = club_members.club_id
    )
  );

COMMIT;
