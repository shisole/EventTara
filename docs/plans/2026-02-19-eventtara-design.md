# EventTara Design Document

**Date:** 2026-02-19
**Status:** Approved

## 1. Product Overview & Brand

**EventTara** is a SaaS platform for adventure event organizers in the Philippines, with plans for international expansion.

**Tagline:** *"Tara na! — Book Your Next Adventure"*
("Tara" means "Let's go!" in Tagalog)

### User Types

- **Organizers** — Create and manage adventure events (hiking, MTB, road biking, running, trail running). Free during beta; subscription tiers introduced post-beta based on usage data.
- **Participants** — Discover events, book spots, collect achievement badges, share public profiles. Always free in MVP. Premium participant tier is a future monetization path.

### Brand Direction

- **Vibe:** Fun & Community — warm, inviting, approachable
- **Primary color:** Warm orange/coral (energy, adventure)
- **Secondary:** Forest green (nature, outdoors)
- **Accent:** Golden yellow (achievement, badges)
- **Neutrals:** Warm grays, cream backgrounds
- **UI style:** Rounded corners, friendly typography, community-first feel

## 2. Architecture & Tech Stack

### Stack

- **Next.js 14** (App Router) — SSR/SSG, deployed on Vercel
- **Tailwind CSS** — Styling + design system
- **Supabase** — Auth, Postgres DB, Storage, Real-time
- **Redux RTK** — Client state management + RTK Query for API caching

### Architecture

Monolithic Next.js app with route groups for separation of concerns. Single deployment on Vercel. Supabase handles backend concerns (auth, DB, storage, real-time).

### Route Structure

```
/                            → Landing page (public)
/(auth)/login|signup         → Auth flows
/(participant)/
  /events                   → Browse/discover events
  /events/[id]              → Event detail + booking
  /profile/[username]       → Public profile + badges
  /my-events                → My bookings & badges
/(organizer)/
  /dashboard                → Organizer home (stats, upcoming)
  /dashboard/events         → Manage events (CRUD)
  /dashboard/events/[id]    → Event management (participants, check-ins, badges)
  /dashboard/settings       → Org profile, payment settings
```

### Authentication (3 Tiers)

1. **Facebook Login** (primary) — One-tap via Supabase OAuth, auto-pulls name + avatar
2. **Email + Password** (fallback) — Standard auth for non-Facebook users
3. **Guest Mode** — Pick from adventure-themed preset avatars + display name. Can browse and book events. Badges earned but ephemeral until account is created. Natural conversion funnel to full signup.

**Preset avatars:** Adventure-themed illustrations (mountain goat, eagle, biker, runner, hiker, etc.) — available to guests AND registered users who prefer not to use a real photo.

**Auth flow:** Login/Signup → Complete profile (choose username, set role) → Redirect to events or dashboard.

## 3. Database Schema

### Core Tables

```sql
-- Users
users
  id UUID PK
  email TEXT (nullable for guests)
  full_name TEXT
  username TEXT UNIQUE
  avatar_url TEXT
  role TEXT (organizer | participant | guest)
  is_guest BOOLEAN DEFAULT false
  created_at TIMESTAMPTZ

-- Organizer profiles (extends users with role=organizer)
organizer_profiles
  id UUID PK
  user_id UUID FK → users
  org_name TEXT
  description TEXT
  logo_url TEXT
  payment_info JSONB (GCash/Maya details)

-- Events
events
  id UUID PK
  organizer_id UUID FK → organizer_profiles
  title TEXT
  description TEXT
  type TEXT (hiking | mtb | road_bike | running | trail_run)
  date TIMESTAMPTZ
  location TEXT
  coordinates POINT
  max_participants INT
  price DECIMAL
  status TEXT (draft | published | completed | cancelled)
  cover_image_url TEXT
  created_at TIMESTAMPTZ

-- Event photo gallery
event_photos
  id UUID PK
  event_id UUID FK → events
  image_url TEXT
  caption TEXT (nullable)
  sort_order INT
  uploaded_at TIMESTAMPTZ

-- Bookings
bookings
  id UUID PK
  event_id UUID FK → events
  user_id UUID FK → users
  status TEXT (pending | confirmed | cancelled)
  payment_status TEXT (pending | paid | refunded)
  payment_method TEXT (gcash | maya)
  qr_code TEXT
  booked_at TIMESTAMPTZ

-- Badges
badges
  id UUID PK
  event_id UUID FK → events
  title TEXT
  description TEXT
  image_url TEXT
  created_at TIMESTAMPTZ

-- User badge collection
user_badges
  id UUID PK
  user_id UUID FK → users
  badge_id UUID FK → badges
  awarded_at TIMESTAMPTZ

-- Event check-ins
event_checkins
  id UUID PK
  event_id UUID FK → events
  user_id UUID FK → users
  checked_in_at TIMESTAMPTZ
  method TEXT (qr | manual)
```

## 4. Features & UI (MVP)

### Landing Page (`/`)
- Hero: Bold tagline with adventure action shot background
- Upcoming events carousel (filterable by type)
- How it works: 3-step visual (Browse → Book → Adventure!)
- Social proof: badge stats, testimonials
- CTAs: "Explore Events" / "List Your Event"
- Beta badge visible

### Event Discovery (`/events`)
- Grid/list of published events with cover photos
- Filters: event type, date range, location, price range
- Search bar
- Event cards: cover image, title, type tag, date, location, price, spots remaining

### Event Detail (`/events/[id]`)
- Hero cover image
- Event info: title, description, date/time, location with map pin, price, spots left
- Past event photo gallery (carousel/grid)
- Organizer card (name, logo, past events count)
- "Book Now" CTA
- Social proof ("23 adventurers joined!")

### Booking Flow
- Select spots → Pay via GCash/Maya → Confirmation
- Guests: pick avatar + display name before payment
- Confirmation with event details + QR code for check-in

### Organizer Dashboard (`/dashboard`)
- Overview: upcoming events, total bookings, recent activity
- Events CRUD: create/edit/publish/cancel
  - Form: title, description, type, date, location, price, max participants, cover image, gallery photos
- Participant management: per-event list, check-in status, payment status
- Badge management: create badge (upload or template), bulk-award post-event
- Check-in tool: QR scanner for event day
- Settings: profile, payment info

### Participant Profile (`/profile/[username]`)
- Public: avatar, display name, badge collection grid, events joined count
- Stats: total events, type breakdown
- Shareable link for social media
- "Join EventTara" CTA for visitors

### My Events (`/my-events`)
- Upcoming bookings with QR codes
- Past events with earned badges

## 5. Gamification: Badge System

### How It Works
1. Organizer creates a badge when creating/editing an event (upload custom design or use template)
2. During event: participants scan QR code to check in
3. After event: organizer sees participant list with check-in status
4. Organizer filters (exclude no-shows) → bulk-awards badges
5. Badges appear on participant profiles immediately

### Badge Display
- Profile page: grid of all earned badges
- Each badge shows: event name, date, badge image
- Publicly visible and shareable

## 6. Integrations

- **Supabase Auth** — Facebook OAuth + Email/Password + Anonymous sessions
- **Supabase Storage** — Event images, gallery photos, badge images, preset avatars
- **GCash / Maya** — Payment collection for bookings
- **QR Code** — `qrcode.react` for generation, device camera for scanning
- **Email** — Booking confirmation, event reminders, badge awarded (Resend or similar)

## 7. Deployment

- **Vercel** — Next.js hosting, auto-deploy from Git
- **Supabase Cloud** — Managed Postgres, Auth, Storage, Real-time
- **Domain** — `eventtara.com` (or `.ph`)
- **CDN** — Vercel Edge + Supabase Storage CDN

## 8. MVP Phases

1. **Phase 1: Core** — Auth, events CRUD, event pages, booking flow
2. **Phase 2: Gamification** — Badges, profiles, QR check-in, badge awarding
3. **Phase 3: Polish** — Gallery photos, notifications, responsive mobile UX
4. **Phase 4: Beta Launch** — Invite 3-5 organizers, real events, gather feedback

## 9. Future Roadmap (Post-Beta)

- Participant premium subscriptions
- Route/trail mapping with interactive maps
- Mobile app (React Native)
- Organizer subscription tiers
- Event reviews/ratings
- Leaderboards & seasonal challenges
- Google login
- International expansion
