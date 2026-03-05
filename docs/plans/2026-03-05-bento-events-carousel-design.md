# Bento Events Carousel — Design

## Summary

Replace the existing `UpcomingEventsSection` on the homepage with a tabbed bento carousel. Each tab (Featured, Upcoming, Hiking, etc.) shows a paginated bento grid of events that users can swipe or arrow-navigate through.

## Layout

- **Header**: Section title + filter tabs + left/right arrows
- **Tabs**: Featured | Upcoming | Hiking | Mountain Biking | Road Biking | Running | Trail Running
- **Bento grid per page**: 1 large card (left, spans 2 rows) + 4 smaller cards (right, 2x2)
- **Carousel**: Swipeable + arrow buttons, pages of 5 events per slide
- **Mobile**: Single-column stack, swipe between individual cards

## Data

- Tabs fetch from existing `/api/events` with `type` or `when=upcoming` params
- "Featured" tab uses new `is_featured` boolean on `events` table
- Lazy-load: only active tab fetches on mount; other tabs fetch on first click

## Database Change

- Add `is_featured boolean DEFAULT false` to `events` table
- Manually toggle via Supabase dashboard for now

## Future: Pro Organizer Featured

- `is_featured` auto-set based on `organizer_profiles.subscription_tier`
- Optional `featured_until` timestamp for time-limited promotions

## Key Files

- `src/components/home/BentoEventsSection.tsx` — main section (replaces UpcomingEventsSection)
- `src/components/home/BentoEventCard.tsx` — large + small card variants
- `src/components/home/BentoCarousel.tsx` — swipe/arrow carousel logic
- Homepage `page.tsx` — swap UpcomingEventsSection for BentoEventsSection
