-- Update cms_homepage_sections with new landing page defaults
-- Adds coco_demo and full_bleed_cta sections, reorders to match new layout
UPDATE cms_homepage_sections
SET sections = '[
  {"key": "hero", "label": "Hero", "enabled": true, "order": 0},
  {"key": "coco_demo", "label": "Coco Demo", "enabled": true, "order": 1},
  {"key": "full_bleed_cta", "label": "Full Bleed CTA", "enabled": true, "order": 2},
  {"key": "clubs", "label": "Community Clubs", "enabled": true, "order": 3},
  {"key": "upcoming_events", "label": "Upcoming Events", "enabled": true, "order": 4},
  {"key": "features", "label": "Features", "enabled": true, "order": 5},
  {"key": "testimonials", "label": "Testimonials", "enabled": true, "order": 6},
  {"key": "pioneer_counter", "label": "Pioneer Counter", "enabled": true, "order": 7},
  {"key": "faq", "label": "FAQ", "enabled": true, "order": 8},
  {"key": "waitlist", "label": "Early Access Waitlist", "enabled": true, "order": 9},
  {"key": "contact_cta", "label": "Contact CTA", "enabled": true, "order": 10},
  {"key": "app_preview", "label": "App Preview", "enabled": false, "order": 20},
  {"key": "categories", "label": "Event Categories", "enabled": false, "order": 21},
  {"key": "how_it_works", "label": "How It Works", "enabled": false, "order": 22},
  {"key": "strava_showcase", "label": "Strava Showcase", "enabled": false, "order": 23},
  {"key": "feed_showcase", "label": "Activity Feed Showcase", "enabled": false, "order": 24},
  {"key": "gamification", "label": "Badges & Gamification", "enabled": false, "order": 25},
  {"key": "leaderboard_preview", "label": "Leaderboard Preview", "enabled": false, "order": 26}
]'::jsonb
WHERE id = 1;
