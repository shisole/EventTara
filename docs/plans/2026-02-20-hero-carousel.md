# Hero Image Carousel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a fullscreen auto-fading hero image carousel to the landing page, with images managed via Payload CMS.

**Architecture:** A new `hero-carousel` Payload global stores an array of image references (to the existing `media` collection). The landing page Server Component fetches the slides via Payload Local API and renders them as stacked absolutely-positioned `next/image` elements with CSS `@keyframes` crossfade animation. The existing hero text/CTAs sit on top unchanged. Falls back to the current flat background when no images are uploaded.

**Tech Stack:** Payload CMS globals, next/image, CSS @keyframes animation, Tailwind CSS

---

### Task 1: Create hero-carousel Payload global

**Files:**

- Create: `src/payload/globals/hero-carousel.ts`
- Modify: `src/payload.config.ts`

**Step 1: Create the global definition**

Create `src/payload/globals/hero-carousel.ts`:

```typescript
import type { GlobalConfig } from "payload";

export const HeroCarousel: GlobalConfig = {
  slug: "hero-carousel",
  label: "Hero Carousel",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "slides",
      type: "array",
      label: "Slides",
      minRows: 0,
      maxRows: 10,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
  ],
};
```

**Step 2: Register in payload.config.ts**

Add import at top:

```typescript
import { HeroCarousel } from "./payload/globals/hero-carousel";
```

Add `HeroCarousel` to the `globals` array (after existing globals):

```typescript
globals: [SiteSettings, Navigation, HeroCarousel],
```

**Step 3: Verify build passes**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/payload/globals/hero-carousel.ts src/payload.config.ts
git commit -m "feat: add hero-carousel global to payload cms"
```

---

### Task 2: Add CSS crossfade keyframes

**Files:**

- Modify: `src/app/(frontend)/globals.css`

**Step 1: Add the crossfade keyframes at the end of globals.css**

Append to the end of `src/app/(frontend)/globals.css`:

```css
/* Hero carousel crossfade animation */
@keyframes heroFade {
  0%,
  5% {
    opacity: 1;
  }
  20%,
  80% {
    opacity: 0;
  }
  95%,
  100% {
    opacity: 1;
  }
}
```

This is a generic keyframe. The actual timing (animation-duration, animation-delay) is calculated per-slide in the component based on the number of slides, using inline styles.

**Step 2: Verify build passes**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/(frontend)/globals.css
git commit -m "feat: add hero carousel crossfade keyframes"
```

---

### Task 3: Build the HeroCarousel component

**Files:**

- Create: `src/components/landing/HeroCarousel.tsx`

**Step 1: Create the component**

Create `src/components/landing/HeroCarousel.tsx`:

```typescript
import Image from "next/image";

type Slide = {
  image: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
};

type HeroCarouselProps = {
  slides: Slide[];
};

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  if (slides.length === 0) return null;

  const count = slides.length;
  const durationPerSlide = 6; // seconds per slide
  const totalDuration = count * durationPerSlide;

  return (
    <div className="absolute inset-0">
      {slides.map((slide, i) => {
        const delay = i * durationPerSlide;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={
              count > 1
                ? {
                    animation: `heroFade ${totalDuration}s ${delay}s infinite`,
                    opacity: i === 0 ? 1 : 0,
                  }
                : undefined
            }
          >
            <Image
              src={slide.image.url}
              alt={slide.image.alt || "Adventure"}
              fill
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
            />
          </div>
        );
      })}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
```

Key details:

- Each slide is absolutely positioned and stacked
- For a single image: no animation, just a static background
- For multiple images: CSS `heroFade` animation with staggered delays
- First image has `priority` for LCP optimization
- Dark overlay sits on top of all images for text contrast

**Step 2: Verify build passes**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/landing/HeroCarousel.tsx
git commit -m "feat: add hero carousel component with css crossfade"
```

---

### Task 4: Integrate carousel into the landing page

**Files:**

- Modify: `src/app/(frontend)/page.tsx`

**Step 1: Add imports**

Add these imports at the top of `src/app/(frontend)/page.tsx`:

```typescript
import { getPayloadClient } from "@/lib/payload/client";
import HeroCarousel from "@/components/landing/HeroCarousel";
```

**Step 2: Fetch hero carousel data**

Inside the `Home` function, after the existing Supabase queries (after line 83), add:

```typescript
// Fetch hero carousel images from Payload CMS
let heroSlides: { image: { url: string; alt: string } }[] = [];
try {
  const payload = await getPayloadClient();
  const heroData = await payload.findGlobal({ slug: "hero-carousel" });
  if (heroData?.slides) {
    heroSlides = heroData.slides
      .filter((slide: any) => slide.image && typeof slide.image === "object")
      .map((slide: any) => ({
        image: {
          url: slide.image.url,
          alt: slide.image.alt || "Adventure",
        },
      }));
  }
} catch {
  // Fallback: no carousel images
}
```

**Step 3: Update the hero section**

Replace the hero `<section>` (lines 103-127) with:

```tsx
{
  /* Hero Section */
}
<section className="relative py-24 sm:py-32 overflow-hidden min-h-[500px] flex items-center">
  {heroSlides.length > 0 ? (
    <HeroCarousel slides={heroSlides} />
  ) : (
    <>
      {/* Fallback: original flat background */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-slate-900" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-500/10 rounded-full blur-3xl" />
    </>
  )}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
    <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/30">
      <span className="text-lime-600 dark:text-lime-400 text-sm font-semibold tracking-wide uppercase">
        Beta — Now Live
      </span>
    </div>
    <h1
      className={`text-5xl sm:text-7xl font-heading font-bold mb-4 ${heroSlides.length > 0 ? "text-white" : "text-gray-900 dark:text-white"}`}
    >
      Tara na!
    </h1>
    <p
      className={`text-xl sm:text-2xl mb-10 max-w-2xl mx-auto ${heroSlides.length > 0 ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}
    >
      Book Your Next Adventure. Discover hiking, biking, running events and more across the
      Philippines.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link
        href="/events"
        className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors"
      >
        Explore Events
      </Link>
      <HostEventLink />
    </div>
  </div>
</section>;
```

Key changes from the original hero:

- Section has `relative` positioning and `min-h-[500px]` with `flex items-center`
- When carousel has images: renders `HeroCarousel`, text becomes white
- When no images: renders the original flat bg + glow effect, text colors unchanged
- The text content, CTAs, and badge are completely unchanged

**Step 4: Verify build passes**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/(frontend)/page.tsx
git commit -m "feat: integrate hero carousel into landing page"
```

---

### Task 5: Verify end-to-end

**Files:** None (runtime verification)

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Verify fallback (no images)**

Visit `http://localhost:3000/` — the hero should look identical to before (flat background with glow effect) since no carousel images have been uploaded yet.

**Step 3: Upload test images via admin**

1. Go to `http://localhost:3000/admin`
2. Go to **Media** → upload 2-3 adventure landscape images (wide/panoramic work best)
3. Go to **Hero Carousel** global → add slides referencing the uploaded images
4. Save

**Step 4: Verify carousel**

Reload `http://localhost:3000/` — the hero should now show:

- Full-bleed background images
- Dark overlay for text contrast
- Auto-crossfade between images every ~6 seconds
- White text on top (unchanged content)
- "Tara na!" heading, subtitle, and CTA buttons all visible and readable

**Step 5: Verify the rest of the page**

Scroll down — all other sections (Upcoming Events, How It Works, Categories, Organizers, CTA) should be unchanged.

**Step 6: Commit any generated files**

```bash
git add -A
git commit -m "chore: payload generated files after hero carousel"
```

---

## Post-Implementation Checklist

- [ ] `hero-carousel` global visible in Payload admin
- [ ] Landing page shows flat background when no carousel images uploaded
- [ ] Landing page shows crossfading images when slides are configured
- [ ] Text is readable over images (dark overlay)
- [ ] First image loads with priority (no LCP penalty)
- [ ] Single image = static background (no animation)
- [ ] Multiple images = smooth CSS crossfade every ~6s
- [ ] All other landing page sections unaffected
- [ ] Build passes
