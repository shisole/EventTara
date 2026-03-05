# EventCard Redesign — Design

## Summary

Redesign the EventCard on `/events` page. Bigger image (~65% of card), price overlay on image, title + organizer row, then a 2-column info grid for all metadata.

## Layout

**Image (~65%)**

- Height: `h-52 sm:h-56`
- Status badge top-left (Upcoming / Happening Now)
- Price badge top-right (glassmorphic `bg-white/20 backdrop-blur`)

**Title row**

- Title: `font-heading font-bold text-base line-clamp-1`
- Organizer: subtle gray text, smaller, below title

**Info grid (2 columns, gap-x-4 gap-y-1)**

- Row 1: Date | Location
- Row 2: Type + Difficulty badges | Rating (reviews)
- Row 3: Spots left | Route / Distance badges

## Key Changes

- Image height increased from `h-40 sm:h-48` to `h-52 sm:h-56`
- Price moves to glassmorphic badge on image (top-right), removing separate mobile/desktop split
- Badges row absorbed into grid cells
- Consistent layout mobile and desktop (no more overlay vs bottom section difference)

## File

- Modify: `src/components/events/EventCard.tsx`
