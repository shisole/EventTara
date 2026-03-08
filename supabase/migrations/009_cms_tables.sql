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
CREATE POLICY "cms_navigation_select" ON cms_navigation FOR SELECT USING (true);

-- 3. cms_hero_carousel (singleton)
CREATE TABLE IF NOT EXISTS cms_hero_carousel (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  slides JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cms_hero_carousel ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "cms_pages_select" ON cms_pages FOR SELECT USING (true);
