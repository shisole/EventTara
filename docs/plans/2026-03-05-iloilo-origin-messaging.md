# Iloilo Origin Story Messaging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add authentic "Started in Iloilo" messaging to EventTara through homepage updates, footer changes, and a new About page telling the founder's journey.

**Architecture:** Create a new About page at `/about` with the founder's personal journey through Iloilo's outdoor scene (biking → running → hiking → building EventTara). Update homepage hero to include local origin subheading. Update footer with Iloilo messaging and add About link. All content is static (no database queries) for fast loading and SEO.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, next/image optimization

---

## Task 1: Prepare Photo Assets

**Files:**

- Create: `public/images/about/` (directory)
- Copy photos from: `/Users/stephenkarljeoffreyhisole/Downloads/pics/`

**Step 1: Create images directory**

```bash
mkdir -p public/images/about
```

**Step 2: Copy and rename photos**

Copy the following photos from Downloads to the public directory with semantic names:

```bash
# Hero image (trail running or summit shot)
cp ~/Downloads/pics/bucari_extreme_27km.jpg public/images/about/hero.jpg

# Timeline photos
cp ~/Downloads/pics/upgraded_mtn_bik_trail.jpg public/images/about/mtb-trail.jpg
cp ~/Downloads/pics/bucari_extreme_27km_finish.jpg public/images/about/imperial-run.jpg
cp ~/Downloads/pics/first_summit_igatmon.jpg public/images/about/mt-igatmon.jpg
cp ~/Downloads/pics/42km_marathon_stats.jpg public/images/about/marathon-stats.jpg
cp ~/Downloads/pics/first_hike_igatmon.jpg public/images/about/recent-hike.jpg

# Gallery photos
cp ~/Downloads/pics/bucari_extreme_27km_3.jpg public/images/about/gallery-bucari.jpg
cp ~/Downloads/pics/first_bike_mtn_bike_trail.jpg public/images/about/gallery-mtb.jpg
cp ~/Downloads/pics/longest_roadbike_ride_second_bike.jpg public/images/about/gallery-roadbike.jpg
cp ~/Downloads/pics/Imperial_legacy_run.jpg public/images/about/gallery-imperial.jpg
```

**Step 3: Optimize images (if needed)**

If images are >2MB, consider optimizing:

```bash
# Install sharp if not already installed
pnpm add -D sharp

# Next.js will handle optimization via next/image
# Just verify file sizes
ls -lh public/images/about/
```

**Step 4: Commit**

```bash
git add public/images/about/
git commit -m "feat: add founder journey photos for About page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Update Homepage Hero Section

**Files:**

- Modify: `src/components/landing/HeroSection.tsx`

**Step 1: Add subheading below main title**

Update the HeroSection component to add the Iloilo origin subheading:

```typescript
// In HeroSection.tsx, after the "Tara na!" h1 (around line 63)

<h1
  className={`text-5xl sm:text-7xl font-heading font-bold mb-4 ${heroSlides.length > 0 ? "text-white" : "text-gray-900 dark:text-white"}`}
>
  Tara na!
</h1>
{/* NEW: Add Iloilo origin subheading */}
<p
  className={`text-lg sm:text-xl mb-6 font-medium ${heroSlides.length > 0 ? "text-lime-300" : "text-lime-600 dark:text-lime-400"}`}
>
  Built by a hiker in Iloilo for adventurers across the Philippines
</p>
<p
  className={`text-xl sm:text-2xl mb-10 max-w-2xl mx-auto ${heroSlides.length > 0 ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}
>
  Book Your Next Adventure. Discover hiking, biking, running events and more across the
  Philippines.
</p>
```

**Step 2: Test homepage rendering**

```bash
pnpm dev
```

Navigate to `http://localhost:3001` and verify:

- ✅ New subheading appears between "Tara na!" and description
- ✅ Lime color matches brand
- ✅ Responsive on mobile (text scales appropriately)
- ✅ Works with and without hero carousel

**Step 3: Commit**

```bash
git add src/components/landing/HeroSection.tsx
git commit -m "feat: add Iloilo origin subheading to homepage hero

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Update Footer Tagline

**Files:**

- Modify: `src/components/layout/Footer.tsx`

**Step 1: Update default tagline**

Change the footer tagline from generic to Iloilo-specific:

```typescript
// In Footer.tsx, around line 8
const footerTagline =
  navigation?.footer_tagline || "Started in Iloilo, built for adventurers nationwide 🇵🇭";
```

**Step 2: Test footer rendering**

```bash
pnpm dev
```

Navigate to any page and scroll to footer:

- ✅ New tagline appears in footer
- ✅ Emoji renders correctly
- ✅ Text is readable in both light and dark mode

**Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: update footer tagline with Iloilo origin message

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Add About Link to Footer

**Files:**

- Modify: `src/components/layout/Footer.tsx`

**Step 1: Add About to default sections**

Update the defaultSections to include an About link:

```typescript
// In Footer.tsx, around line 13
const defaultSections = [
  {
    title: "Explore",
    links: [
      { label: "Browse Events", url: "/events" },
      { label: "Hiking", url: "/events?type=hiking" },
      { label: "Mountain Biking", url: "/events?type=mtb" },
      { label: "Running", url: "/events?type=running" },
    ],
  },
  {
    title: "For Organizers",
    links: [
      { label: "Host Your Event", url: "/signup?role=organizer" },
      { label: "Organizer Dashboard", url: "/dashboard" },
      { label: "Contact Us", url: "/contact" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", url: "/about" },
      { label: "Contact", url: "/contact" },
    ],
  },
];
```

**Step 2: Test footer navigation**

```bash
pnpm dev
```

Check footer on any page:

- ✅ New "About" section appears
- ✅ "Our Story" link points to `/about`
- ✅ Three-column layout looks balanced

**Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat: add About section with Our Story link to footer

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Create About Page Structure

**Files:**

- Create: `src/app/(frontend)/(participant)/about/page.tsx`

**Step 1: Create About page file**

```typescript
import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About EventTara - Built by a Hiker in Iloilo | Stephen Hisole",
  description:
    "The story of how EventTara started from one hiker's journey through Panay Island's trails - from Mt. Igatmon to building a platform for adventurers across the Philippines.",
  openGraph: {
    title: "About EventTara - Built by a Hiker in Iloilo",
    description: "From two bikes to every mountain - the story behind EventTara.",
    images: ["/images/about/hero.jpg"],
  },
};

export default function AboutPage() {
  return (
    <main className="bg-white dark:bg-slate-900">
      {/* Hero Section */}
      <section className="relative h-[400px] sm:h-[500px] flex items-center justify-center">
        <Image
          src="/images/about/hero.jpg"
          alt="Trail running in Panay Island"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-4">
            From Two Bikes to Every Mountain
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto">
            How one hiker&apos;s journey through Iloilo&apos;s trails became EventTara
          </p>
        </div>
      </section>

      {/* Content will be added in next task */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-gray-600 dark:text-gray-400">Content sections coming next...</p>
      </div>
    </main>
  );
}
```

**Step 2: Test page routing**

```bash
pnpm dev
```

Navigate to `http://localhost:3001/about`:

- ✅ Page loads without errors
- ✅ Hero image displays
- ✅ Title and subtitle are centered and readable
- ✅ Dark overlay makes text legible

**Step 3: Run type check**

```bash
pnpm typecheck
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/about/page.tsx
git commit -m "feat: create About page with hero section

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Implement Journey Timeline Section

**Files:**

- Modify: `src/app/(frontend)/(participant)/about/page.tsx`

**Step 1: Add Journey section after hero**

Replace the placeholder content div with the full journey section:

```typescript
{
  /* The Journey Section */
}
<section className="py-16 bg-white dark:bg-slate-900">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-12 text-center">
      The Journey
    </h2>

    {/* 2019-2022: The Beginning */}
    <div className="mb-16">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="md:w-1/2">
          <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            2019-2022: The Beginning
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            My fitness journey started during the pandemic when I bought my first bike—a mountain
            bike that opened up a whole new world. I fell in love with the sport so deeply that I
            upgraded every single part until it wasn&apos;t the bike it was before.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Eventually, I bought a second bike—this time a road bike. One for the roads, one for
            the trails. Long road rides and exciting trail rides became my escape during those
            isolated years.
          </p>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/images/about/mtb-trail.jpg"
            alt="Mountain biking on Panay trails"
            width={800}
            height={600}
            className="rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </div>

    {/* 2024: Crossfit to Running */}
    <div className="mb-16">
      <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
        <div className="md:w-1/2">
          <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            2024: Crossfit to Running
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            In 2024, I joined Ironforge Crossfit in Iloilo. That&apos;s where I learned to run—it
            was part of the routine. I started with a 3km charity run, then The Imperial Run 10km
            got me completely hooked.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            One week later, I jumped to the UP Run 21km. Then came the Bucari Extreme Trail Run—27
            grueling kilometers organized by PESEC (Philippine Extreme Sports and Events
            Collective). That trail run changed everything.
          </p>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/images/about/imperial-run.jpg"
            alt="Finishing The Imperial Run"
            width={800}
            height={600}
            className="rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </div>

    {/* 2024: Discovering Hiking */}
    <div className="mb-16">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="md:w-1/2">
          <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            2024: Discovering Hiking
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            I started hiking to prepare for the Bucari trail run. My first hike was Mt. Igatmon in
            Igbaras—I call it my &quot;mother mountain.&quot; Standing at that summit, I knew I had
            found something special.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Every weekend brought a new mountain: Mt. Napulak, Mt. Loboc, Mt. Taripis, Mt.
            Lingguhob, Mt. Opao, Mt. Pulang Lupa. I joined hiking groups—Journey Through Trails
            (JTT), Rubo-rubo lang, Five Thirsty Trekkers, and Yenergy Outdoors. I found my
            community.
          </p>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/images/about/mt-igatmon.jpg"
            alt="Summit of Mt. Igatmon, Igbaras"
            width={800}
            height={600}
            className="rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </div>

    {/* January 2025: The Turning Point */}
    <div className="mb-16">
      <div className="flex flex-col md:flex-row-reverse gap-8 items-start">
        <div className="md:w-1/2">
          <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            January 2025: The Turning Point
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            In August 2024, I signed up for the 42km Iloilo Dinagyang Marathon. My goal: finish the
            &quot;running era&quot; with a full marathon. But two days before the race, my
            grandfather passed away.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            I almost backed out. No training. Deep grief. Bad condition. But I grabbed myself and
            showed up to that race as a tribute to my late grandfather. I finished in 7:59:01—dead
            last, 159th out of 159 runners. But I finished.
          </p>
          <p className="text-gray-600 dark:text-gray-400 italic">
            &quot;When you&apos;re grieving, anything is possible.&quot;
          </p>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/images/about/marathon-stats.jpg"
            alt="42km Dinagyang Marathon finish certificate"
            width={800}
            height={600}
            className="rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </div>

    {/* Present: Builder */}
    <div className="mb-16">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="md:w-1/2">
          <h3 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
            Present: From Runner to Hiker to Builder
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            That 42km was my last run event. These days, I&apos;m hiking full-time. But I kept
            running into the same problem: finding events was a pain.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Every weekend, I&apos;d scroll through dozens of Facebook groups, DM organizers to check
            availability, compare prices manually, and hope I didn&apos;t miss registration
            deadlines. There was no central place to see what&apos;s happening in Panay Island. I
            knew there had to be a better way.
          </p>
        </div>
        <div className="md:w-1/2">
          <Image
            src="/images/about/recent-hike.jpg"
            alt="Recent hiking adventure"
            width={800}
            height={600}
            className="rounded-2xl shadow-lg"
          />
        </div>
      </div>
    </div>
  </div>
</section>;
```

**Step 2: Test timeline rendering**

```bash
pnpm dev
```

Navigate to `/about` and verify:

- ✅ All 5 timeline sections render
- ✅ Images load and display correctly
- ✅ Alternating left/right layout works
- ✅ Mobile responsive (stacks vertically)
- ✅ Dark mode colors are readable

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/about/page.tsx
git commit -m "feat: add journey timeline section to About page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Add Problem, Solution, and Vision Sections

**Files:**

- Modify: `src/app/(frontend)/(participant)/about/page.tsx`

**Step 1: Add three text sections after Journey**

```typescript
{
  /* The Problem Section */
}
<section className="py-16 bg-gray-50 dark:bg-slate-800">
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-8 text-center">
      The Problem
    </h2>
    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
      Every weekend, I&apos;d scroll through dozens of Facebook groups trying to find hiking
      events. I&apos;d DM organizers to check availability, compare prices manually, and hope I
      didn&apos;t miss registration deadlines. There was no central place to see what&apos;s
      happening in Panay Island. As both a participant and someone who wanted to support local
      organizers, I knew there had to be a better way.
    </p>
  </div>
</section>

{/* The Solution Section */}
<section className="py-16 bg-white dark:bg-slate-900">
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-8 text-center">
      The Solution
    </h2>
    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
      EventTara started as a weekend project in my apartment in Iloilo. A simple platform to find
      and book outdoor events—built by someone who lives this life, for others like me. No
      corporate backing, no big team. Just a hiker who codes and wanted to solve a problem I faced
      every week.
    </p>
  </div>
</section>

{/* The Vision Section */}
<section className="py-16 bg-gray-50 dark:bg-slate-800">
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-8 text-center">
      The Vision
    </h2>
    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
      We&apos;re starting here in Panay Island—my home trails, my community. Every mountain
      I&apos;ve climbed, every organizer I&apos;ve met, every group I&apos;ve joined. Once we prove
      it works here, we&apos;ll grow across Visayas and eventually the entire Philippines. But
      we&apos;ll always remember: we&apos;re built <em>by</em> the outdoor community, <em>for</em>{" "}
      the outdoor community.
    </p>
  </div>
</section>;
```

**Step 2: Test sections**

```bash
pnpm dev
```

Navigate to `/about` and scroll through:

- ✅ Three sections have alternating backgrounds
- ✅ Text is centered and readable
- ✅ Max width keeps text from being too wide
- ✅ Padding creates good visual rhythm

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/about/page.tsx
git commit -m "feat: add Problem, Solution, and Vision sections to About page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Add Photo Gallery Section

**Files:**

- Modify: `src/app/(frontend)/(participant)/about/page.tsx`

**Step 1: Add gallery section after Vision**

```typescript
{
  /* From the Trails - Photo Gallery */
}
<section className="py-16 bg-white dark:bg-slate-900">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4 text-center">
      From the Trails
    </h2>
    <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 text-center max-w-2xl mx-auto">
      Moments from the journey that led to EventTara
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Photo 1 */}
      <div className="relative group">
        <Image
          src="/images/about/gallery-bucari.jpg"
          alt="Bucari Extreme 27km finish line"
          width={600}
          height={400}
          className="rounded-2xl shadow-lg w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
          <p className="text-white font-medium">Bucari Extreme 27km - my first trail run</p>
        </div>
      </div>

      {/* Photo 2 */}
      <div className="relative group">
        <Image
          src="/images/about/mt-igatmon.jpg"
          alt="Mt. Igatmon summit"
          width={600}
          height={400}
          className="rounded-2xl shadow-lg w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
          <p className="text-white font-medium">Mt. Igatmon - where the hiking journey started</p>
        </div>
      </div>

      {/* Photo 3 */}
      <div className="relative group">
        <Image
          src="/images/about/gallery-mtb.jpg"
          alt="Mountain biking on Panay trails"
          width={600}
          height={400}
          className="rounded-2xl shadow-lg w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
          <p className="text-white font-medium">Early days on the trails of Panay</p>
        </div>
      </div>

      {/* Photo 4 */}
      <div className="relative group">
        <Image
          src="/images/about/marathon-stats.jpg"
          alt="42km Dinagyang Marathon stats"
          width={600}
          height={400}
          className="rounded-2xl shadow-lg w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
          <p className="text-white font-medium">42km Dinagyang Marathon - a tribute to my grandfather</p>
        </div>
      </div>

      {/* Photo 5 */}
      <div className="relative group">
        <Image
          src="/images/about/gallery-roadbike.jpg"
          alt="Road cycling along Iloilo coast"
          width={600}
          height={400}
          className="rounded-2xl shadow-lg w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
          <p className="text-white font-medium">Long rides along Iloilo&apos;s coast</p>
        </div>
      </div>

      {/* Photo 6 */}
      <div className="relative group">
        <Image
          src="/images/about/gallery-imperial.jpg"
          alt="Imperial Run with running club"
          width={600}
          height={400}
          className="rounded-2xl shadow-lg w-full h-64 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-2xl">
          <p className="text-white font-medium">With the Iloilo outdoor community</p>
        </div>
      </div>
    </div>
  </div>
</section>;
```

**Step 2: Test gallery rendering**

```bash
pnpm dev
```

Navigate to `/about` and check gallery:

- ✅ 3-column grid on desktop, 2 on tablet, 1 on mobile
- ✅ Images load with captions
- ✅ Gradient overlays make captions readable
- ✅ Rounded corners and shadows match design system

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/about/page.tsx
git commit -m "feat: add photo gallery section to About page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Add CTA Footer Section

**Files:**

- Modify: `src/app/(frontend)/(participant)/about/page.tsx`

**Step 1: Add final CTA section**

```typescript
{
  /* CTA Section */
}
<section className="py-16 bg-lime-50 dark:bg-lime-950/20">
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h2 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-4">
      Join me on this journey
    </h2>
    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
      Whether you&apos;re in Iloilo or anywhere in the Philippines, let&apos;s make finding your
      next adventure easier. Tara na!
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Link
        href="/events"
        className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors"
      >
        Browse Events
      </Link>
      <Link
        href="/contact"
        className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 border-2 border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-lime-500 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
      >
        Get in Touch
      </Link>
    </div>
  </div>
</section>;
```

**Step 2: Test CTA section**

```bash
pnpm dev
```

Navigate to `/about` and scroll to bottom:

- ✅ CTA section has lime background (matches brand)
- ✅ Two buttons are side-by-side on desktop
- ✅ Buttons stack vertically on mobile
- ✅ Links navigate correctly

**Step 3: Run full page test**

Scroll through entire About page checking:

- ✅ All sections render correctly
- ✅ Images load properly
- ✅ Text is readable in light and dark mode
- ✅ Mobile responsive layout works
- ✅ No layout shift or broken images

**Step 4: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/about/page.tsx
git commit -m "feat: add CTA section to About page

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Test and Polish

**Files:**

- Test: All modified files

**Step 1: Run full build**

```bash
pnpm build
```

Expected: Build succeeds with no errors

**Step 2: Run type check**

```bash
pnpm typecheck
```

Expected: No TypeScript errors

**Step 3: Run linter**

```bash
pnpm lint
```

Expected: No ESLint errors

**Step 4: Manual testing checklist**

Test the following scenarios:

**Homepage:**

- [ ] Hero subheading appears and is styled correctly
- [ ] Hero works with carousel images
- [ ] Hero works without carousel (fallback)
- [ ] Responsive on mobile (320px width)
- [ ] Dark mode renders correctly

**Footer:**

- [ ] New tagline appears
- [ ] About section with "Our Story" link appears
- [ ] About link navigates to `/about`
- [ ] Footer layout is balanced with 3 columns

**About Page:**

- [ ] Page loads at `/about`
- [ ] Hero image loads and displays
- [ ] All 5 timeline sections render
- [ ] Images in timeline load correctly
- [ ] Problem/Solution/Vision sections have proper backgrounds
- [ ] Photo gallery displays in grid
- [ ] Gallery images load and have captions
- [ ] CTA buttons link correctly
- [ ] Mobile responsive (test 320px, 768px, 1024px widths)
- [ ] Dark mode works throughout
- [ ] SEO metadata is correct (check page source)

**Step 5: Test image optimization**

Check Network tab in DevTools:

- [ ] Images are served as WebP (when supported)
- [ ] Images have correct sizes (not loading full-res everywhere)
- [ ] Lazy loading works (below-fold images don't load immediately)

**Step 6: Accessibility check**

- [ ] All images have alt text
- [ ] Heading hierarchy is correct (h1 → h2 → h3)
- [ ] Color contrast passes (text readable on backgrounds)
- [ ] Keyboard navigation works (can tab through links)

**Step 7: Commit any fixes**

If any issues were found and fixed:

```bash
git add .
git commit -m "fix: polish About page and homepage updates

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Final Review and Deploy

**Step 1: Review git history**

```bash
git log --oneline -10
```

Expected: Clean commit history with descriptive messages

**Step 2: Push to remote**

```bash
git push origin main
```

**Step 3: Monitor deployment**

If using Vercel/Netlify:

- Check deployment logs
- Verify build succeeds
- Check deployed site

**Step 4: Smoke test production**

Visit production URL and verify:

- [ ] Homepage hero shows new subheading
- [ ] Footer shows new tagline and About link
- [ ] `/about` page loads correctly
- [ ] All images load on production
- [ ] No console errors

**Step 5: Announce the update**

Post to social media/community:

> 🏔️ New: About Page is Live!
>
> I just added my story to EventTara—from buying my first bike during the pandemic
> to hiking every weekend in Panay Island. It's the story of why I built this
> platform and where we're going next.
>
> Check it out: [yourdomain.com/about](https://yourdomain.com/about)
>
> Tara na! 🇵🇭

---

## Summary

**What was built:**

1. ✅ Homepage hero now includes "Built by a hiker in Iloilo" subheading
2. ✅ Footer updated with Iloilo origin tagline and About link
3. ✅ New `/about` page with founder journey (5 timeline sections)
4. ✅ Photo gallery showcasing real events and adventures
5. ✅ Problem → Solution → Vision narrative
6. ✅ CTA section encouraging users to explore and connect

**Total commits:** ~11 commits

**Estimated time:** 2-3 hours (including photo prep and testing)

**Next steps:**

- Monitor About page analytics (time on page, bounce rate)
- Collect feedback from Iloilo outdoor community
- Consider adding video content in future
- Update with new photos as you attend more events
