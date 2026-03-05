# Iloilo Origin Story Messaging - Design Document

**Date:** 2026-03-05
**Author:** Claude (with Stephen Karl Jeoffrey Hisole)
**Status:** Approved

## Overview

Add authentic "Started in Iloilo" messaging throughout EventTara to establish local credibility, build trust with the Iloilo/Panay outdoor community, and tell the genuine founder story behind the platform.

## Problem Statement

EventTara currently presents as a generic national platform without showcasing its authentic roots in the Iloilo outdoor community. The founder (Stephen) has a compelling personal journey through hiking, biking, and running in Panay Island, but this story isn't visible to users. This lack of local authenticity makes it harder to build trust and community in the initial target market (Iloilo/Visayas).

## Goals

1. **Establish local credibility** - Show that EventTara is built by someone embedded in the Iloilo outdoor community
2. **Build emotional connection** - Tell a genuine, relatable story that resonates with adventurers
3. **Differentiate from competitors** - Most platforms are impersonal; EventTara has a real founder story
4. **Support local-first growth strategy** - Align messaging with the decision to dominate Panay/Visayas before expanding nationally

## Target Audience

- Primary: Hikers, runners, and cyclists in Iloilo and Panay Island
- Secondary: Outdoor enthusiasts across Visayas and eventually Philippines-wide
- Organizers who want to work with someone who understands their community

## Design Approach

### Tone & Voice

**Humble and community-focused:**

- "Built by a hiker in Iloilo for adventurers across the Philippines"
- Emphasizes grassroots, authentic origins
- No corporate speak or pretense
- Solo maker narrative (not "team" or "we")

### Implementation Areas

#### 1. Homepage Hero Section

**Current:**

```
Tara na!
Book Your Next Adventure. Discover hiking, biking, running events
and more across the Philippines.
```

**New:**

```
Tara na!
[Subheading below main text:]
Built by a hiker in Iloilo for adventurers across the Philippines

[Main description stays the same]
```

**Visual treatment:**

- Subheading in smaller text
- Subtle styling (not competing with main CTA)
- Positioned between logo/title and description

#### 2. Footer

**Current tagline:**

```
Tara na! — Your adventure starts here.
```

**New tagline:**

```
Started in Iloilo, built for adventurers nationwide 🇵🇭
```

**Navigation addition:**

- Add "About" link to footer navigation
- Place in "Explore" or "For Organizers" section
- Links to `/about` page

#### 3. New About Page (`/about`)

**Route:** `/src/app/(frontend)/(participant)/about/page.tsx`

**SEO Metadata:**

```
title: "About EventTara - Built by a Hiker in Iloilo"
description: "The story of how EventTara started from one hiker's journey
through Panay Island's trails and became a platform for adventurers
across the Philippines."
```

**Page Structure:**

##### Hero Section

- Full-width hero image (one of Stephen's trail/summit photos)
- Overlay with title and subtitle:
  - **Title:** "From Two Bikes to Every Mountain"
  - **Subtitle:** "How one hiker's journey through Iloilo's trails became EventTara"

##### Section 1: The Journey (Narrative Timeline)

**Story arc in 5 subsections with photos:**

**2019-2022: The Beginning**

- Started fitness journey during pandemic
- Bought first bike (MTB)
- Fell in love with the sport
- Upgraded every part until it wasn't the same bike
- Bought second bike (road bike) - one for roads, one for trails
- Photo: MTB trail ride or road bike coastal ride

**2024: Crossfit to Running**

- Started at Ironforge Crossfit in Iloilo
- Learned to run as part of training
- First event: 3km charity run
- The Imperial Run 10km - got hooked
- Jumped to UP Run 21km after a week
- Bucari Extreme Trail Run 27km (organized by PESEC)
- Photo: Imperial Run finisher or Bucari Extreme finish line

**2024: Discovering Hiking**

- Started hiking to prepare for Bucari trail run
- First hike: Mt. Igatmon in Igbaras - "my mother mountain"
- Every weekend brought a new summit:
  - Mt. Napulak, Mt. Loboc, Mt. Taripis, Mt. Lingguhob, Mt. Opao, Mt. Pulang Lupa
- Joined hiking groups: Journey Through Trails (JTT), Rubo-rubo lang, Five Thirsty Trekkers, Yenergy Outdoors
- Photo: Mt. Igatmon summit or group hike photo

**January 2025: The Turning Point**

- Signed up for 42km Iloilo Dinagyang Marathon (August 2024)
- Goal: finish the "running era" with a full marathon
- Two days before the race: grandfather passed away
- Almost backed out due to grief and lack of training
- Decided to show up as a tribute to his late grandfather
- Finished in 7:59:01 (last place, 159/159) - but finished
- Quote: "When you're grieving, anything is possible"
- Photo: Marathon finisher certificate or post-race photo

**Present: From Runner to Hiker to Builder**

- That 42km was the last run event
- Now hiking full-time
- Found himself spending hours searching Facebook for events
- DM-ing organizers, comparing prices, checking dates
- No central place to see what's happening in Panay
- "I knew there had to be a better way"
- Photo: Recent hike or candid working on laptop

##### Section 2: The Problem

**Short, relatable paragraph:**

```
Every weekend, I'd scroll through dozens of Facebook groups trying to
find hiking events. I'd DM organizers to check availability, compare
prices manually, and hope I didn't miss registration deadlines. There
was no central place to see what's happening in Panay Island. As both
a participant and someone who wanted to support local organizers, I
knew there had to be a better way.
```

##### Section 3: The Solution

**Brief explanation of EventTara's origin:**

```
EventTara started as a weekend project in my apartment in Iloilo. A
simple platform to find and book outdoor events - built by someone who
lives this life, for others like me. No corporate backing, no big team.
Just a hiker who codes and wanted to solve a problem I faced every week.
```

##### Section 4: The Vision

**Local-first growth strategy:**

```
We're starting here in Panay Island - my home trails, my community.
Every mountain I've climbed, every organizer I've met, every group I've
joined. Once we prove it works here, we'll grow across Visayas and
eventually the entire Philippines. But we'll always remember: we're
built *by* the outdoor community, *for* the outdoor community.
```

##### Section 5: From the Trails (Photo Gallery)

**Grid layout (2-3 columns) with captioned photos:**

Photos to include:

1. Bucari Extreme finish line with other participants
   - Caption: "Bucari Extreme 27km - my first trail run"
2. Mt. Igatmon summit photo
   - Caption: "Mt. Igatmon - where the hiking journey started"
3. MTB trail ride action shot
   - Caption: "Early days on the trails of Panay"
4. Marathon finish certificate/stats
   - Caption: "42km Dinagyang Marathon - a tribute to my grandfather"
5. Road bike coastal ride
   - Caption: "Long rides along Iloilo's coast"
6. Recent group hike photo
   - Caption: "With the Iloilo hiking community"

**Technical specs:**

- Use Next.js Image component
- Lazy loading for below-the-fold images
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Each photo in rounded card with caption overlay or below
- Lightbox/modal on click for full-size view (optional enhancement)

##### Footer CTA Section

**Centered call-to-action:**

```
Join me on this journey

Whether you're in Iloilo or anywhere in the Philippines, let's make
finding your next adventure easier. Tara na!

[Button: Browse Events]  [Button: Contact]
```

### Image Assets

**Required photos** (to be provided by Stephen):

1. Hero image - trail or summit photo (landscape, high-res)
2. MTB trail ride
3. Imperial Run or Bucari Extreme finish
4. Mt. Igatmon summit
5. Marathon certificate/stats (cropped for readability)
6. Road bike coastal ride
7. Recent group hike

**Image specifications:**

- Format: JPEG or WebP
- Minimum width: 1200px for hero, 800px for others
- Aspect ratio: 16:9 for hero, flexible for gallery
- Optimization: Use Next.js Image with quality={85}

### Technical Implementation

#### New Route

- Path: `src/app/(frontend)/(participant)/about/page.tsx`
- Layout: Uses existing `(participant)` layout (navbar + footer)
- Type: Server Component (for SEO)

#### Component Structure

```
AboutPage (Server Component)
├─ HeroSection (image + title overlay)
├─ JourneySection (timeline with photos)
│  ├─ TimelineItem × 5
│  └─ Each with text + image
├─ ProblemSection (single paragraph)
├─ SolutionSection (single paragraph)
├─ VisionSection (single paragraph)
├─ PhotoGallery (grid of images)
│  └─ GalleryImage × 6
└─ CTASection (centered with buttons)
```

#### Styling Approach

- Consistent with existing EventTara design system
- Use Tailwind utility classes
- Section padding: `py-12 md:py-16`
- Max width: `max-w-4xl mx-auto` for text content
- Max width: `max-w-7xl mx-auto` for photo gallery
- Timeline visual: Left-aligned with accent border or icons (simple, not complex)

#### Accessibility

- All images have descriptive alt text
- Semantic HTML structure (h1, h2, p, section)
- Proper heading hierarchy
- Focus states on interactive elements
- Image captions associated with images

### Content Writing Guidelines

**Tone:**

- First-person narrative ("I started", "my journey")
- Conversational but not overly casual
- Authentic and humble (no bragging)
- Emotional beats: vulnerability (grief), determination (finishing last), passion (outdoor community)

**Length:**

- Each timeline section: 3-4 sentences
- Problem/Solution/Vision: 2-3 sentences each
- Total word count: ~800-1000 words

**Keywords for SEO:**

- Iloilo hiking, Panay Island outdoor events, Mt. Igatmon
- EventTara founder, hiking platform Philippines
- Visayas adventure events, Iloilo trail running

### SEO & Meta Tags

```typescript
export const metadata = {
  title: "About EventTara - Built by a Hiker in Iloilo | Stephen Hisole",
  description:
    "The story of how EventTara started from one hiker's journey through Panay Island's trails - from Mt. Igatmon to building a platform for adventurers across the Philippines.",
  openGraph: {
    title: "About EventTara - Built by a Hiker in Iloilo",
    description: "From two bikes to every mountain - the story behind EventTara.",
    images: ["/images/about-og.jpg"], // Hero image
  },
};
```

### Analytics & Tracking

**Events to track:**

- Page views on `/about`
- Scroll depth (did they read the full story?)
- Photo gallery interactions
- CTA button clicks (Browse Events, Contact)
- Time on page

## Non-Goals (Out of Scope)

- ❌ Adding founder photo to homepage
- ❌ Creating a team page (solo founder)
- ❌ Adding blog or news section
- ❌ Video content (just photos for now)
- ❌ Interactive timeline component (keep it simple)
- ❌ Testimonials from other hikers (focus on founder story first)

## Success Metrics

**Qualitative:**

- Positive feedback from Iloilo outdoor community
- Organizers mentioning they appreciate the local connection
- Users saying they trust the platform more after reading the story

**Quantitative:**

- 30%+ of new users visit About page (within first 3 sessions)
- Average time on About page: 2+ minutes
- Bounce rate on About page: <40%
- Increase in sign-ups from Iloilo/Panay region

## Future Enhancements (Post-Launch)

1. **User Stories Section:** Add testimonials from early Iloilo users
2. **Video Content:** Short documentary-style video of Stephen on a hike
3. **Community Section:** Showcase the hiking groups/organizers
4. **Interactive Map:** Show all the mountains Stephen has climbed
5. **Blog/Journal:** Regular updates from the trails as the platform grows

## Open Questions

- ✅ Should we add a "Meet the Team" section? → No, solo founder story
- ✅ Tone: humble vs. proud? → Humble and community-focused
- ✅ Homepage section or dedicated page? → Dedicated About page only
- ✅ Add About link to navbar? → No, footer only

## Approval

**Design approved by:** Stephen Karl Jeoffrey Hisole
**Date:** 2026-03-05

**Next steps:**

1. Gather and optimize photo assets
2. Write detailed copy for each section
3. Create implementation plan
4. Build the About page
5. Update homepage hero and footer
6. Test on mobile and desktop
7. Deploy and announce to community
