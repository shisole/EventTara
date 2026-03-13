import { type Json } from "@/lib/supabase/types";

/** cms_site_settings — singleton (id = 1) */
export interface CmsSiteSettings {
  id: number;
  site_name: string;
  tagline: string;
  site_description: string;
  site_url: string | null;
  contact_email: string | null;
  copyright_text: string | null;
  nav_layout: "strip" | "grid" | "list";
  parallax_image_url: string | null;
  seo_title_template: string | null;
  seo_keywords: string | null;
  seo_og_locale: string | null;
}

/** Header link inside cms_navigation.header_links JSONB */
export interface CmsHeaderLink {
  label: string;
  url: string;
  requiresAuth?: boolean;
  roles?: string[];
}

/** Footer section inside cms_navigation.footer_sections JSONB */
export interface CmsFooterSection {
  title: string;
  links: { label: string; url: string }[];
}

/** Footer legal link inside cms_navigation.footer_legal_links JSONB */
export interface CmsFooterLegalLink {
  label: string;
  url: string;
}

/** cms_navigation — singleton (id = 1) */
export interface CmsNavigation {
  id: number;
  header_links: Json;
  footer_tagline: string | null;
  footer_sections: Json;
  footer_legal_links: Json;
}

/** A single hero slide inside cms_hero_carousel.slides JSONB */
export interface CmsHeroSlide {
  url: string;
  mobileUrl?: string;
  alt: string;
}

/** cms_hero_carousel — singleton (id = 1) */
export interface CmsHeroCarousel {
  id: number;
  slides: Json;
}

/** cms_feature_flags — singleton (id = 1) */
export interface CmsFeatureFlags {
  id: number;
  activity_feed: boolean;
  strava_showcase_features: boolean;
  strava_showcase_stats: boolean;
  strava_showcase_route_map: boolean;
  club_reviews: boolean;
  events_two_col_mobile: boolean;
  coming_soon_strava: boolean;
  coming_soon_gamification: boolean;
  coming_soon_bento: boolean;
  ewallet_payments: boolean;
  oauth_google: boolean;
  oauth_strava: boolean;
  oauth_facebook: boolean;
  onboarding_quiz: boolean;
  duck_race: boolean;
}

/** A single homepage section entry inside cms_homepage_sections.sections JSONB */
export interface CmsHomepageSection {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
}

/** cms_homepage_sections — singleton (id = 1) */
export interface CmsHomepageSections {
  id: number;
  sections: Json;
}

/** cms_pages — multi-row */
export interface CmsPage {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content_html: string | null;
  status: "draft" | "published";
  last_updated_label: string | null;
  created_at: string;
}
