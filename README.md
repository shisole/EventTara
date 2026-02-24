# EventTara

Adventure event booking platform for the Philippines. Browse, book, and manage outdoor events — hiking, mountain biking, road biking, running, and trail running.

**Tara na!** _(Let's go!)_

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 19
- **Database & Auth:** Supabase
- **CMS:** Payload CMS v3
- **Styling:** Tailwind CSS
- **Email:** Resend
- **AI:** Anthropic Claude SDK

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Fill in your keys:

| Variable                        | Required | Where to get it                                                          |
| ------------------------------- | -------- | ------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Yes      | Supabase Dashboard > Settings > API                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes      | Supabase Dashboard > Settings > API                                      |
| `RESEND_API_KEY`                | No       | [resend.com](https://resend.com) — emails are skipped if absent          |
| `ANTHROPIC_API_KEY`             | No       | [console.anthropic.com](https://console.anthropic.com) — for AI features |
| `SUPABASE_SERVICE_ROLE_KEY`     | No       | Supabase Dashboard > Settings > API — only for seed scripts              |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### 4. Seed the database (optional)

Populate the database with test accounts, events, guides, badges, and bookings:

```bash
npm run seed
```

To remove seeded data:

```bash
npm run unseed
```

> Both require `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start development server (port 3001) |
| `npm run build`    | Production build                     |
| `npm run start`    | Start production server              |
| `npm run lint`     | Run ESLint                           |
| `npm run seed`     | Seed database with test data         |
| `npm run unseed`   | Remove seeded data                   |
| `npm run seed:cms` | Seed Payload CMS with sample pages   |
| `npm run test:e2e` | Run Playwright E2E tests             |

## Project Structure

```
src/
├── app/
│   ├── (frontend)/
│   │   ├── (auth)/          # Login, signup, guest setup
│   │   ├── (participant)/   # Events, bookings, profiles, guides, badges
│   │   ├── (organizer)/     # Dashboard, event/guide management, check-ins
│   │   └── api/             # API routes
│   ├── (payload)/           # Payload CMS admin (/admin)
│   └── page.tsx             # Landing page
├── components/
│   ├── badges/              # Badge cards and grids
│   ├── booking/             # Booking flow, auth modal, confirmation
│   ├── dashboard/           # Organizer dashboard components
│   ├── events/              # Event cards, gallery
│   ├── guides/              # Guide cards
│   ├── layout/              # Navbar, footer, splash screen
│   ├── maps/                # Map picker, event location map
│   ├── participant/         # Upcoming/past bookings
│   ├── reviews/             # Review form, review list, star rating
│   └── ui/                  # Shared UI primitives (date picker, inputs, badges)
├── lib/
│   ├── constants/           # Preset avatars, Philippine provinces
│   ├── email/               # Email sending + templates
│   ├── store/               # Redux Toolkit store
│   ├── supabase/            # Client, server, and types
│   ├── utils/               # Date formatting, helpers
│   └── utils.ts             # cn() helper
└── middleware.ts             # Session refresh
```

## User Roles

| Role            | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| **Participant** | Browse events, book spots, earn badges, review events and guides                   |
| **Organizer**   | Create events, manage guides, manage bookings, check in participants, award badges |
| **Guest**       | Anonymous browsing via Supabase anonymous auth                                     |

Creating your first event automatically upgrades your account to organizer.

## Key Features

### Events

Browse, filter, and book outdoor adventure events with infinite scroll and pagination. Events support single-day and multi-day scheduling with a visual date range picker, cover photos, map pins, badges, and reviews. Free events skip the payment step and auto-confirm participants.

### Guides (Hiking)

Organizers manage hiking guide profiles on behalf of local guides. Guides appear on hiking event detail pages and have public profile pages at `/guides/[id]` with bio, contact, ratings, events, and reviews. Participants can review guides after completing events.

### Badges

Organizers create badges for events. Participants earn badges after check-in, viewable on their profile.

### Dashboard

Organizers manage events, guides, bookings, check-ins, and payments from `/dashboard`. Organizers are redirected to the dashboard automatically on login. Event publishing shows real-time loading feedback.

## API Routes

| Endpoint                   | Method             | Description                         |
| -------------------------- | ------------------ | ----------------------------------- |
| `/api/events`              | GET, POST          | List/create events                  |
| `/api/events/[id]`         | GET, PATCH, DELETE | Manage event                        |
| `/api/events/[id]/guides`  | GET, POST, DELETE  | Event-guide linking                 |
| `/api/guides`              | GET, POST          | List/create guides                  |
| `/api/guides/[id]`         | GET, PATCH, DELETE | Manage guide                        |
| `/api/guides/[id]/reviews` | GET, POST          | Guide reviews                       |
| `/api/bookings`            | POST               | Book an event                       |
| `/api/checkins`            | POST               | Check in participant (QR or manual) |
| `/api/badges`              | GET, POST          | List or create badges               |
| `/api/badges/award`        | POST               | Award badge to participants         |

## License

Private project.
