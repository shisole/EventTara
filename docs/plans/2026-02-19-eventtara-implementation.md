# EventTara Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build EventTara, an adventure event booking SaaS platform for Philippine organizers with gamified badge system for participants.

**Architecture:** Monolithic Next.js 14 App Router application with Supabase for auth/DB/storage, Redux RTK for client state, and Tailwind CSS for styling. Route groups separate organizer dashboard from participant-facing pages.

**Tech Stack:** Next.js 14, Tailwind CSS, Supabase (Auth, Postgres, Storage), Redux RTK + RTK Query, qrcode.react, html5-qrcode

**Design Doc:** `docs/plans/2026-02-19-eventtara-design.md`

---

## Phase 1: Project Foundation

### Task 1: Scaffold Next.js Project

**Files:**

- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Create Next.js app with TypeScript and Tailwind**

Run:

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Project scaffolded with Next.js 14, TypeScript, Tailwind, App Router, `src/` directory.

**Step 2: Verify project runs**

Run: `npm run dev`
Expected: Dev server starts at localhost:3000, default Next.js page renders.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 project with TypeScript and Tailwind"
```

---

### Task 2: Configure Tailwind Design System (Brand Colors & Theme)

**Files:**

- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

**Step 1: Update Tailwind config with EventTara brand tokens**

In `tailwind.config.ts`, extend the theme:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: {
          50: "#fff5f2",
          100: "#ffe8e0",
          200: "#ffd0c2",
          300: "#ffab94",
          400: "#ff7f5c",
          500: "#ff5a2d",
          600: "#e84420",
          700: "#c13416",
          800: "#9c2c15",
          900: "#7e2816",
        },
        forest: {
          50: "#f0faf4",
          100: "#dbf2e3",
          200: "#bae5cb",
          300: "#8bd1a8",
          400: "#56b57d",
          500: "#34995e",
          600: "#247a4a",
          700: "#1e623d",
          800: "#1b4e33",
          900: "#17402b",
        },
        golden: {
          50: "#fffdf0",
          100: "#fff8d4",
          200: "#ffefa8",
          300: "#ffe270",
          400: "#ffd040",
          500: "#f5b800",
          600: "#d49400",
          700: "#a96c00",
          800: "#8a5500",
          900: "#724600",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 2: Update globals.css with base styles**

In `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-white text-gray-900 antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply bg-coral-500 hover:bg-coral-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors;
  }
  .btn-secondary {
    @apply bg-forest-500 hover:bg-forest-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors;
  }
  .btn-outline {
    @apply border-2 border-coral-500 text-coral-500 hover:bg-coral-50 font-semibold py-3 px-6 rounded-xl transition-colors;
  }
  .card {
    @apply bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow;
  }
}
```

**Step 3: Verify styles work**

Update `src/app/page.tsx` to a simple test page with brand colors:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-coral-500">EventTara</h1>
        <p className="text-xl text-gray-600">Tara na! — Book Your Next Adventure</p>
        <div className="flex gap-4 justify-center">
          <button className="btn-primary">Explore Events</button>
          <button className="btn-secondary">List Your Event</button>
        </div>
      </div>
    </main>
  );
}
```

Run: `npm run dev` — verify coral/forest colors render correctly.

**Step 4: Install fonts**

Run: `npm install @next/font`

Note: We'll use `next/font/google` for Inter (body) and Plus Jakarta Sans (headings). Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "EventTara — Tara na! Book Your Next Adventure",
  description:
    "EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

**Step 5: Commit**

```bash
git add tailwind.config.ts src/app/globals.css src/app/page.tsx src/app/layout.tsx
git commit -m "feat: configure Tailwind design system with EventTara brand colors and fonts"
```

---

### Task 3: Install and Configure Supabase Client

**Files:**

- Create: `src/lib/supabase/client.ts` (browser client)
- Create: `src/lib/supabase/server.ts` (server client)
- Create: `src/lib/supabase/middleware.ts` (auth middleware)
- Create: `src/middleware.ts` (Next.js middleware)
- Create: `.env.local.example`

**Step 1: Install Supabase packages**

Run:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Step 2: Create environment variable template**

Create `.env.local.example`:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Also create `.env.local` with actual values from your Supabase project dashboard (Settings > API).

Add `.env.local` to `.gitignore` if not already there.

**Step 3: Create browser Supabase client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

**Step 4: Create server Supabase client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method is called from a Server Component
            // which cannot set cookies. This can be ignored if middleware
            // refreshes user sessions.
          }
        },
      },
    },
  );
}
```

**Step 5: Create Supabase auth middleware**

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

**Step 6: Create Next.js middleware**

Create `src/middleware.ts`:

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

**Step 7: Verify dev server still runs**

Run: `npm run dev`
Expected: No errors (Supabase won't connect without real env vars, but app should still load).

**Step 8: Commit**

```bash
git add src/lib/supabase/ src/middleware.ts .env.local.example .gitignore
git commit -m "feat: configure Supabase client (browser, server, middleware)"
```

---

### Task 4: Install and Configure Redux RTK

**Files:**

- Create: `src/lib/store/store.ts`
- Create: `src/lib/store/hooks.ts`
- Create: `src/lib/store/provider.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Install Redux RTK**

Run:

```bash
npm install @reduxjs/toolkit react-redux
```

**Step 2: Create Redux store**

Create `src/lib/store/store.ts`:

```typescript
import { configureStore } from "@reduxjs/toolkit";

export const makeStore = () => {
  return configureStore({
    reducer: {
      // Slices will be added here as features are built
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
```

**Step 3: Create typed hooks**

Create `src/lib/store/hooks.ts`:

```typescript
import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, AppStore, RootState } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
```

**Step 4: Create store provider**

Create `src/lib/store/provider.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "./store";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>(undefined);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
```

**Step 5: Wrap app with StoreProvider**

Update `src/app/layout.tsx` — wrap `{children}` with `<StoreProvider>`:

```tsx
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import StoreProvider from "@/lib/store/provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "EventTara — Tara na! Book Your Next Adventure",
  description:
    "EventTara is an adventure event booking platform for hiking, mountain biking, road biking, running, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className="font-sans">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
```

**Step 6: Verify dev server runs**

Run: `npm run dev`
Expected: App loads without errors.

**Step 7: Commit**

```bash
git add src/lib/store/ src/app/layout.tsx package.json package-lock.json
git commit -m "feat: configure Redux RTK store with typed hooks and provider"
```

---

### Task 5: Set Up Supabase Database Schema

**Files:**

- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create the migration file**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('organizer', 'participant', 'guest')),
  is_guest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizer profiles
CREATE TABLE public.organizer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  payment_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Events
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.organizer_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('hiking', 'mtb', 'road_bike', 'running', 'trail_run')),
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  coordinates POINT,
  max_participants INT NOT NULL DEFAULT 50,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
  cover_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event photo gallery
CREATE TABLE public.event_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('gcash', 'maya')),
  qr_code TEXT,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Badges
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- User badge collection
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Event check-ins
CREATE TABLE public.event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'qr' CHECK (method IN ('qr', 'manual')),
  UNIQUE(event_id, user_id)
);

-- Indexes for common queries
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_bookings_event ON public.bookings(event_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_event_checkins_event ON public.event_checkins(event_id);
CREATE INDEX idx_event_photos_event ON public.event_photos(event_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: anyone can read public profiles, users can update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizer profiles: anyone can read, owners can manage
CREATE POLICY "Organizer profiles are viewable by everyone" ON public.organizer_profiles
  FOR SELECT USING (true);
CREATE POLICY "Organizers can manage own profile" ON public.organizer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Events: published events visible to all, organizers manage their own
CREATE POLICY "Published events are viewable by everyone" ON public.events
  FOR SELECT USING (status = 'published' OR organizer_id IN (
    SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
  ));
CREATE POLICY "Organizers can manage own events" ON public.events
  FOR ALL USING (organizer_id IN (
    SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
  ));

-- Event photos: viewable if event is published, organizer can manage
CREATE POLICY "Event photos viewable with event" ON public.event_photos
  FOR SELECT USING (event_id IN (
    SELECT id FROM public.events WHERE status = 'published'
  ));
CREATE POLICY "Organizers can manage event photos" ON public.event_photos
  FOR ALL USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));

-- Bookings: users see own bookings, organizers see bookings for their events
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view event bookings" ON public.bookings
  FOR SELECT USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Badges: viewable by everyone, managed by organizer
CREATE POLICY "Badges are viewable by everyone" ON public.badges
  FOR SELECT USING (true);
CREATE POLICY "Organizers can manage badges" ON public.badges
  FOR ALL USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));

-- User badges: viewable by everyone (public profiles), awarded by organizer
CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);
CREATE POLICY "Organizers can award badges" ON public.user_badges
  FOR INSERT WITH CHECK (badge_id IN (
    SELECT b.id FROM public.badges b
    JOIN public.events e ON b.event_id = e.id
    WHERE e.organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));

-- Check-ins: users see own, organizers see for their events
CREATE POLICY "Users can view own checkins" ON public.event_checkins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizers can view event checkins" ON public.event_checkins
  FOR SELECT USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));
CREATE POLICY "Users can check in" ON public.event_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Adventurer'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Step 2: Apply migration**

Run this SQL in the Supabase Dashboard SQL Editor (Project > SQL Editor > New Query > paste and run).

Alternatively, if using Supabase CLI:

```bash
npx supabase db push
```

**Step 3: Verify tables exist**

In Supabase Dashboard > Table Editor, confirm all 8 tables are created: `users`, `organizer_profiles`, `events`, `event_photos`, `bookings`, `badges`, `user_badges`, `event_checkins`.

**Step 4: Commit**

```bash
git add supabase/
git commit -m "feat: add initial database schema with RLS policies"
```

---

### Task 6: Generate Supabase TypeScript Types

**Files:**

- Create: `src/lib/supabase/types.ts`

**Step 1: Generate types from Supabase**

Run:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
```

Replace `YOUR_PROJECT_ID` with the actual project ID from Supabase dashboard.

If you don't have the Supabase CLI linked, create the types manually based on the schema. The generated file will contain a `Database` type with all table definitions.

**Step 2: Update Supabase clients to use types**

Update `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

Update `src/lib/supabase/server.ts` similarly — add `<Database>` generic to `createServerClient`.

**Step 3: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add generated Supabase TypeScript types"
```

---

### Task 7: Create Shared UI Components

**Files:**

- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Card.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Input.tsx`
- Create: `src/components/ui/Avatar.tsx`
- Create: `src/components/ui/index.ts`

**Step 1: Create Button component**

Create `src/components/ui/Button.tsx`:

```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-coral-500 hover:bg-coral-600 text-white": variant === "primary",
            "bg-forest-500 hover:bg-forest-600 text-white": variant === "secondary",
            "border-2 border-coral-500 text-coral-500 hover:bg-coral-50": variant === "outline",
            "text-gray-600 hover:text-gray-900 hover:bg-gray-100": variant === "ghost",
          },
          {
            "text-sm py-2 px-4": size === "sm",
            "py-3 px-6": size === "md",
            "text-lg py-4 px-8": size === "lg",
          },
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
export default Button;
```

**Step 2: Create utility `cn` function**

Create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Run: `npm install clsx tailwind-merge`

**Step 3: Create Card component**

Create `src/components/ui/Card.tsx`:

```tsx
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow", className)}
      {...props}
    />
  ),
);

Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pb-0", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6", className)} {...props} />,
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardContent };
```

**Step 4: Create Badge (UI tag) component**

Create `src/components/ui/Badge.tsx`:

```tsx
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "hiking" | "mtb" | "road_bike" | "running" | "trail_run" | "beta";
}

const variantStyles: Record<string, string> = {
  default: "bg-gray-100 text-gray-700",
  hiking: "bg-forest-100 text-forest-700",
  mtb: "bg-coral-100 text-coral-700",
  road_bike: "bg-blue-100 text-blue-700",
  running: "bg-golden-100 text-golden-700",
  trail_run: "bg-amber-100 text-amber-700",
  beta: "bg-coral-500 text-white",
};

const UIBadge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  ),
);

UIBadge.displayName = "UIBadge";
export default UIBadge;
```

**Step 5: Create Input component**

Create `src/components/ui/Input.tsx`:

```tsx
import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-coral-500 focus:ring-2 focus:ring-coral-200 outline-none transition-colors",
          error && "border-red-500 focus:border-red-500 focus:ring-red-200",
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  ),
);

Input.displayName = "Input";
export default Input;
```

**Step 6: Create Avatar component**

Create `src/components/ui/Avatar.tsx`:

```tsx
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const pixelMap = { sm: 32, md: 48, lg: 64, xl: 96 };

export default function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!src) {
    return (
      <div
        className={cn(
          "rounded-full bg-coral-100 text-coral-600 flex items-center justify-center font-semibold",
          sizeMap[size],
          className,
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={pixelMap[size]}
      height={pixelMap[size]}
      className={cn("rounded-full object-cover", sizeMap[size], className)}
    />
  );
}
```

**Step 7: Create barrel export**

Create `src/components/ui/index.ts`:

```typescript
export { default as Button } from "./Button";
export { Card, CardHeader, CardContent } from "./Card";
export { default as UIBadge } from "./Badge";
export { default as Input } from "./Input";
export { default as Avatar } from "./Avatar";
```

**Step 8: Verify components compile**

Run: `npm run dev`
Expected: No errors.

**Step 9: Commit**

```bash
git add src/components/ui/ src/lib/utils.ts package.json package-lock.json
git commit -m "feat: add shared UI components (Button, Card, Badge, Input, Avatar)"
```

---

## Phase 2: Authentication

### Task 8: Build Auth Pages (Login & Signup)

**Files:**

- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/auth/callback/route.ts` (OAuth callback)

**Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-coral-500">EventTara</h1>
          <p className="text-gray-500 mt-1">Tara na! — Book Your Next Adventure</p>
        </div>
        {children}
      </div>
    </div>
  );
}
```

**Step 2: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/events");
      router.refresh();
    }
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  const handleGuestContinue = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
    } else {
      router.push("/guest-setup");
      router.refresh();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-center">Welcome Back!</h2>

      <Button
        onClick={handleFacebookLogin}
        className="w-full bg-[#1877F2] hover:bg-[#166FE5]"
        size="lg"
      >
        Continue with Facebook
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-400">or</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="text-center space-y-3">
        <p className="text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-coral-500 hover:text-coral-600 font-medium">
            Sign Up
          </Link>
        </p>
        <button
          onClick={handleGuestContinue}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Create signup page**

Create `src/app/(auth)/signup/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/events");
      router.refresh();
    }
  };

  const handleFacebookLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-center">Join the Adventure!</h2>

      <Button
        onClick={handleFacebookLogin}
        className="w-full bg-[#1877F2] hover:bg-[#166FE5]"
        size="lg"
      >
        Continue with Facebook
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-400">or</span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          id="fullName"
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Juan Dela Cruz"
          required
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          minLength={6}
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-coral-500 hover:text-coral-600 font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}
```

**Step 4: Create OAuth callback route**

Create `src/app/auth/callback/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/events";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

**Step 5: Verify pages render**

Run: `npm run dev`
Visit: `/login` and `/signup` — verify both pages render with Facebook button, form fields, and links.

**Step 6: Commit**

```bash
git add src/app/(auth)/ src/app/auth/
git commit -m "feat: add login and signup pages with Facebook OAuth, email, and guest auth"
```

---

### Task 9: Build Guest Setup Page (Avatar Picker)

**Files:**

- Create: `src/app/(auth)/guest-setup/page.tsx`
- Create: `src/lib/constants/avatars.ts`

**Step 1: Create avatar constants**

Create `src/lib/constants/avatars.ts`:

```typescript
export const PRESET_AVATARS = [
  { id: "mountain-goat", label: "Mountain Goat", emoji: "🐐", color: "bg-amber-100" },
  { id: "eagle", label: "Eagle", emoji: "🦅", color: "bg-blue-100" },
  { id: "biker", label: "Biker", emoji: "🚴", color: "bg-coral-100" },
  { id: "runner", label: "Runner", emoji: "🏃", color: "bg-green-100" },
  { id: "hiker", label: "Hiker", emoji: "🥾", color: "bg-forest-100" },
  { id: "climber", label: "Climber", emoji: "🧗", color: "bg-purple-100" },
  { id: "wolf", label: "Wolf", emoji: "🐺", color: "bg-gray-100" },
  { id: "dolphin", label: "Dolphin", emoji: "🐬", color: "bg-cyan-100" },
  { id: "phoenix", label: "Phoenix", emoji: "🔥", color: "bg-red-100" },
  { id: "turtle", label: "Turtle", emoji: "🐢", color: "bg-emerald-100" },
  { id: "bear", label: "Bear", emoji: "🐻", color: "bg-yellow-100" },
  { id: "hawk", label: "Hawk", emoji: "🦅", color: "bg-indigo-100" },
];
```

Note: For MVP we use emoji avatars. Custom illustrated avatars can replace these later.

**Step 2: Create guest setup page**

Create `src/app/(auth)/guest-setup/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { PRESET_AVATARS } from "@/lib/constants/avatars";
import { cn } from "@/lib/utils";

export default function GuestSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAvatar) {
      setError("Please pick an avatar!");
      return;
    }
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please try again.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.from("users").upsert({
      id: user.id,
      full_name: displayName || "Adventurer",
      avatar_url: selectedAvatar,
      is_guest: true,
      role: "guest",
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      router.push("/events");
      router.refresh();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold">Choose Your Adventure Avatar</h2>
        <p className="text-gray-500 mt-1">Pick an avatar and a display name to get started</p>
      </div>

      <form onSubmit={handleContinue} className="space-y-6">
        <div className="grid grid-cols-4 gap-3">
          {PRESET_AVATARS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => setSelectedAvatar(avatar.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                selectedAvatar === avatar.id
                  ? "border-coral-500 bg-coral-50 scale-105"
                  : "border-gray-200 hover:border-gray-300",
              )}
            >
              <span
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                  avatar.color,
                )}
              >
                {avatar.emoji}
              </span>
              <span className="text-xs text-gray-600">{avatar.label}</span>
            </button>
          ))}
        </div>

        <Input
          id="displayName"
          label="Display Name (optional)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="TrailHiker_42"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Setting up..." : "Tara na! Let's Go!"}
        </Button>

        <p className="text-center text-xs text-gray-400">
          Create a full account anytime to save your badges permanently
        </p>
      </form>
    </div>
  );
}
```

**Step 3: Verify page renders**

Run: `npm run dev`
Visit: `/guest-setup` — verify avatar grid and form render.

**Step 4: Commit**

```bash
git add src/app/(auth)/guest-setup/ src/lib/constants/avatars.ts
git commit -m "feat: add guest setup page with adventure avatar picker"
```

---

## Phase 3: Core Event Features

### Task 10: Build Landing Page

**Files:**

- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create Navbar**

Create `src/components/layout/Navbar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Avatar } from "@/components/ui";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-heading font-bold text-coral-500">EventTara</span>
            <span className="bg-coral-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              BETA
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/events" className="text-gray-600 hover:text-gray-900 font-medium">
              Explore Events
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/my-events" className="text-gray-600 hover:text-gray-900 font-medium">
                  My Events
                </Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                  Dashboard
                </Link>
                <button onClick={handleLogout}>
                  <Avatar
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name || "User"}
                    size="sm"
                  />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Create Footer**

Create `src/components/layout/Footer.tsx`:

```tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-heading font-bold text-xl mb-3">EventTara</h3>
            <p className="text-sm">Tara na! — Your adventure starts here.</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">Explore</h4>
            <div className="space-y-2 text-sm">
              <Link href="/events" className="block hover:text-white">
                Browse Events
              </Link>
              <Link href="/events?type=hiking" className="block hover:text-white">
                Hiking
              </Link>
              <Link href="/events?type=mtb" className="block hover:text-white">
                Mountain Biking
              </Link>
              <Link href="/events?type=running" className="block hover:text-white">
                Running
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3">For Organizers</h4>
            <div className="space-y-2 text-sm">
              <Link href="/signup" className="block hover:text-white">
                List Your Event
              </Link>
              <Link href="/dashboard" className="block hover:text-white">
                Organizer Dashboard
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} EventTara. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
```

**Step 3: Build landing page**

Replace `src/app/page.tsx` with full landing page including:

- Hero with tagline and CTA
- How it works (3 steps)
- Event type categories (hiking, MTB, road bike, running, trail run)
- CTA section for organizers

Full component code should implement the sections described in the design doc Section 4: Landing Page.

**Step 4: Add Navbar and Footer to layout**

Update `src/app/layout.tsx` to include Navbar and Footer around `{children}`.

**Step 5: Verify landing page**

Run: `npm run dev`
Expected: Full landing page with Navbar, hero, sections, and footer.

**Step 6: Commit**

```bash
git add src/components/layout/ src/app/page.tsx src/app/layout.tsx
git commit -m "feat: build landing page with navbar, hero, categories, and footer"
```

---

### Task 11: Build Event Discovery Page

**Files:**

- Create: `src/app/(participant)/events/page.tsx`
- Create: `src/components/events/EventCard.tsx`
- Create: `src/components/events/EventFilters.tsx`

**Step 1: Create EventCard component**

Create `src/components/events/EventCard.tsx` — displays event cover image, title, type badge, date, location, price, and spots remaining. Links to `/events/[id]`.

**Step 2: Create EventFilters component**

Create `src/components/events/EventFilters.tsx` — filter bar with: event type dropdown (hiking, mtb, road_bike, running, trail_run), date picker, price range, search input. Updates URL params.

**Step 3: Create events listing page**

Create `src/app/(participant)/events/page.tsx` — server component that:

- Reads search params for filters
- Queries Supabase for published events with filters applied
- Renders EventFilters + grid of EventCards
- Shows "No events found" empty state

**Step 4: Verify page**

Run: `npm run dev`
Visit: `/events`

**Step 5: Commit**

```bash
git add src/app/(participant)/events/ src/components/events/
git commit -m "feat: build event discovery page with filters and event cards"
```

---

### Task 12: Build Event Detail Page

**Files:**

- Create: `src/app/(participant)/events/[id]/page.tsx`
- Create: `src/components/events/EventGallery.tsx`
- Create: `src/components/events/OrganizerCard.tsx`
- Create: `src/components/events/BookingButton.tsx`

**Step 1: Create EventGallery component**

Carousel/grid of event photos from `event_photos` table.

**Step 2: Create OrganizerCard component**

Shows organizer name, logo, past events count.

**Step 3: Create BookingButton component**

"Book Now" CTA that opens booking flow. Shows spots remaining. Disabled if full.

**Step 4: Build event detail page**

Server component that fetches event by ID with photos, organizer profile, booking count. Renders: hero image, event info, gallery, organizer card, booking button, social proof.

**Step 5: Verify and commit**

```bash
git add src/app/(participant)/events/[id]/ src/components/events/
git commit -m "feat: build event detail page with gallery, organizer card, and booking CTA"
```

---

### Task 13: Build Booking Flow

**Files:**

- Create: `src/app/(participant)/events/[id]/book/page.tsx`
- Create: `src/components/booking/BookingForm.tsx`
- Create: `src/components/booking/PaymentMethodPicker.tsx`
- Create: `src/components/booking/BookingConfirmation.tsx`
- Create: `src/app/api/bookings/route.ts` (API route for creating bookings)

**Step 1: Create PaymentMethodPicker**

Two options: GCash and Maya. Visual selector with logos.

**Step 2: Create BookingForm**

Collects: payment method selection. For guests: display name + avatar picker inline. Shows event summary (title, date, price). Submit creates booking via API.

**Step 3: Create booking API route**

`POST /api/bookings` — validates event has capacity, creates booking record, generates QR code string, returns booking with QR.

**Step 4: Create BookingConfirmation**

Shows: success message, event details, QR code (rendered with `qrcode.react`), "Add to My Events" link.

Run: `npm install qrcode.react`

**Step 5: Build booking page**

Assembles the flow: BookingForm → PaymentMethodPicker → submit → BookingConfirmation.

**Step 6: Verify and commit**

```bash
git add src/app/(participant)/events/[id]/book/ src/components/booking/ src/app/api/bookings/
git commit -m "feat: build booking flow with payment method selection and QR confirmation"
```

---

## Phase 4: Organizer Dashboard

### Task 14: Build Organizer Dashboard Layout

**Files:**

- Create: `src/app/(organizer)/dashboard/layout.tsx`
- Create: `src/app/(organizer)/dashboard/page.tsx`
- Create: `src/components/dashboard/DashboardSidebar.tsx`
- Create: `src/components/dashboard/DashboardStats.tsx`

**Step 1: Create dashboard sidebar**

Navigation: Overview, Events, Settings. Active state styling. Mobile-responsive (hamburger).

**Step 2: Create dashboard layout**

Sidebar + main content area. Auth-protected (redirect to login if not authenticated, redirect to home if not organizer role).

**Step 3: Create stats cards**

DashboardStats shows: total events, total bookings, upcoming events count.

**Step 4: Build dashboard overview page**

Fetches organizer's stats, upcoming events list, recent bookings. Renders stats cards + event list.

**Step 5: Verify and commit**

```bash
git add src/app/(organizer)/ src/components/dashboard/
git commit -m "feat: build organizer dashboard layout with sidebar and overview stats"
```

---

### Task 15: Build Event CRUD (Create/Edit/Manage)

**Files:**

- Create: `src/app/(organizer)/dashboard/events/page.tsx` (events list)
- Create: `src/app/(organizer)/dashboard/events/new/page.tsx` (create event)
- Create: `src/app/(organizer)/dashboard/events/[id]/page.tsx` (manage event)
- Create: `src/app/(organizer)/dashboard/events/[id]/edit/page.tsx` (edit event)
- Create: `src/components/dashboard/EventForm.tsx`
- Create: `src/components/dashboard/PhotoUploader.tsx`
- Create: `src/app/api/events/route.ts`
- Create: `src/app/api/events/[id]/route.ts`

**Step 1: Create EventForm component**

Form fields: title, description, type (select), date (datetime picker), location, max participants, price, cover image upload, gallery photo upload (multi). Handles both create and edit modes.

**Step 2: Create PhotoUploader component**

Drag-and-drop or click-to-upload. Shows thumbnails. Reorder support (drag to sort). Uploads to Supabase Storage. For gallery: supports multiple photos with captions.

**Step 3: Create events API routes**

- `POST /api/events` — create event (organizer only)
- `GET /api/events/[id]` — get event details
- `PUT /api/events/[id]` — update event
- `DELETE /api/events/[id]` — soft delete (set status to cancelled)

**Step 4: Build events list page**

Table/grid of organizer's events with status badges, date, participants count. Actions: edit, view, publish/unpublish.

**Step 5: Build create event page**

Uses EventForm in create mode. On submit, redirects to the new event's manage page.

**Step 6: Build edit event page**

Uses EventForm in edit mode, pre-populated with existing data.

**Step 7: Build event manage page**

Shows: event details, participant list, check-in status, booking stats. Actions: publish, mark completed, edit.

**Step 8: Verify CRUD flow and commit**

```bash
git add src/app/(organizer)/dashboard/events/ src/components/dashboard/ src/app/api/events/
git commit -m "feat: build event CRUD with form, photo upload, and management pages"
```

---

### Task 16: Build Organizer Settings Page

**Files:**

- Create: `src/app/(organizer)/dashboard/settings/page.tsx`
- Create: `src/components/dashboard/OrganizerProfileForm.tsx`
- Create: `src/components/dashboard/PaymentSettingsForm.tsx`

**Step 1: Create organizer profile form**

Fields: org name, description, logo upload. Updates `organizer_profiles` table.

**Step 2: Create payment settings form**

Fields: GCash number, Maya number. Stored in `payment_info` JSONB.

**Step 3: Build settings page**

Two sections: Profile and Payment Settings. Save buttons per section.

**Step 4: Verify and commit**

```bash
git add src/app/(organizer)/dashboard/settings/ src/components/dashboard/
git commit -m "feat: build organizer settings page with profile and payment config"
```

---

## Phase 5: Gamification & Profiles

### Task 17: Build QR Check-in System

**Files:**

- Create: `src/app/(organizer)/dashboard/events/[id]/checkin/page.tsx`
- Create: `src/components/checkin/QRScanner.tsx`
- Create: `src/components/checkin/CheckinList.tsx`
- Create: `src/app/api/checkins/route.ts`

**Step 1: Install QR scanner library**

Run: `npm install html5-qrcode`

**Step 2: Create QR scanner component**

Uses device camera to scan QR codes. On successful scan, calls check-in API. Shows success/error feedback.

**Step 3: Create check-in API**

`POST /api/checkins` — validates booking exists for this event + user, creates check-in record, returns success. Prevents duplicate check-ins.

**Step 4: Create check-in list component**

Shows all participants with check-in status (checked in / not yet). Real-time updates via Supabase subscription.

**Step 5: Build check-in page**

Split view: QR scanner on left/top, check-in list on right/bottom. Manual check-in button as fallback.

**Step 6: Verify and commit**

```bash
git add src/app/(organizer)/dashboard/events/[id]/checkin/ src/components/checkin/ src/app/api/checkins/
git commit -m "feat: build QR check-in system with scanner and real-time participant list"
```

---

### Task 18: Build Badge System

**Files:**

- Create: `src/components/dashboard/BadgeForm.tsx`
- Create: `src/components/dashboard/BadgeAwarder.tsx`
- Create: `src/components/badges/BadgeCard.tsx`
- Create: `src/components/badges/BadgeGrid.tsx`
- Create: `src/app/api/badges/route.ts`
- Create: `src/app/api/badges/award/route.ts`

**Step 1: Create BadgeForm component**

Used in event creation/edit. Fields: badge title, description, image upload (or select from templates). One badge per event.

**Step 2: Create badge API**

- `POST /api/badges` — create badge for an event
- `POST /api/badges/award` — bulk award badge to selected users (array of user_ids)

**Step 3: Create BadgeAwarder component**

Shows participant list with check-in status and checkboxes. "Select all checked-in" filter button. "Award Badge" button to bulk-award. Used on the event manage page post-event.

**Step 4: Create BadgeCard component**

Displays a single badge: image, title, event name, date earned. Used in profile badge grid.

**Step 5: Create BadgeGrid component**

Grid layout of BadgeCards. Used on participant profiles.

**Step 6: Verify and commit**

```bash
git add src/components/dashboard/Badge* src/components/badges/ src/app/api/badges/
git commit -m "feat: build badge system with creation, bulk awarding, and display components"
```

---

### Task 19: Build Participant Profile Page

**Files:**

- Create: `src/app/(participant)/profile/[username]/page.tsx`
- Create: `src/components/profile/ProfileHeader.tsx`
- Create: `src/components/profile/ProfileStats.tsx`

**Step 1: Create ProfileHeader**

Shows: avatar (large), display name/username, "Adventurer since [date]". Share button (copies profile URL).

**Step 2: Create ProfileStats**

Shows: total events joined, badge count, breakdown by event type (e.g., "3 Hikes, 2 Rides, 1 Run").

**Step 3: Build profile page**

Server component that fetches user by username with their badges and booking history. Renders: ProfileHeader, ProfileStats, BadgeGrid. Public page — no auth required. Shows "Join EventTara" CTA for visitors.

**Step 4: Verify and commit**

```bash
git add src/app/(participant)/profile/ src/components/profile/
git commit -m "feat: build public participant profile with badges and adventure stats"
```

---

### Task 20: Build My Events Page

**Files:**

- Create: `src/app/(participant)/my-events/page.tsx`
- Create: `src/components/participant/UpcomingBookings.tsx`
- Create: `src/components/participant/PastEvents.tsx`

**Step 1: Create UpcomingBookings component**

List of upcoming bookings with: event card, date, QR code (expandable), cancel booking button.

**Step 2: Create PastEvents component**

List of past events with: event card, badge earned (if any), check-in status.

**Step 3: Build my events page**

Auth-protected. Two tabs/sections: Upcoming and Past. Shows guest conversion banner if user is guest ("Create an account to keep your badges forever!").

**Step 4: Verify and commit**

```bash
git add src/app/(participant)/my-events/ src/components/participant/
git commit -m "feat: build my events page with upcoming bookings and past event history"
```

---

## Phase 6: Polish & Launch Readiness

### Task 21: Add Email Notifications

**Files:**

- Create: `src/lib/email/send.ts`
- Create: `src/lib/email/templates/booking-confirmation.tsx`
- Create: `src/lib/email/templates/badge-awarded.tsx`
- Create: `src/lib/email/templates/event-reminder.tsx`

**Step 1: Set up email provider**

Install Resend: `npm install resend`
Add `RESEND_API_KEY` to `.env.local`.

**Step 2: Create email templates**

Simple HTML email templates for: booking confirmation (with QR code), badge awarded notification, event reminder (24h before).

**Step 3: Integrate emails into existing flows**

- After booking created → send booking confirmation
- After badge awarded → send badge notification
- Cron/scheduled function for event reminders (can be Supabase Edge Function)

**Step 4: Commit**

```bash
git add src/lib/email/ .env.local.example
git commit -m "feat: add email notifications for bookings, badges, and reminders"
```

---

### Task 22: Responsive Mobile UX Polish

**Files:**

- Modify: Various component files

**Step 1: Audit all pages at mobile viewport (375px)**

Check: Navbar (hamburger menu), landing page, events grid, event detail, booking flow, dashboard, profile.

**Step 2: Fix layout issues**

Ensure: cards stack vertically, forms are full-width, touch targets are 44px+, QR scanner works on mobile, photo galleries are swipeable.

**Step 3: Add mobile navigation**

Bottom nav bar for mobile participant experience (Explore, My Events, Profile).

**Step 4: Verify on mobile viewport and commit**

```bash
git add -A
git commit -m "feat: polish responsive mobile UX across all pages"
```

---

### Task 23: SEO & Meta Tags

**Files:**

- Modify: `src/app/layout.tsx`
- Modify: `src/app/(participant)/events/[id]/page.tsx`
- Modify: `src/app/(participant)/profile/[username]/page.tsx`
- Create: `src/app/opengraph-image.tsx` (OG image generation)

**Step 1: Add dynamic meta tags**

Event pages: dynamic title, description, OG image from cover photo.
Profile pages: dynamic title with username, OG image with badge count.

**Step 2: Add OG image generation**

Use Next.js `ImageResponse` for dynamic OG images for event and profile pages.

**Step 3: Add sitemap and robots.txt**

Create `src/app/sitemap.ts` and `src/app/robots.ts`.

**Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: add SEO meta tags, dynamic OG images, sitemap, and robots.txt"
```

---

### Task 24: Final Integration Testing & Cleanup

**Step 1: End-to-end flow test**

Manually test the complete flows:

1. Sign up as organizer → create event → add photos → publish → create badge
2. Sign up as participant → browse events → book event → receive QR
3. Organizer: scan QR check-in → award badges
4. Participant: view profile with badge → share profile link
5. Guest: browse → book → see conversion prompt

**Step 2: Fix any bugs found**

**Step 3: Clean up unused code, remove console.logs**

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final integration testing and cleanup for beta launch"
```

---

## Summary

| Phase           | Tasks       | Description                                                                |
| --------------- | ----------- | -------------------------------------------------------------------------- |
| 1. Foundation   | Tasks 1-7   | Project scaffold, design system, Supabase, Redux, DB schema, UI components |
| 2. Auth         | Tasks 8-9   | Login, signup, Facebook OAuth, guest mode with avatar picker               |
| 3. Core Events  | Tasks 10-13 | Landing page, event discovery, event detail, booking flow                  |
| 4. Organizer    | Tasks 14-16 | Dashboard layout, event CRUD, settings                                     |
| 5. Gamification | Tasks 17-20 | QR check-in, badge system, profiles, my events                             |
| 6. Polish       | Tasks 21-24 | Emails, mobile UX, SEO, integration testing                                |
