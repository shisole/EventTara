-- Migration: CMS Admin Panel - Homepage Sections & RLS Updates
-- Date: 2026-03-05
-- Description: Add cms_homepage_sections table and UPDATE RLS policies for admin panel

-- ============================================================================
-- 1. Create cms_homepage_sections table (singleton, id=1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cms_homepage_sections (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default row with all 11 sections enabled in order
INSERT INTO cms_homepage_sections (id, sections)
VALUES (
  1,
  '[
    {"key": "hero", "label": "Hero Carousel", "enabled": true, "order": 0},
    {"key": "upcoming_events", "label": "Upcoming Events", "enabled": true, "order": 1},
    {"key": "strava_showcase", "label": "Strava Showcase", "enabled": true, "order": 2},
    {"key": "how_it_works", "label": "How It Works", "enabled": true, "order": 3},
    {"key": "feed_showcase", "label": "Activity Feed Showcase", "enabled": true, "order": 4},
    {"key": "gamification", "label": "Badges & Gamification", "enabled": true, "order": 5},
    {"key": "categories", "label": "Event Categories", "enabled": true, "order": 6},
    {"key": "organizers", "label": "Trusted Organizers", "enabled": true, "order": 7},
    {"key": "testimonials", "label": "Testimonials", "enabled": true, "order": 8},
    {"key": "faq", "label": "FAQ", "enabled": true, "order": 9},
    {"key": "contact_cta", "label": "Contact CTA", "enabled": true, "order": 10}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. RLS Policies for cms_homepage_sections
-- ============================================================================

ALTER TABLE cms_homepage_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "cms_homepage_sections_select"
  ON cms_homepage_sections
  FOR SELECT
  USING (true);

-- Only authenticated users can update (admin check is in API route)
CREATE POLICY "cms_homepage_sections_update"
  ON cms_homepage_sections
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 3. Add UPDATE policies to existing CMS tables
-- ============================================================================

-- Allow authenticated users to update feature flags
CREATE POLICY "cms_feature_flags_update"
  ON cms_feature_flags
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to update hero carousel
CREATE POLICY "cms_hero_carousel_update"
  ON cms_hero_carousel
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- Notes:
-- ============================================================================
-- - RLS policies allow any authenticated user to update, but actual authorization
--   happens in the API routes via isAdminUser() which checks ADMIN_USER_IDS env var
-- - This is a defense-in-depth approach
-- - After running this migration, add your user ID to ADMIN_USER_IDS in .env.local
