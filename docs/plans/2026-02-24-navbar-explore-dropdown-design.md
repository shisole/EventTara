# Navbar Explore Dropdown Redesign

## Summary

Replace the plain-text Explore Events dropdown with image-backed activity cards. Three layout variants behind a `?nav=` query param for comparison. Mobile gets a side drawer with swipe gesture and scale-down page effect.

## Activity Data

Extend existing `activities` array with curated Unsplash image URLs (one per activity type). Images already allowed in `next.config.mjs`.

## Desktop: Three Layout Variants

Switched via `?nav=strip|grid|list` query param (default: `list`). Read from `useSearchParams()`.

### `?nav=strip` — Horizontal card strip

- Wide mega-menu (~780px), centered below navbar
- 5 cards in a flex row, equal width (~150px), ~3:4 aspect ratio
- "All Events" link above the strip

### `?nav=grid` — Grid layout

- Wider dropdown (~400px), 2-column CSS grid
- "All Events" spans full width at top
- 5 activity cards fill the grid

### `?nav=list` (default) — Vertical list

- Narrow dropdown (~220px, slightly wider than current)
- Each row has image as subtle background behind text
- Shorter aspect ratio for list items

## Card Hover Behavior

- **Default**: Dark overlay at ~60% opacity, white label text
- **Hovered**: Overlay drops to ~20%, image "lights up", slight `scale(1.05)`
- **Transition**: `transition-all duration-300`

## Mobile: Side Drawer

- Slides in from the right, ~80% screen width, full height
- **Swipe to open**: Touch listener on right ~20px edge, swipe-left to open
- **Swipe to close**: Swipe-right inside drawer, or tap dimmed background, or X button
- **Page effect**: Content scales to `0.95`, dims to `opacity(0.5)`, gains `border-radius: 12px` — creates layered depth
- **Transition**: `duration-300 ease-out` open, `duration-200 ease-in` close
- Activity cards render as stacked full-width image cards (~60px tall) inside the drawer

## Files to Modify

- `src/components/layout/Navbar.tsx` — main changes (dropdown variants, drawer, swipe)
- Possibly extract `ExploreDropdown.tsx` and `MobileDrawer.tsx` components if Navbar gets too large

## No New Dependencies

CSS transitions + vanilla touch events. No animation library needed.
