# Hero Image Carousel Design

**Goal:** Replace the flat hero background with a fullscreen auto-fading image carousel managed via Payload CMS.

## Architecture

A `hero-carousel` Payload global stores an array of images (from the Media collection). The landing page Server Component fetches these via the Local API and renders them as stacked `<Image>` elements behind the existing hero text. CSS `@keyframes` cycles opacity for crossfade. A dark overlay ensures text readability. Falls back to the current flat background if no images are uploaded.

## Data Model

**Payload Global: `hero-carousel`**

- `slides` — array of:
  - `image` — relationship to `media` collection (required)

No text, no CTAs — just images. The existing hero text (Tara na!, subtitle, CTA buttons) stays unchanged on top.

## Component Structure

```
Hero Section (Server Component)
├── HeroCarousel (div with stacked images + CSS animation)
│   ├── Image 1 (absolute, opacity animated via CSS)
│   ├── Image 2
│   └── Image N
├── Dark overlay (absolute, bg-black/50)
└── Existing hero text + CTAs (relative, z-10, unchanged)
```

## CSS Animation

- For N images, each gets a keyframe offset of `100/N`%
- Each image is fully visible for ~60% of its slot, fades over ~20%, hidden, fades back ~20%
- Total cycle = `N * 6` seconds (6s per image)
- Animation defined via inline `style` based on slide count
- Pure CSS, zero JS bundle impact

## Transition Style

Auto-crossfade every ~6 seconds. No arrows, no dots, no manual navigation.

## Fallback

0 slides → current `bg-gray-50 dark:bg-slate-900` background, no visual change.

## Image Source

Payload CMS Media collection. Admin uploads hero images via `/admin`.

## Approach

Pure CSS/Tailwind crossfade animation. No JS carousel libraries. No client component needed.
