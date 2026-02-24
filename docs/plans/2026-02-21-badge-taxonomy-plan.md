# Badge Taxonomy & Enrichment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enrich existing badge system with category, rarity, and badge templates for organizers.

**Architecture:** Add `category` and `rarity` columns to the `badges` table, create a static badge templates array, update BadgeForm with template picker and new dropdowns, update BadgeCard/BadgeGrid/badge detail page with rarity visuals and category filtering.

**Tech Stack:** Next.js 15 App Router, Supabase, TypeScript, Tailwind CSS

---

### Task 1: Update Supabase Types

**Files:**

- Modify: `src/lib/supabase/types.ts:225-251`

**Step 1: Add category and rarity to badges Row type**

In the `badges` table `Row` type, add after `image_url`:

```ts
category: "distance" | "adventure" | "location" | "special";
rarity: "common" | "rare" | "epic" | "legendary";
```

**Step 2: Add category and rarity to badges Insert type**

```ts
category?: 'distance' | 'adventure' | 'location' | 'special'
rarity?: 'common' | 'rare' | 'epic' | 'legendary'
```

**Step 3: Add category and rarity to badges Update type**

```ts
category?: 'distance' | 'adventure' | 'location' | 'special'
rarity?: 'common' | 'rare' | 'epic' | 'legendary'
```

**Step 4: Verify build**

Run: `npm run build`
Expected: No type errors (columns have defaults in DB so existing code won't break)

**Step 5: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add category and rarity types to badges schema"
```

---

### Task 2: Add Supabase Migration

**Files:**

- Create: `supabase/migrations/20260221_badge_category_rarity.sql`

**Step 1: Write migration SQL**

```sql
ALTER TABLE badges
  ADD COLUMN category text NOT NULL DEFAULT 'special'
    CHECK (category IN ('distance', 'adventure', 'location', 'special')),
  ADD COLUMN rarity text NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'));
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260221_badge_category_rarity.sql
git commit -m "feat: add category and rarity columns to badges table"
```

> **Note:** This migration must be applied to the Supabase database manually or via `supabase db push`. Existing badges will default to category='special', rarity='common'.

---

### Task 3: Create Badge Templates Constant

**Files:**

- Create: `src/lib/constants/badge-templates.ts`

**Step 1: Define the BadgeTemplate type and array**

```ts
export interface BadgeTemplate {
  id: string;
  title: string;
  description: string;
  category: "distance" | "adventure" | "location" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  suggestedImage: string | null;
}

export const BADGE_TEMPLATES: BadgeTemplate[] = [
  // Distance — Running
  {
    id: "5km-finisher",
    title: "5KM Finisher",
    description: "Completed a 5KM run. Every journey starts with the first stride!",
    category: "distance",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "10km-finisher",
    title: "10KM Finisher",
    description: "Pushed past 10 kilometers. Double digits, double respect.",
    category: "distance",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "half-marathoner",
    title: "Half Marathoner",
    description: "Conquered the 21KM half marathon distance. Halfway to legend.",
    category: "distance",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "marathoner",
    title: "Marathoner",
    description: "Finished a full 42.195KM marathon. You are relentless.",
    category: "distance",
    rarity: "epic",
    suggestedImage: null,
  },
  {
    id: "ultra-runner",
    title: "Ultra Runner",
    description: "Went beyond the marathon. 50KM+ of pure determination.",
    category: "distance",
    rarity: "legendary",
    suggestedImage: null,
  },
  // Distance — Cycling
  {
    id: "25km-rider",
    title: "25KM Rider",
    description: "Completed a 25KM ride. Wheels spinning, spirits soaring.",
    category: "distance",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "50km-rider",
    title: "50KM Rider",
    description: "Rode 50 kilometers. The road rewards those who keep pedaling.",
    category: "distance",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "century-rider",
    title: "Century Rider",
    description: "Completed a 100KM century ride. Your legs are legendary.",
    category: "distance",
    rarity: "epic",
    suggestedImage: null,
  },
  // Adventure
  {
    id: "first-summit",
    title: "First Summit",
    description: "Reached your first mountain summit. The view from the top changes everything.",
    category: "adventure",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "3-summits",
    title: "3 Summits",
    description:
      "Conquered three different peaks. The mountains are calling and you keep answering.",
    category: "adventure",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "mountain-conqueror",
    title: "Mountain Conqueror",
    description: "Summited 10 or more peaks. The mountains bow to your determination.",
    category: "adventure",
    rarity: "epic",
    suggestedImage: null,
  },
  {
    id: "trail-blazer",
    title: "Trail Blazer",
    description: "Completed a trail run event. You carve your own path.",
    category: "adventure",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "peak-seeker",
    title: "Peak Seeker",
    description: "Joined 5 hiking events. Always chasing the next horizon.",
    category: "adventure",
    rarity: "rare",
    suggestedImage: null,
  },
  // Location — Philippines
  {
    id: "cebu-trail-seeker",
    title: "Cebu Trail Seeker",
    description: "Joined an adventure event in Cebu. The Queen City of the South awaits.",
    category: "location",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "luzon-explorer",
    title: "Luzon Explorer",
    description:
      "Adventured across Luzon. From the mountains of Cordillera to the trails of Batangas.",
    category: "location",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "visayas-voyager",
    title: "Visayas Voyager",
    description: "Explored the Visayas islands. Sun, sea, and summits.",
    category: "location",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "mindanao-pathfinder",
    title: "Mindanao Pathfinder",
    description: "Blazed trails in Mindanao. Home of Mt. Apo and untamed adventures.",
    category: "location",
    rarity: "rare",
    suggestedImage: null,
  },
  {
    id: "philippine-adventurer",
    title: "Philippine Adventurer",
    description:
      "Joined events across 3 major island groups. The whole archipelago is your playground.",
    category: "location",
    rarity: "epic",
    suggestedImage: null,
  },
  // Special
  {
    id: "event-finisher",
    title: "Event Finisher",
    description: "Completed an event from start to finish. You showed up and you conquered.",
    category: "special",
    rarity: "common",
    suggestedImage: null,
  },
  {
    id: "eventtara-pioneer",
    title: "EventTara Pioneer",
    description: "One of the earliest adventurers on EventTara. A true trailblazer.",
    category: "special",
    rarity: "legendary",
    suggestedImage: null,
  },
];

export const BADGE_CATEGORIES = [
  { value: "distance" as const, label: "Distance", description: "Running & cycling milestones" },
  { value: "adventure" as const, label: "Adventure", description: "Hiking & trail achievements" },
  { value: "location" as const, label: "Location", description: "Region-specific badges" },
  { value: "special" as const, label: "Special", description: "Event-specific & limited edition" },
];

export const BADGE_RARITIES = [
  { value: "common" as const, label: "Common", color: "text-gray-500" },
  { value: "rare" as const, label: "Rare", color: "text-teal-500" },
  { value: "epic" as const, label: "Epic", color: "text-purple-500" },
  { value: "legendary" as const, label: "Legendary", color: "text-golden-500" },
];
```

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/constants/badge-templates.ts
git commit -m "feat: add badge templates, categories, and rarities constants"
```

---

### Task 4: Create Rarity Visual Utilities

**Files:**

- Create: `src/lib/constants/badge-rarity.ts`

**Step 1: Create rarity style mapping**

This file provides consistent rarity visual styles used by BadgeCard, badge detail page, and any future badge displays.

```ts
export const RARITY_STYLES = {
  common: {
    ring: "ring-2 ring-gray-200 dark:ring-gray-700",
    glow: "",
    pill: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    label: "Common",
  },
  rare: {
    ring: "ring-2 ring-teal-400 dark:ring-teal-500",
    glow: "shadow-[0_0_12px_rgba(20,184,166,0.3)]",
    pill: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
    label: "Rare",
  },
  epic: {
    ring: "ring-2 ring-purple-400 dark:ring-purple-500",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]",
    pill: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    label: "Epic",
  },
  legendary: {
    ring: "ring-2 ring-golden-400 dark:ring-golden-500",
    glow: "shadow-[0_0_16px_rgba(234,179,8,0.4)]",
    pill: "bg-golden-100 text-golden-700 dark:bg-golden-900/50 dark:text-golden-300",
    label: "Legendary",
  },
} as const;

export const CATEGORY_STYLES = {
  distance: {
    pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    label: "Distance",
  },
  adventure: {
    pill: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
    label: "Adventure",
  },
  location: {
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    label: "Location",
  },
  special: {
    pill: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    label: "Special",
  },
} as const;

export type BadgeCategory = keyof typeof CATEGORY_STYLES;
export type BadgeRarity = keyof typeof RARITY_STYLES;
```

**Step 2: Commit**

```bash
git add src/lib/constants/badge-rarity.ts
git commit -m "feat: add rarity and category visual style constants"
```

---

### Task 5: Update API Route

**Files:**

- Modify: `src/app/(frontend)/api/badges/route.ts`

**Step 1: Accept category and rarity in the POST handler**

Update line 12 to destructure `category` and `rarity` from the request body:

```ts
const { event_id, title, description, image_url, category, rarity } = await request.json();
```

**Step 2: Pass new fields to update call (line 24)**

```ts
.update({ title, description, image_url, category, rarity })
```

**Step 3: Pass new fields to insert call (line 35)**

```ts
.insert({ event_id, title, description, image_url, category, rarity })
```

**Step 4: Verify build**

Run: `npm run build`
Expected: No errors

**Step 5: Commit**

```bash
git add src/app/(frontend)/api/badges/route.ts
git commit -m "feat: accept category and rarity in badge API route"
```

---

### Task 6: Add Legendary Shimmer Animation

**Files:**

- Modify: `tailwind.config.ts`

**Step 1: Add shimmer keyframe and animation**

In the `extend` section of the Tailwind config, add to `keyframes`:

```ts
shimmer: {
  '0%': { backgroundPosition: '-200% 0' },
  '100%': { backgroundPosition: '200% 0' },
},
```

And add to `animation`:

```ts
shimmer: 'shimmer 3s linear infinite',
```

**Step 2: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add shimmer animation for legendary badge rarity"
```

---

### Task 7: Update BadgeCard Component

**Files:**

- Modify: `src/components/badges/BadgeCard.tsx`

**Step 1: Update BadgeCardProps interface**

Add `category` and `rarity` to the props:

```ts
interface BadgeCardProps {
  id: string;
  title: string;
  eventName: string;
  imageUrl: string | null;
  awardedAt: string;
  category?: "distance" | "adventure" | "location" | "special";
  rarity?: "common" | "rare" | "epic" | "legendary";
}
```

**Step 2: Import rarity/category styles**

```ts
import { RARITY_STYLES, CATEGORY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";
```

**Step 3: Apply rarity ring to the badge image circle**

Replace the existing `w-20 h-20` div with rarity-aware styling:

```tsx
const rarityStyle = RARITY_STYLES[rarity || "common"];
const categoryStyle = category ? CATEGORY_STYLES[category] : null;
```

On the image circle div, add the rarity ring and glow classes:

```tsx
<div className={cn(
  `w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center overflow-hidden`,
  resolved?.type === "emoji" ? resolved.color : "bg-golden-100",
  rarityStyle.ring,
  rarityStyle.glow,
  rarity === "legendary" && "animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-golden-200 via-golden-400 to-golden-200"
)}>
```

**Step 4: Add category pill below event name**

After the event name paragraph, add:

```tsx
{
  categoryStyle && (
    <span className={cn("inline-block text-xs px-2 py-0.5 rounded-full mt-1", categoryStyle.pill)}>
      {categoryStyle.label}
    </span>
  );
}
```

**Step 5: Verify build**

Run: `npm run build`

**Step 6: Commit**

```bash
git add src/components/badges/BadgeCard.tsx
git commit -m "feat: add rarity ring and category pill to BadgeCard"
```

---

### Task 8: Update BadgeGrid with Category Filter

**Files:**

- Modify: `src/components/badges/BadgeGrid.tsx`

**Step 1: Convert to client component and add filter state**

Add `"use client"` at the top. Import `useState` and `CATEGORY_STYLES`.

**Step 2: Update Badge interface**

Add optional `category` and `rarity` to the interface:

```ts
interface Badge {
  id: string;
  title: string;
  eventName: string;
  imageUrl: string | null;
  awardedAt: string;
  category?: string;
  rarity?: string;
}
```

**Step 3: Add category tabs logic**

```tsx
const categories = badges.reduce((acc, b) => {
  if (b.category) acc.add(b.category);
  return acc;
}, new Set<string>());

const showTabs = categories.size >= 2;
const [activeCategory, setActiveCategory] = useState<string | null>(null);

const filteredBadges = activeCategory
  ? badges.filter((b) => b.category === activeCategory)
  : badges;
```

**Step 4: Render tabs above the grid**

Only when `showTabs` is true:

```tsx
{
  showTabs && (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      <button
        onClick={() => setActiveCategory(null)}
        className={cn(
          "px-3 py-1 rounded-full text-sm font-medium transition-colors",
          !activeCategory
            ? "bg-teal-600 text-white"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
        )}
      >
        All
      </button>
      {Array.from(categories).map((cat) => {
        const style = CATEGORY_STYLES[cat as keyof typeof CATEGORY_STYLES];
        return (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-colors",
              activeCategory === cat
                ? "bg-teal-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
            )}
          >
            {style?.label || cat}
          </button>
        );
      })}
    </div>
  );
}
```

**Step 5: Pass category/rarity through to BadgeCard**

Map `filteredBadges` instead of `badges`, and spread `category` and `rarity` to BadgeCard:

```tsx
{
  filteredBadges.map((badge) => (
    <BadgeCard
      key={badge.id}
      {...badge}
      category={badge.category as any}
      rarity={badge.rarity as any}
    />
  ));
}
```

**Step 6: Verify build**

Run: `npm run build`

**Step 7: Commit**

```bash
git add src/components/badges/BadgeGrid.tsx
git commit -m "feat: add category filter tabs to BadgeGrid"
```

---

### Task 9: Update Badge Detail Page

**Files:**

- Modify: `src/app/(frontend)/(participant)/badges/[id]/page.tsx`

**Step 1: Import rarity/category styles**

```ts
import { RARITY_STYLES, CATEGORY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";
```

**Step 2: Use rarity and category from the badge data**

After the badge is fetched (line 63), extract the styles:

```ts
const rarityStyle = RARITY_STYLES[(badge.rarity as keyof typeof RARITY_STYLES) || "common"];
const categoryStyle = badge.category
  ? CATEGORY_STYLES[badge.category as keyof typeof CATEGORY_STYLES]
  : null;
```

**Step 3: Add rarity ring to the hero image circle (line 131)**

Apply the same `ring` and `glow` classes plus legendary shimmer as in BadgeCard.

**Step 4: Add rarity pill next to the title (after line 147)**

Only show for non-common:

```tsx
{
  badge.rarity && badge.rarity !== "common" && (
    <span
      className={cn("inline-block text-xs px-2.5 py-1 rounded-full font-medium", rarityStyle.pill)}
    >
      {rarityStyle.label}
    </span>
  );
}
```

**Step 5: Add category below the description**

```tsx
{
  categoryStyle && (
    <span className={cn("inline-block text-xs px-2.5 py-1 rounded-full", categoryStyle.pill)}>
      {categoryStyle.label}
    </span>
  );
}
```

**Step 6: Verify build**

Run: `npm run build`

**Step 7: Commit**

```bash
git add "src/app/(frontend)/(participant)/badges/[id]/page.tsx"
git commit -m "feat: add rarity and category display to badge detail page"
```

---

### Task 10: Create BadgeTemplatePicker Component

**Files:**

- Create: `src/components/dashboard/BadgeTemplatePicker.tsx`

**Step 1: Build the template picker component**

A client component that shows badge templates grouped by category tabs. Clicking a template calls an `onSelect` callback with the template data.

```tsx
"use client";

import { useState } from "react";
import { BADGE_TEMPLATES, BADGE_CATEGORIES } from "@/lib/constants/badge-templates";
import { RARITY_STYLES } from "@/lib/constants/badge-rarity";
import { cn } from "@/lib/utils";

interface BadgeTemplatePickerProps {
  onSelect: (template: {
    title: string;
    description: string;
    category: string;
    rarity: string;
  }) => void;
  onSkip: () => void;
}

export default function BadgeTemplatePicker({ onSelect, onSkip }: BadgeTemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? BADGE_TEMPLATES.filter((t) => t.category === activeCategory)
    : BADGE_TEMPLATES;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Start from a template
        </h3>
        <button
          type="button"
          onClick={onSkip}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Or create from scratch
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            !activeCategory
              ? "bg-teal-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
          )}
        >
          All
        </button>
        {BADGE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              activeCategory === cat.value
                ? "bg-teal-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
        {filtered.map((t) => {
          const rStyle = RARITY_STYLES[t.rarity];
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              className="text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-500 transition-colors"
            >
              <p className="text-sm font-medium truncate">{t.title}</p>
              <span
                className={cn("inline-block text-xs px-1.5 py-0.5 rounded-full mt-1", rStyle.pill)}
              >
                {rStyle.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/components/dashboard/BadgeTemplatePicker.tsx
git commit -m "feat: add BadgeTemplatePicker component"
```

---

### Task 11: Update BadgeForm with Template Picker and New Fields

**Files:**

- Modify: `src/components/dashboard/BadgeForm.tsx`

**Step 1: Import new dependencies**

```ts
import BadgeTemplatePicker from "./BadgeTemplatePicker";
import { BADGE_CATEGORIES, BADGE_RARITIES } from "@/lib/constants/badge-templates";
```

**Step 2: Update existingBadge interface**

Add `category` and `rarity` to the existingBadge type:

```ts
existingBadge?: {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  rarity: string | null;
} | null;
```

**Step 3: Add category, rarity state and template picker visibility**

```ts
const [category, setCategory] = useState(existingBadge?.category || "special");
const [rarity, setRarity] = useState(existingBadge?.rarity || "common");
const [showTemplatePicker, setShowTemplatePicker] = useState(!existingBadge);
```

**Step 4: Update handleSubmit body to include new fields**

```ts
body: JSON.stringify({
  event_id: eventId,
  title,
  description,
  image_url: imageUrl,
  category,
  rarity,
}),
```

**Step 5: Add template selection handler**

```ts
const handleTemplateSelect = (template: {
  title: string;
  description: string;
  category: string;
  rarity: string;
}) => {
  setTitle(template.title);
  setDescription(template.description);
  setCategory(template.category);
  setRarity(template.rarity);
  setShowTemplatePicker(false);
};
```

**Step 6: Update JSX**

Before the existing form fields, add the template picker (only when creating a new badge and `showTemplatePicker` is true):

```tsx
{
  showTemplatePicker && !existingBadge && (
    <BadgeTemplatePicker
      onSelect={handleTemplateSelect}
      onSkip={() => setShowTemplatePicker(false)}
    />
  );
}
```

After the PhotoUploader, add category and rarity selects:

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-1">
    <label
      htmlFor="badgeCategory"
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      Category
    </label>
    <select
      id="badgeCategory"
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
    >
      {BADGE_CATEGORIES.map((cat) => (
        <option key={cat.value} value={cat.value}>
          {cat.label}
        </option>
      ))}
    </select>
  </div>

  <div className="space-y-1">
    <label
      htmlFor="badgeRarity"
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      Rarity
    </label>
    <select
      id="badgeRarity"
      value={rarity}
      onChange={(e) => setRarity(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-lime-500 focus:ring-2 focus:ring-lime-200 dark:focus:ring-lime-800 outline-none transition-colors"
    >
      {BADGE_RARITIES.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  </div>
</div>
```

**Step 7: Verify build**

Run: `npm run build`

**Step 8: Commit**

```bash
git add src/components/dashboard/BadgeForm.tsx
git commit -m "feat: add template picker, category, and rarity to BadgeForm"
```

---

### Task 12: Update Profile Page Badge Query

**Files:**

- Modify: `src/app/(frontend)/(participant)/profile/[username]/page.tsx:161-191`

**Step 1: Update the badge select query to include category and rarity**

Change line 163 from:

```ts
.select("badge_id, awarded_at, badges(title, image_url, events(title))")
```

To:

```ts
.select("badge_id, awarded_at, badges(title, image_url, category, rarity, events(title))")
```

**Step 2: Update the badge mapping (line 185-191)**

Add `category` and `rarity` to the mapped object:

```ts
const badges = (userBadges || []).map((ub: any) => ({
  id: ub.badge_id,
  title: ub.badges?.title || "Badge",
  eventName: ub.badges?.events?.title || "Event",
  imageUrl: ub.badges?.image_url || null,
  awardedAt: ub.awarded_at,
  category: ub.badges?.category || null,
  rarity: ub.badges?.rarity || null,
}));
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add "src/app/(frontend)/(participant)/profile/[username]/page.tsx"
git commit -m "feat: pass category and rarity to BadgeGrid on profile page"
```

---

### Task 13: Update Seed Data

**Files:**

- Modify: `scripts/seed.ts:792-993`

**Step 1: Update BadgeDef interface to include category and rarity**

```ts
interface BadgeDef {
  eventTitle: string;
  title: string;
  description: string;
  image_url: string;
  category: "distance" | "adventure" | "location" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
}
```

**Step 2: Add category and rarity to each badge in BADGE_DEFS**

| Badge                     | category  | rarity    |
| ------------------------- | --------- | --------- |
| Taal Volcano Summit Badge | adventure | common    |
| Sea of Clouds Chaser      | adventure | epic      |
| Masungi Trailblazer       | adventure | rare      |
| BGC Night Runner          | distance  | common    |
| Tagaytay Road Warrior     | distance  | rare      |
| Banahaw MTB Crusher       | adventure | epic      |
| Pinatubo Crater Explorer  | adventure | rare      |
| Bataan Trailblazer        | adventure | rare      |
| Mt. Apo Summiteer         | adventure | legendary |
| Gran Fondo Finisher       | distance  | epic      |
| Corregidor Island Rider   | location  | rare      |
| QC Fun Runner             | distance  | common    |

**Step 3: Update createBadges function insert (line 975-980)**

Add `category` and `rarity` to the insert:

```ts
.insert({
  event_id: eventId,
  title: badge.title,
  description: badge.description,
  image_url: badge.image_url,
  category: badge.category,
  rarity: badge.rarity,
})
```

**Step 4: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat: add category and rarity to seed badge data"
```

---

### Task 14: Final Build Verification and Smoke Check

**Step 1: Run full build**

Run: `npm run build`
Expected: No errors

**Step 2: Run dev server and visually check**

Run: `npm run dev`

Check these pages:

- `/badges/[id]` — rarity ring, rarity pill, category pill visible
- `/profile/[username]` — BadgeGrid shows category filter tabs (if 2+ categories), BadgeCards show rarity rings
- Organizer dashboard badge form — template picker visible, category/rarity dropdowns work

**Step 3: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: badge taxonomy polish and fixups"
```
