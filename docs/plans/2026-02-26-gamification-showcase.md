# Gamification Showcase Section — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Collect Badges, Unlock Borders" section to the homepage that introduces users to the gamification system — showing earnable badges and the 4 avatar border tiers.

**Architecture:** A single async server component (`GamificationSection`) fetches badges from Supabase, renders a badge grid and a static border tier showcase. Placed between Testimonials and Organizer CTA on the homepage, wrapped in Suspense with a skeleton fallback.

**Tech Stack:** Next.js Server Component, Supabase query, existing `UserAvatar` component for border demos, existing `TIER_LABELS`/`TIER_LABEL_COLORS`/`TIER_GRADIENTS` constants.

---

### Task 1: Create the GamificationSection server component

**Files:**

- Create: `src/components/landing/GamificationSection.tsx`

**Step 1: Create the component**

```tsx
import Link from "next/link";
import Image from "next/image";

import UserAvatar from "@/components/ui/UserAvatar";
import { TIER_LABELS, TIER_LABEL_COLORS, type BorderTier } from "@/lib/constants/avatar-borders";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { resolvePresetImage } from "@/lib/constants/avatars";
import { createClient } from "@/lib/supabase/server";

const SHOWCASE_TIERS: BorderTier[] = ["common", "rare", "epic", "legendary"];

export default async function GamificationSection() {
  const supabase = await createClient();

  // Fetch up to 8 badges that have images, ordered by rarity (rarest first)
  const { data: badges } = await supabase
    .from("badges")
    .select("id, title, image_url, rarity, events!inner(title)")
    .order("rarity", { ascending: false })
    .limit(8);

  return (
    <section className="py-20 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4">
          Collect Badges, Unlock Borders
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Every event you join earns you badges and unlocks avatar borders. The more you adventure,
          the rarer your rewards.
        </p>

        {/* Badge Grid */}
        {badges && badges.length > 0 && (
          <div className="mb-16">
            <h3 className="text-lg font-heading font-semibold text-center text-gray-700 dark:text-gray-300 mb-6">
              Earnable Badges
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {badges.map((badge: any) => {
                const resolved = resolvePresetImage(badge.image_url);
                const rarityStyle = RARITY_STYLES[badge.rarity || "common"];
                return (
                  <div
                    key={badge.id}
                    className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 text-center"
                  >
                    <div
                      className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center overflow-hidden ${rarityStyle?.ring ?? ""} ${rarityStyle?.glow ?? ""}`}
                    >
                      {resolved?.type === "url" ? (
                        <Image
                          src={resolved.url}
                          alt={badge.title}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-2xl">
                          {resolved?.type === "emoji" ? resolved.emoji : "\u{1F3C6}"}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                      {badge.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">
                      {(badge as any).events?.title ?? "Event"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Border Tier Showcase */}
        <div>
          <h3 className="text-lg font-heading font-semibold text-center text-gray-700 dark:text-gray-300 mb-6">
            Avatar Border Tiers
          </h3>
          <div className="flex flex-wrap justify-center gap-8">
            {SHOWCASE_TIERS.map((tier) => (
              <div key={tier} className="flex flex-col items-center gap-2">
                <UserAvatar src={null} alt={TIER_LABELS[tier]} size="lg" borderTier={tier} />
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIER_LABEL_COLORS[tier]}`}
                >
                  {TIER_LABELS[tier]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/events"
            className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-3 px-8 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors"
          >
            Start Earning
          </Link>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify no lint errors**

Run: `npx eslint src/components/landing/GamificationSection.tsx`
Expected: 0 errors (warnings are OK)

**Step 3: Commit**

```bash
git add src/components/landing/GamificationSection.tsx
git commit -m "feat: add GamificationSection landing component"
```

---

### Task 2: Add section + skeleton to homepage

**Files:**

- Modify: `src/app/(frontend)/page.tsx`

**Step 1: Add import, skeleton, and Suspense block**

In imports, add:

```tsx
import GamificationSection from "@/components/landing/GamificationSection";
```

Add a skeleton function (after `TestimonialsSkeleton`):

```tsx
function GamificationSkeleton() {
  return (
    <section className="py-20 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-9 w-80 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse mx-auto mb-4" />
        <div className="h-5 w-96 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mx-auto mb-12" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse mb-2" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Insert the Suspense block between Testimonials and Organizer CTA:

```tsx
{
  /* Gamification Showcase — streams as Supabase data arrives */
}
<Suspense fallback={<GamificationSkeleton />}>
  <GamificationSection />
</Suspense>;
```

**Step 2: Verify no lint errors**

Run: `npx eslint src/app/\(frontend\)/page.tsx`
Expected: 0 errors

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/page.tsx
git commit -m "feat: add gamification showcase to homepage"
```

---

### Task 3: Verify and push

**Step 1: Run build check**

Run: `npm run build`
Expected: Build succeeds

**Step 2: Push branch**

```bash
git push -u origin feat/homepage-gamification-showcase
```
