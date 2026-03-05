# Hero Banner Image Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add image upload to the admin hero banner manager with dual-resolution processing (1920px + 1024px WebP) and R2 storage.

**Architecture:** Single file upload from admin UI → POST to `/api/admin/upload` → server-side `sharp` processing into two WebP variants → both uploaded to R2 → URLs saved to Supabase `cms_hero_carousel` JSONB. Frontend `HeroCarousel` uses `<picture>` + `<source>` for responsive serving.

**Tech Stack:** Next.js 15 App Router, sharp (image processing), aws4fetch (R2 uploads), React DnD Kit (existing reorder), Tailwind CSS.

---

### Task 1: Update CmsHeroSlide type

**Files:**

- Modify: `src/lib/cms/types.ts:49-52`

**Step 1: Add `mobileUrl` to `CmsHeroSlide`**

In `src/lib/cms/types.ts`, change the `CmsHeroSlide` interface from:

```typescript
/** A single hero slide inside cms_hero_carousel.slides JSONB */
export interface CmsHeroSlide {
  url: string;
  alt: string;
}
```

to:

```typescript
/** A single hero slide inside cms_hero_carousel.slides JSONB */
export interface CmsHeroSlide {
  url: string;
  mobileUrl?: string;
  alt: string;
}
```

Note: `mobileUrl` is optional for backward compatibility with existing slides that only have `url`.

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS — the optional field is backward compatible.

**Step 3: Commit**

```bash
git add src/lib/cms/types.ts
git commit -m "feat: add mobileUrl to CmsHeroSlide type"
```

---

### Task 2: Create admin upload API route

**Files:**

- Create: `src/app/(admin)/api/admin/upload/route.ts`

**Step 1: Create the admin upload endpoint**

Create `src/app/(admin)/api/admin/upload/route.ts`:

```typescript
import sharp from "sharp";
import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/admin/auth";
import { uploadToR2 } from "@/lib/r2";
import { createClient } from "@/lib/supabase/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_FOLDERS = new Set(["hero"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null;

  if (!file || !folder) {
    return NextResponse.json({ error: "Missing file or folder" }, { status: 400 });
  }

  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();

    // High-res: 1920px wide, WebP quality 85
    const highRes = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // Mobile: 1024px wide, WebP quality 75
    const mobile = await sharp(buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const [url, mobileUrl] = await Promise.all([
      uploadToR2(`${folder}/${timestamp}.webp`, highRes, "image/webp"),
      uploadToR2(`${folder}/${timestamp}-mobile.webp`, mobile, "image/webp"),
    ]);

    return NextResponse.json({ url, mobileUrl });
  } catch (error) {
    console.error("[admin/upload] Processing error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

Key decisions:

- `withoutEnlargement: true` prevents upscaling small images
- Both uploads happen in parallel via `Promise.all`
- Uses the same `isAdminUser()` auth pattern as the existing hero-carousel route
- `ALLOWED_FOLDERS` is extensible for future admin uploads

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Run lint**

Run: `pnpm lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/\(admin\)/api/admin/upload/route.ts
git commit -m "feat: add admin upload API with dual-resolution sharp processing"
```

---

### Task 3: Update HeroBannerManager with drag-and-drop upload

**Files:**

- Modify: `src/components/admin/HeroBannerManager.tsx`

**Step 1: Update the Slide interface and add upload state**

In `src/components/admin/HeroBannerManager.tsx`, update the `Slide` interface (line 26-29) from:

```typescript
interface Slide {
  url: string;
  alt: string;
}
```

to:

```typescript
interface Slide {
  url: string;
  mobileUrl?: string;
  alt: string;
}
```

**Step 2: Replace the "Add new slide" section with a drag-and-drop upload zone**

Replace the entire bottom section (the `<div>` with `"Add new slide"` at lines 219-245) with a new upload zone component. The full replacement for lines 219-245 is:

Remove these states from `HeroBannerManager` (lines 101-102):

```typescript
const [newUrl, setNewUrl] = useState("");
const [newAlt, setNewAlt] = useState("");
```

And replace them with:

```typescript
const [newAlt, setNewAlt] = useState("");
const [uploading, setUploading] = useState(false);
const [dragOver, setDragOver] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
```

Add `useRef` to the React import on line 21:

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
```

Replace the `addSlide` callback (lines 139-146) with an `uploadAndAdd` callback:

```typescript
const uploadAndAdd = useCallback(
  async (file: File) => {
    if (!newAlt.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "hero");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const { url, mobileUrl } = await res.json();
      const updated = [...slides, { url, mobileUrl, alt: newAlt.trim() }];
      setSlides(updated);
      setNewAlt("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      void save(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  },
  [slides, newAlt, save],
);
```

Add drop handlers:

```typescript
const handleDrop = useCallback(
  (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      void uploadAndAdd(file);
    }
  },
  [uploadAndAdd],
);

const handleFileChange = useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadAndAdd(file);
    }
  },
  [uploadAndAdd],
);
```

Replace the "Add new slide" JSX block (lines 219-245) with:

```tsx
<div
  onDragOver={(e) => {
    e.preventDefault();
    setDragOver(true);
  }}
  onDragLeave={() => setDragOver(false)}
  onDrop={handleDrop}
  className={cn(
    "rounded-xl border-2 border-dashed p-6 text-center transition-colors",
    dragOver
      ? "border-lime-500 bg-lime-50 dark:border-lime-400 dark:bg-lime-950/20"
      : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50",
  )}
>
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={handleFileChange}
    className="hidden"
  />

  <div className="mb-4">
    <svg
      className="mx-auto h-10 w-10 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"
      />
    </svg>
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
      Drag and drop an image, or{" "}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="font-medium text-lime-600 hover:text-lime-500 dark:text-lime-400"
      >
        browse
      </button>
    </p>
    <p className="mt-1 text-xs text-gray-400">Max 10 MB. Will be converted to WebP.</p>
  </div>

  <div className="mx-auto flex max-w-md items-center gap-3">
    <input
      type="text"
      placeholder="Alt text (required)"
      value={newAlt}
      onChange={(e) => setNewAlt(e.target.value)}
      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
    />
  </div>

  {uploading && (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      Uploading and processing...
    </div>
  )}
</div>
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Run lint**

Run: `pnpm lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/HeroBannerManager.tsx
git commit -m "feat: replace URL input with drag-and-drop image upload in hero banner admin"
```

---

### Task 4: Update HeroCarousel for responsive image serving

**Files:**

- Modify: `src/components/landing/HeroCarousel.tsx`
- Modify: `src/components/landing/HeroSection.tsx`
- Modify: `src/app/(frontend)/page.tsx`

**Step 1: Update HeroCarousel's Slide interface to include mobileUrl**

In `src/components/landing/HeroCarousel.tsx`, update the `Slide` interface (lines 3-9) from:

```typescript
interface Slide {
  image: {
    url: string;
    alt: string;
    width?: number;
    height?: number;
  };
}
```

to:

```typescript
interface Slide {
  image: {
    url: string;
    mobileUrl?: string;
    alt: string;
  };
}
```

**Step 2: Use `<picture>` + `<source>` for responsive images**

Replace the `<Image>` element (lines 40-49) with:

```tsx
<picture>
  {slide.image.mobileUrl && <source media="(max-width: 1024px)" srcSet={slide.image.mobileUrl} />}
  <Image
    src={slide.image.url}
    alt={slide.image.alt || "Adventure"}
    fill
    className="object-cover"
    sizes="100vw"
    quality={50}
    priority={i === 0}
    fetchPriority={i === 0 ? "high" : "auto"}
    loading={i === 0 ? "eager" : "lazy"}
  />
</picture>
```

**Step 3: Update HeroSection to pass mobileUrl through**

In `src/components/landing/HeroSection.tsx`, update the `HeroSlide` interface (lines 18-20) from:

```typescript
interface HeroSlide {
  image: { url: string; alt: string };
}
```

to:

```typescript
interface HeroSlide {
  image: { url: string; mobileUrl?: string; alt: string };
}
```

Update `HeroSectionProps` interface (lines 22-24) to include `mobileUrl`:

```typescript
interface HeroSectionProps {
  heroData: { slides?: { image?: { url?: string; mobileUrl?: string; alt?: string } }[] } | null;
}
```

Update the filter and map in the `heroSlides` construction (lines 27-39) to pass through `mobileUrl`:

```typescript
const heroSlides: HeroSlide[] = heroData?.slides
  ? heroData.slides
      .filter(
        (slide): slide is { image: { url: string; mobileUrl?: string; alt: string } } =>
          !!slide.image && typeof slide.image === "object" && !!slide.image.url,
      )
      .map((slide) => ({
        image: {
          url: slide.image.url,
          mobileUrl: slide.image.mobileUrl,
          alt: slide.image.alt || "Adventure",
        },
      }))
  : [];
```

**Step 4: Update the homepage data mapping**

In `src/app/(frontend)/page.tsx`, update the `HeroData` interface (lines 234-236) from:

```typescript
interface HeroData {
  slides: { image: { url: string; alt: string } }[];
}
```

to:

```typescript
interface HeroData {
  slides: { image: { url: string; mobileUrl?: string; alt: string } }[];
}
```

Update the `transformedHeroData` mapping (lines 246-249) to include `mobileUrl`:

```typescript
const transformedHeroData: HeroData | null =
  heroSlides.length > 0
    ? {
        slides: heroSlides.map((s) => ({
          image: { url: s.url, mobileUrl: s.mobileUrl, alt: s.alt },
        })),
      }
    : null;
```

**Step 5: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 6: Run lint**

Run: `pnpm lint`
Expected: PASS

**Step 7: Commit**

```bash
git add src/components/landing/HeroCarousel.tsx src/components/landing/HeroSection.tsx src/app/\(frontend\)/page.tsx
git commit -m "feat: serve responsive hero images with picture/source for mobile"
```

---

### Task 5: Final verification

**Step 1: Run full CI checks**

Run: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`
Expected: All PASS

**Step 2: Run build**

Run: `pnpm build`
Expected: Build succeeds with no errors.

**Step 3: Manual testing checklist**

1. Navigate to `/admin` → Hero Banners section
2. Verify the drag-and-drop upload zone appears (no URL input)
3. Enter alt text, drag an image file onto the zone
4. Verify upload progress indicator shows
5. Verify the slide appears in the list after upload
6. Verify drag-to-reorder still works
7. Verify remove still works
8. Navigate to homepage `/`
9. Verify hero images display correctly on desktop
10. Resize browser to mobile width (≤1024px) and verify mobile image loads (check Network tab)

**Step 4: Commit any fixes, then final commit message**

```bash
git add -A
git commit -m "feat: hero banner image upload with dual-resolution R2 storage"
```
