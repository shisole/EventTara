# EventTara — Full Platform Overview

**What it is:** A Philippine outdoor adventure event booking platform for hiking, mountain biking, road biking, running, and trail running. Built as a modern full-stack web app.

**Tech stack:** Next.js 15 (App Router) + React 19 + Supabase (auth, database, storage) + Tailwind CSS. Deployed on Vercel.

---

## The Core Concept

EventTara is built around **clubs** that organize **events**. Think of it like Eventbrite meets Strava, but specifically designed for the Philippine outdoor adventure community. A club is the organizational unit — when someone creates a club, they become its owner and can start publishing events. Participants discover events through the explore page, book spots, pay via local payment methods (GCash, Maya, or cash on event day), and check in with QR codes.

---

## Event System

### Five Activity Types

Hiking, mountain biking (MTB), road biking, running, and trail running. Each event is tagged with one type, and the platform adapts — hiking events get mountain selection and guide assignment; running/biking events get distance categories.

### Multi-Distance Events

An event can offer multiple distance categories, each with its own pricing and capacity. For example, a trail run might offer 5K at 300 pesos (15 slots) and 10K at 400 pesos (20 slots). Capacity is tracked independently per distance — when the 5K fills up, you can still book the 10K.

### Mountain Database

For hiking events, organizers link mountains from a Philippine mountain database. Each mountain has a province, difficulty level (1-9 scale), and elevation in MASL. Events can link multiple mountains (multi-peak climbs), and organizers can specify route names and override difficulty ratings per mountain. There's even a badge for completing all 7 Igbaras peaks ("Igbaras Graduate").

### Event Lifecycle

Events go through draft, published, completed, and cancelled states. Only published events appear on the explore page. After an event is completed, participants who checked in can leave reviews.

### Event Routes

Organizers can attach GPS routes to events by pasting a Strava activity URL or uploading a GPX file. The route renders on an interactive Leaflet map showing the polyline, distance, and elevation gain.

### Waivers

Events can have custom waiver text that participants must accept before booking. The acceptance timestamp is recorded for legal compliance.

### Members-Only Events

Events can be restricted to club members only. Non-members see the event publicly with a badge but can't book — they're prompted to join the club first.

---

## Booking & Payment

### Booking Flow

1. Select a distance category (if the event has multiple)
2. Optionally add companions (friends who don't have accounts)
3. Choose payment method — GCash, Maya, or Cash
4. For e-wallet payments, upload a screenshot of the payment proof
5. Accept the waiver (if the event has one)
6. Receive a QR code for check-in

### Payment Methods

GCash and Maya are the dominant mobile payment platforms in the Philippines. When a participant pays via e-wallet, they upload a screenshot of their transaction, and the organizer manually verifies it from the dashboard. Cash payments are marked as pending until verified at the event.

Free events skip the payment flow entirely and auto-confirm.

### Payment Pause

A recently added feature (gated behind a feature flag). Organizers can pause online payments for an event — participants still reserve spots, but instead of paying through the platform, they're shown a contact link (the organizer's Facebook page, for example) to arrange payment directly. This was built because some organizers prefer to handle payments outside the platform, especially for smaller community events.

When payments are paused, the booking page shows a notice, the confirmation page shows the organizer's contact link and club page QR code, and the event detail page displays an "Payments offline — reserve & pay later" badge.

### Book for a Friend

After booking yourself, you can go back and book for friends. The friend booking flow skips the distance selector (since you already chose yours) and only asks for companion details. Each companion gets their own QR code for independent check-in.

### Companion System

Each booking can have multiple companions — people the booker is bringing along who may not have accounts. Companions have their own name, phone, QR code, check-in status, and can be assigned to different distance categories than the primary booker.

### Overlap Detection

The system prevents double-booking. If you try to book an event that overlaps in date with an event you've already booked, it blocks you and tells you exactly which event conflicts. It correctly excludes the current event from this check (so friend bookings for the same event work).

### Capacity Management

Two levels of capacity control:

- **Event-level:** A global max_participants cap
- **Per-distance:** Each distance category has its own cap

Both bookings and companions count toward capacity. A Supabase RPC function (`get_total_participants`) computes the accurate total including companions.

---

## Clubs

### Club Roles

Four roles with different permissions: **owner** (full control, can transfer ownership), **admin** (manage events, members, settings), **moderator** (moderate content), and **member** (participate in events, forum).

### Club Privacy

Clubs can be set to **public** (visible to everyone, events show on explore page) or **private** (hidden from non-members, events only visible to members).

### Invite System

Clubs generate shareable invite codes with optional max uses and expiration dates. Anyone with the link (`/clubs/join/[code]`) can join. Organizers can track how many times each code has been used and revoke codes.

### Claim Flow

For onboarding existing outdoor clubs, an admin generates a time-limited claim token. The club owner visits `/claim/[token]` to claim ownership of their club profile. This lets the platform pre-populate club pages before the actual organizer takes over.

### Ownership Transfer

Club ownership can be transferred to another member via the API. The current owner initiates it, and the new owner accepts.

### Club Reviews

Members can leave reviews on clubs with ratings, text, tags, and even photos. Reviews can be anonymous. This is gated behind its own feature flag.

### Club Settings

Organizers configure their club's payment info (GCash number, Maya number, Facebook page URL), activity types, logo, cover image, description, and privacy settings from the dashboard.

### Club Forum

Each club has a built-in forum with categories, threads (discussion, announcement, or poll types), and nested replies. Admins can pin and lock threads. Forum activity generates notifications.

---

## Gamification

### Badge System

19+ system badges that are automatically awarded based on milestones:

- **First activity badges:** First hike, first run, first road ride, first MTB, first trail run
- **Volume milestones:** 5, 10, 25, 50 events attended
- **Distance milestones:** 5K, 10K, 21K (half marathon), 42K (full marathon), 100K
- **Summit milestones:** 1, 3, 5, and all summits
- **Special:** All-rounder (all activity types), Strava connected, Pioneer (first check-in), first review
- **Strava-based:** Activity count milestones, cumulative distance (50K, 100K, 500K), elevation gain (5K, 10K, 29K meters — that last one is Everest height)
- **Location-specific:** Mountain-specific badges generated from the mountain database
- **Regional:** Igbaras Graduate (complete all 7 Igbaras peaks)

Events can also have custom badges that are awarded to participants.

Badges have four rarity tiers: common, rare, epic, legendary.

### Badge Sharing

Users can share earned badges to Twitter, Facebook, or copy a direct link. Each badge has a shareable page at `/badges/[id]`.

### Badge Showcase

Users select up to 5 badges to display prominently on their profile page.

### Badge QR Codes

Admins can create QR code batches for distributing badges in person — useful at events where organizers want to hand out physical QR cards that participants scan to claim digital badges.

### Avatar Borders

Decorative borders around user avatars, earned through achievements. Borders have criteria like event count, specific activity types, club participation, signup date, and mountain regions. Four tiers: common, rare, epic, legendary. Users set one active border that displays everywhere their avatar appears.

### TaraTokens (Virtual Currency)

An in-app virtual currency. Users earn tokens through:

- Check-in: 50 tokens
- Hosting an event: 100 tokens
- Daily login: 5 tokens
- Streak bonus: 25 tokens
- Earning badges: 50-200 tokens (based on rarity)
- First event: 100 tokens
- Signup: 50 tokens
- Completing the quiz: 25 tokens

Login streaks are tracked — consecutive daily logins earn bonus tokens.

### Avatar Shop

A cosmetic shop where users spend TaraTokens on:

- **Animals:** Collectible animal avatars
- **Accessories:** Add-ons for avatars
- **Backgrounds:** Custom avatar backgrounds
- **Borders:** Purchasable borders (beyond the earned ones)
- **Skins:** Avatar color variations

Each item has a rarity tier and price in tokens. Users can equip one of each category.

### Duck Race

A raffle-style feature where clubs run timed "duck races." Participants enter, and after the timer expires, random winners are selected. Winners can receive badge awards. This is gated behind a feature flag.

### Leaderboards

Rankings by event count, total distance, and elevation gain. Displayed on the `/achievements` page.

---

## Social Feed

The platform has a social activity feed at `/feed` where user activity is automatically posted.

### Activity Types

- **Booking:** When someone books an event
- **Check-in:** When someone checks in at an event
- **Badge:** When someone earns a badge
- **Border:** When someone earns an avatar border
- **Review:** When someone posts a review

### Social Features

- **Reactions:** Heart/like on posts
- **Comments:** Text comments on posts, with @mention support
- **Comment Likes:** Like individual comments
- **Reposts:** Share someone else's activity
- **Follows:** Follow other users to see their activity
- **Individual Posts:** Each activity has its own page at `/post/[id]`

---

## Strava Integration

### Authentication

"Continue with Strava" as a login/signup option. Users can also connect an existing account to Strava from their profile settings.

### Activity Linking

Two ways to link Strava activities to event bookings:

1. **Manual:** Users browse their recent Strava activities and link one to a booking
2. **Automatic:** A Strava webhook listener auto-matches activities based on timing and distance proximity

### Profile Enrichment

Connected users get a **Strava Stats Bar** on their profile showing total distance, activity count, and elevation gain. A **Strava Activity Feed** shows recent activities.

### Route Sharing for Organizers

Event organizers can paste a Strava activity URL to extract the route polyline, or upload a GPX file directly. The route displays on an interactive Leaflet map on the event detail page.

### Token Management

OAuth tokens are stored with automatic refresh. The client helper (`getStravaClient`) handles token refresh transparently.

---

## AI Chat Assistant (Coco)

A floating chat bubble appears on every page. Users can ask questions about events, the platform, or outdoor activities. Powered by Anthropic Claude. The chat panel slides up from the bottom of the screen. Queries are logged for analytics.

---

## Notification System

### Notification Types

- Booking confirmed / spot reserved
- Event reminders (day-of via cron job)
- Badge earned
- Border earned
- Feed interactions (like, repost, comment like, mention)
- Review request (after event completion)
- Event published (to followers)
- Forum replies and mentions

### Delivery Channels

- **In-app:** Bell icon with unread count
- **Push:** Web push notifications via Service Worker
- **Email:** Transactional emails via Resend for key events (booking confirmation, badge awards, payment rejection, event reminders, review requests)

---

## Authentication

### Login Methods

- Email/password signup
- Google OAuth
- Strava OAuth
- Facebook OAuth
- Anonymous guest mode (Supabase `signInAnonymously`)

OAuth providers are individually toggleable via feature flags.

### Guest Flow

Anonymous users can browse and interact, then are funneled through `/guest-setup` to create a real account. Guest accounts are automatically promoted when they complete setup.

### User Roles

Four roles: **user** (default), **participant** (has booked events), **organizer** (owns a club), **guest** (anonymous).

### Username System

Usernames are auto-generated if not set during signup. Users can change their username via `/setup-username`. Availability is checked in real-time. Reserved usernames (admin, api, etc.) are blocked.

---

## User Profiles

Profiles display:

- Full name and username
- Avatar with active border
- Badge showcase (top 5 selected badges)
- Strava stats bar (if connected)
- Recent Strava activities
- Follow/following counts
- Event history and activity breakdown by type
- Leaderboard ranking

---

## Guide System

For hiking events, organizers can assign professional guides from a guide database. Each guide has a profile (name, bio, avatar, contact), and participants can leave guide-specific reviews with ratings. Guide cards appear on the event detail page.

---

## Admin Panel

Accessible at `/admin` for platform administrators:

- **Feature Flags:** Toggle any of the 18 feature flags on/off
- **Hero Carousel:** Manage hero slides (desktop + mobile image URLs)
- **Homepage Sections:** Reorder and toggle visibility of 11 homepage sections
- **Clubs Management:** View all clubs, generate claim tokens, transfer ownership
- **QR Badge Batches:** Create batches of QR codes for distributing badges at physical events

---

## CMS

Content management is handled through Supabase tables (no separate CMS tool needed):

- **Site Settings:** Site name, tagline, SEO metadata, navigation layout
- **Navigation:** Header links, footer sections, legal links (all JSONB)
- **Hero Carousel:** Slide images with mobile variants
- **Homepage Sections:** Configurable section order and visibility
- **Dynamic Pages:** Privacy policy, terms, data deletion pages with HTML content
- **Feature Flags:** 18 toggleable boolean flags

All CMS data is cached with staggered revalidation (30-300 seconds) for performance.

---

## Welcome Pages

Custom branded landing pages at `/welcome/[code]` that clubs can create for onboarding campaigns. Each welcome page can:

- Display custom messaging
- Redirect to the club page
- Award a badge on claim
- Track claim count with optional max claims and expiration

---

## SEO & Sharing

- Dynamic metadata on all pages via Next.js `generateMetadata()`
- Auto-generated OpenGraph images
- JSON-LD structured data on event pages (Event schema, BreadcrumbList)
- Dynamic sitemap at `/sitemap.xml`
- Robots.txt configuration
- Badge sharing to Twitter, Facebook, and direct link copy

---

## Email Templates

Nine transactional email templates via Resend:

1. **Booking Confirmation** — Event details + QR code
2. **Badge Awarded** — Badge image + share link
3. **Badges Earned** — Batch notification for multiple badges
4. **Event Published** — Notify followers of new events
5. **Event Reminder** — Day-of reminder
6. **Payment Rejected** — Organizer rejected payment proof
7. **Review Request** — After event completion
8. **Contact Inquiry** — From the contact page
9. **Waitlist Confirmation** — Organizer waitlist signup

If the email service isn't configured, emails are silently skipped with a warning log.

---

## Testing

- **Unit Tests:** Vitest — business logic, utilities, validation, constants
- **E2E Tests:** Playwright — user-facing workflows (Chromium only)
- **CI Pipeline:** format check → lint → typecheck → unit tests → build. E2E runs on push to main.
- **Pre-commit Hooks:** Husky + lint-staged automatically formats and lints staged files.

---

## What Makes It Different

1. **Philippine-focused:** GCash/Maya payments, Philippine mountain database, local community features
2. **Club-first model:** Organizations own events, not individuals — better for real outdoor groups
3. **Deep Strava integration:** Not just a link — full OAuth, webhook-driven activity matching, route sharing
4. **Gamification layer:** Badges, borders, tokens, avatar shop, leaderboards — keeps participants engaged between events
5. **Companion booking:** Book for friends who don't have accounts, with per-companion QR codes and distance selection
6. **Feature flag everything:** 18 flags let the team ship features incrementally and roll back without deploys
7. **Built-in AI:** Coco chat assistant on every page for instant help
8. **CMS without a CMS:** All content managed through Supabase tables — no separate admin tool to maintain
