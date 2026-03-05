# Hero Banner Image Upload Design

**Date:** 2026-03-06

## Overview

Add image upload capability to the admin hero banner manager, with images stored on Cloudflare R2. Each uploaded image is processed server-side into two versions: high-res (1920px) and mobile (1024px), both in WebP format.

## Data Model

`CmsHeroSlide` type expands:

```typescript
interface CmsHeroSlide {
  url: string; // High-res: 1920px wide, WebP, quality 85
  mobileUrl: string; // Mobile: 1024px wide, WebP, quality 75
  alt: string;
}
```

Backward compatible — frontend falls back to `url` when `mobileUrl` is absent.

## API: POST /api/admin/upload

- **Auth:** `isAdminUser()` check
- **Input:** FormData with `file` (image) and `folder` (string, e.g. `"hero"`)
- **Max size:** 10 MB
- **Processing (sharp):**
  - High-res: resize to 1920px width (maintain aspect ratio), WebP quality 85
  - Mobile: resize to 1024px width (maintain aspect ratio), WebP quality 75
- **R2 storage:** `hero/{timestamp}.webp` and `hero/{timestamp}-mobile.webp`
- **Response:** `{ url: string, mobileUrl: string }`

## Admin UI Changes

Replace the URL input form in `HeroBannerManager` with a drag-and-drop upload zone:

- Dashed border drop zone with visual feedback on dragover
- Click-to-browse fallback via hidden file input
- Alt text input field
- Upload progress indicator (uploading state)
- Image preview after upload
- On success: slide added to list and auto-saved to Supabase

Existing drag-to-reorder and remove functionality unchanged.

## Frontend Changes

`HeroCarousel` uses `<picture>` with `<source>` to serve responsive images:

```tsx
<picture>
  {slide.mobileUrl && (
    <source media="(max-width: 1024px)" srcSet={slide.mobileUrl} />
  )}
  <Image src={slide.url} ... />
</picture>
```

Browser automatically selects the mobile version on screens ≤1024px.

## Approach

Server-side processing with `sharp` (already installed). Single file upload from the browser, server creates both versions and uploads both to R2. No client-side dependencies needed.

## File Changes

1. `src/lib/cms/types.ts` — Add `mobileUrl` to `CmsHeroSlide`
2. `src/app/(admin)/api/admin/upload/route.ts` — New admin upload endpoint
3. `src/components/admin/HeroBannerManager.tsx` — Replace URL form with drag-and-drop upload
4. `src/components/landing/HeroCarousel.tsx` — Use `<picture>` for responsive image serving
