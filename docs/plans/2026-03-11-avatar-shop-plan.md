# Animal Avatar, TaraTokens & Cosmetic Shop — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add animal avatar system, TaraTokens virtual currency, and cosmetic shop so users can pick a cute animal avatar during onboarding, earn tokens through platform activity, and buy cosmetic items.

**Architecture:** New Supabase tables for tokens/inventory/shop. `CompositeAvatar` component replaces `UserAvatar` with CSS-layered rendering (background → animal → accessory → border). Token earning hooks into existing check-in/booking/hosting flows. Shop is a new `/shop` page. Avatar picker is a new `/setup-avatar` onboarding step.

**Tech Stack:** Next.js 15 App Router, React 19, Supabase (Postgres + Storage), Tailwind CSS, placeholder SVGs

**Design doc:** `docs/plans/2026-03-11-avatar-shop-design.md`

---

## Task 1: Database Migration — New Tables & User Columns

**Files:**

- Create: `supabase/migrations/20260311_avatar_shop_tokens.sql`
- Modify: `src/lib/supabase/types.ts`

**Step 1: Write the SQL migration**

```sql
-- Avatar animals catalog
CREATE TABLE avatar_animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE avatar_animals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read animals" ON avatar_animals FOR SELECT USING (true);

-- TaraTokens balance (cached)
CREATE TABLE tara_tokens (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tara_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own balance" ON tara_tokens FOR SELECT USING (auth.uid() = user_id);

-- Token transaction ledger (append-only)
CREATE TABLE token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount int NOT NULL,
  reason text NOT NULL CHECK (reason IN ('check_in','hosting','daily_login','streak_bonus','milestone','purchase','badge_earned','first_event','admin_grant')),
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions" ON token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_token_transactions_user ON token_transactions(user_id, created_at DESC);

-- Shop items catalog
CREATE TABLE shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('accessory','background','border','skin')),
  image_url text NOT NULL,
  preview_url text,
  price int NOT NULL CHECK (price > 0),
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','uncommon','rare','legendary')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active items" ON shop_items FOR SELECT USING (is_active = true);

-- User inventory (purchased items)
CREATE TABLE user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_item_id uuid NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_item_id)
);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);

-- User avatar config (equipped state)
CREATE TABLE user_avatar_config (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  animal_id uuid REFERENCES avatar_animals(id),
  equipped_accessory_id uuid REFERENCES shop_items(id),
  equipped_background_id uuid REFERENCES shop_items(id),
  equipped_border_id uuid REFERENCES shop_items(id),
  equipped_skin_id uuid REFERENCES shop_items(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_avatar_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own config" ON user_avatar_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own config" ON user_avatar_config FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own config" ON user_avatar_config FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_picked_avatar boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_daily_login date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_streak int NOT NULL DEFAULT 0;

-- Atomic purchase RPC
CREATE OR REPLACE FUNCTION purchase_shop_item(p_user_id uuid, p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price int;
  v_balance int;
  v_item_name text;
  v_already_owned boolean;
BEGIN
  -- Get item price
  SELECT price, name INTO v_price, v_item_name
  FROM shop_items WHERE id = p_item_id AND is_active = true;

  IF v_price IS NULL THEN
    RETURN jsonb_build_object('error', 'Item not found or unavailable');
  END IF;

  -- Check already owned
  SELECT EXISTS(
    SELECT 1 FROM user_inventory WHERE user_id = p_user_id AND shop_item_id = p_item_id
  ) INTO v_already_owned;

  IF v_already_owned THEN
    RETURN jsonb_build_object('error', 'You already own this item');
  END IF;

  -- Check and deduct balance atomically
  UPDATE tara_tokens SET balance = balance - v_price, updated_at = now()
  WHERE user_id = p_user_id AND balance >= v_price;

  IF NOT FOUND THEN
    SELECT COALESCE(balance, 0) INTO v_balance FROM tara_tokens WHERE user_id = p_user_id;
    RETURN jsonb_build_object('error', 'Not enough TaraTokens', 'balance', COALESCE(v_balance, 0), 'price', v_price);
  END IF;

  -- Record transaction
  INSERT INTO token_transactions (user_id, amount, reason, reference_id)
  VALUES (p_user_id, -v_price, 'purchase', p_item_id::text);

  -- Add to inventory
  INSERT INTO user_inventory (user_id, shop_item_id) VALUES (p_user_id, p_item_id);

  SELECT balance INTO v_balance FROM tara_tokens WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'item_name', v_item_name, 'new_balance', v_balance);
END;
$$;

-- Award tokens helper RPC
CREATE OR REPLACE FUNCTION award_tokens(p_user_id uuid, p_amount int, p_reason text, p_reference_id text DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance int;
BEGIN
  -- Upsert balance
  INSERT INTO tara_tokens (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE SET balance = tara_tokens.balance + p_amount, updated_at = now();

  -- Record transaction
  INSERT INTO token_transactions (user_id, amount, reason, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id);

  SELECT balance INTO v_new_balance FROM tara_tokens WHERE user_id = p_user_id;
  RETURN v_new_balance;
END;
$$;
```

**Step 2: Add TypeScript types to `src/lib/supabase/types.ts`**

Add these table types after the existing tables in the `Tables` section:

```typescript
avatar_animals: {
  Row: {
    id: string;
    slug: string;
    name: string;
    image_url: string;
    sort_order: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    slug: string;
    name: string;
    image_url: string;
    sort_order?: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    slug?: string;
    name?: string;
    image_url?: string;
    sort_order?: number;
    created_at?: string;
  };
  Relationships: [];
};
tara_tokens: {
  Row: {
    user_id: string;
    balance: number;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    balance?: number;
    updated_at?: string;
  };
  Update: {
    user_id?: string;
    balance?: number;
    updated_at?: string;
  };
  Relationships: [];
};
token_transactions: {
  Row: {
    id: string;
    user_id: string;
    amount: number;
    reason: "check_in" | "hosting" | "daily_login" | "streak_bonus" | "milestone" | "purchase" | "badge_earned" | "first_event" | "admin_grant";
    reference_id: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    amount: number;
    reason: "check_in" | "hosting" | "daily_login" | "streak_bonus" | "milestone" | "purchase" | "badge_earned" | "first_event" | "admin_grant";
    reference_id?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    amount?: number;
    reason?: "check_in" | "hosting" | "daily_login" | "streak_bonus" | "milestone" | "purchase" | "badge_earned" | "first_event" | "admin_grant";
    reference_id?: string | null;
    created_at?: string;
  };
  Relationships: [];
};
shop_items: {
  Row: {
    id: string;
    slug: string;
    name: string;
    category: "accessory" | "background" | "border" | "skin";
    image_url: string;
    preview_url: string | null;
    price: number;
    rarity: "common" | "uncommon" | "rare" | "legendary";
    is_active: boolean;
    sort_order: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    slug: string;
    name: string;
    category: "accessory" | "background" | "border" | "skin";
    image_url: string;
    preview_url?: string | null;
    price: number;
    rarity?: "common" | "uncommon" | "rare" | "legendary";
    is_active?: boolean;
    sort_order?: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    slug?: string;
    name?: string;
    category?: "accessory" | "background" | "border" | "skin";
    image_url?: string;
    preview_url?: string | null;
    price?: number;
    rarity?: "common" | "uncommon" | "rare" | "legendary";
    is_active?: boolean;
    sort_order?: number;
    created_at?: string;
  };
  Relationships: [];
};
user_inventory: {
  Row: {
    id: string;
    user_id: string;
    shop_item_id: string;
    purchased_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    shop_item_id: string;
    purchased_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    shop_item_id?: string;
    purchased_at?: string;
  };
  Relationships: [];
};
user_avatar_config: {
  Row: {
    user_id: string;
    animal_id: string | null;
    equipped_accessory_id: string | null;
    equipped_background_id: string | null;
    equipped_border_id: string | null;
    equipped_skin_id: string | null;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    animal_id?: string | null;
    equipped_accessory_id?: string | null;
    equipped_background_id?: string | null;
    equipped_border_id?: string | null;
    equipped_skin_id?: string | null;
    updated_at?: string;
  };
  Update: {
    user_id?: string;
    animal_id?: string | null;
    equipped_accessory_id?: string | null;
    equipped_background_id?: string | null;
    equipped_border_id?: string | null;
    equipped_skin_id?: string | null;
    updated_at?: string;
  };
  Relationships: [];
};
```

Also add to `users` Row/Insert/Update:

- `has_picked_avatar: boolean` (Row), `has_picked_avatar?: boolean` (Insert/Update)
- `last_daily_login: string | null` (Row), `last_daily_login?: string | null` (Insert/Update)
- `login_streak: number` (Row), `login_streak?: number` (Insert/Update)

**Step 3: Run migration**

```bash
# Copy migration to Supabase and run it via Supabase dashboard or CLI
```

**Step 4: Verify with typecheck**

```bash
pnpm typecheck
```

Expected: PASS (no type errors from new types)

**Step 5: Commit**

```bash
git add supabase/migrations/20260311_avatar_shop_tokens.sql src/lib/supabase/types.ts
git commit -m "feat: add avatar, shop, and token tables with RPC functions"
```

---

## Task 2: Seed Data — Starter Animals & Initial Shop Items

**Files:**

- Create: `supabase/migrations/20260311_avatar_shop_seed.sql`

**Step 1: Write seed migration with 8 animals and ~15 shop items**

```sql
-- Seed 8 starter animals
INSERT INTO avatar_animals (slug, name, image_url, sort_order) VALUES
  ('bear',   'Bear',   '/avatars/animals/bear.svg',   1),
  ('cat',    'Cat',    '/avatars/animals/cat.svg',    2),
  ('dog',    'Dog',    '/avatars/animals/dog.svg',    3),
  ('bunny',  'Bunny',  '/avatars/animals/bunny.svg',  4),
  ('fox',    'Fox',    '/avatars/animals/fox.svg',    5),
  ('panda',  'Panda',  '/avatars/animals/panda.svg',  6),
  ('koala',  'Koala',  '/avatars/animals/koala.svg',  7),
  ('frog',   'Frog',   '/avatars/animals/frog.svg',   8);

-- Seed shop items: accessories
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('hat-beanie',    'Cozy Beanie',       'accessory', '/avatars/accessories/hat-beanie.svg',    80,  'common',   1),
  ('hat-cap',       'Baseball Cap',      'accessory', '/avatars/accessories/hat-cap.svg',       80,  'common',   2),
  ('scarf-red',     'Red Scarf',         'accessory', '/avatars/accessories/scarf-red.svg',     60,  'common',   3),
  ('glasses-sun',   'Cool Sunglasses',   'accessory', '/avatars/accessories/glasses-sun.svg',  120,  'uncommon', 4),
  ('headband-hike', 'Trail Headband',    'accessory', '/avatars/accessories/headband-hike.svg', 100, 'uncommon', 5);

-- Seed shop items: backgrounds
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('bg-sunset',    'Sunset Gradient',    'background', '/avatars/backgrounds/bg-sunset.svg',    150, 'uncommon', 1),
  ('bg-forest',    'Forest Trail',       'background', '/avatars/backgrounds/bg-forest.svg',    150, 'uncommon', 2),
  ('bg-mountain',  'Mountain Peak',      'background', '/avatars/backgrounds/bg-mountain.svg',  200, 'rare',     3),
  ('bg-starry',    'Starry Night',       'background', '/avatars/backgrounds/bg-starry.svg',    300, 'rare',     4);

-- Seed shop items: premium borders
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('border-gold',     'Golden Ring',     'border', '/avatars/borders/border-gold.svg',     250, 'rare',      1),
  ('border-neon',     'Neon Glow',       'border', '/avatars/borders/border-neon.svg',     250, 'rare',      2),
  ('border-rainbow',  'Rainbow',         'border', '/avatars/borders/border-rainbow.svg',  500, 'legendary', 3);

-- Seed shop items: alternate skins
INSERT INTO shop_items (slug, name, category, image_url, price, rarity, sort_order) VALUES
  ('skin-winter-bear', 'Winter Bear',   'skin', '/avatars/skins/skin-winter-bear.svg', 300, 'rare',      1),
  ('skin-pirate-cat',  'Pirate Cat',    'skin', '/avatars/skins/skin-pirate-cat.svg',  300, 'rare',      2),
  ('skin-ninja-fox',   'Ninja Fox',     'skin', '/avatars/skins/skin-ninja-fox.svg',   400, 'legendary', 3);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260311_avatar_shop_seed.sql
git commit -m "feat: seed starter animals and initial shop items"
```

---

## Task 3: Placeholder SVG Assets

**Files:**

- Create: `public/avatars/animals/{bear,cat,dog,bunny,fox,panda,koala,frog}.svg`
- Create: `public/avatars/accessories/{hat-beanie,hat-cap,scarf-red,glasses-sun,headband-hike}.svg`
- Create: `public/avatars/backgrounds/{bg-sunset,bg-forest,bg-mountain,bg-starry}.svg`
- Create: `public/avatars/borders/{border-gold,border-neon,border-rainbow}.svg`
- Create: `public/avatars/skins/{skin-winter-bear,skin-pirate-cat,skin-ninja-fox}.svg`

**Step 1: Create placeholder SVGs**

Each animal SVG should be a simple colored circle with the animal's first letter (like the current Avatar initials fallback) — these are temporary placeholders until real art is provided. Size: 128x128 viewBox.

Example for bear:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="60" fill="#D4A574"/>
  <text x="64" y="76" text-anchor="middle" font-size="48" font-family="sans-serif" font-weight="bold" fill="white">B</text>
  <!-- Ears -->
  <circle cx="30" cy="25" r="14" fill="#D4A574"/>
  <circle cx="98" cy="25" r="14" fill="#D4A574"/>
  <circle cx="30" cy="25" r="8" fill="#C49464"/>
  <circle cx="98" cy="25" r="8" fill="#C49464"/>
</svg>
```

Accessories: simple icon shapes (hat = rectangle+dome, scarf = wavy line, glasses = two circles).
Backgrounds: gradient-filled rounded rects.
Borders: colored ring SVGs.
Skins: same as base animal with different color palette.

**Step 2: Commit**

```bash
git add public/avatars/
git commit -m "feat: add placeholder SVG assets for animals, accessories, backgrounds, borders, skins"
```

---

## Task 4: Token Earning Library

**Files:**

- Create: `src/lib/tokens/award.ts`
- Create: `src/lib/tokens/constants.ts`

**Step 1: Create constants file**

```typescript
// src/lib/tokens/constants.ts
export const TOKEN_REWARDS = {
  check_in: 50,
  hosting: 100,
  daily_login: 5,
  streak_bonus: 25, // 7-day streak
  badge_earned_common: 50,
  badge_earned_rare: 100,
  badge_earned_legendary: 200,
  first_event: 100,
} as const;
```

**Step 2: Create award helper**

```typescript
// src/lib/tokens/award.ts
import type { SupabaseClient } from "@supabase/supabase-js";

type TokenReason =
  | "check_in"
  | "hosting"
  | "daily_login"
  | "streak_bonus"
  | "milestone"
  | "badge_earned"
  | "first_event"
  | "admin_grant";

export async function awardTokens(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: TokenReason,
  referenceId?: string,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("award_tokens", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_reference_id: referenceId ?? null,
  });

  if (error) {
    console.error("[tokens] award error:", error.message);
    return null;
  }

  return data as number;
}
```

**Step 3: Run typecheck**

```bash
pnpm typecheck
```

**Step 4: Commit**

```bash
git add src/lib/tokens/
git commit -m "feat: add token award library with constants and RPC helper"
```

---

## Task 5: Hook Token Earning into Check-in Flow

**Files:**

- Modify: `src/app/(frontend)/api/checkins/route.ts:196-197` (after check-in insert, alongside border/badge checks)

**Step 1: Add token award after check-in**

After line 197 (`checkAndAwardBorders(user_id, supabase).catch(() => null);`), add:

```typescript
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";

// Award TaraTokens for check-in (non-blocking)
awardTokens(supabase, user_id, TOKEN_REWARDS.check_in, "check_in", event_id).catch(() => null);
```

Also check if this is the user's first event check-in and award the first_event bonus:

```typescript
// Check if first ever check-in for first_event bonus
const { count: checkinCount } = await supabase
  .from("event_checkins")
  .select("id", { count: "exact", head: true })
  .eq("user_id", user_id);

if (checkinCount === 1) {
  awardTokens(supabase, user_id, TOKEN_REWARDS.first_event, "first_event", event_id).catch(
    () => null,
  );
}
```

**Step 2: Run typecheck**

```bash
pnpm typecheck
```

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/checkins/route.ts
git commit -m "feat: award TaraTokens on event check-in"
```

---

## Task 6: Hook Token Earning into Booking Flow (Hosting)

**Files:**

- Modify: `src/app/(frontend)/api/events/route.ts` (POST handler — award tokens when event is created)

**Step 1: Add token award after event creation**

After the event is inserted and distances are added, award hosting tokens:

```typescript
import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";

// Award TaraTokens for hosting (non-blocking)
awardTokens(supabase, user.id, TOKEN_REWARDS.hosting, "hosting", event.id).catch(() => null);
```

**Step 2: Run typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/api/events/route.ts
git commit -m "feat: award TaraTokens for event hosting"
```

---

## Task 7: Daily Login Token Earning

**Files:**

- Create: `src/app/(frontend)/api/tokens/daily-login/route.ts`

**Step 1: Create daily login API route**

```typescript
import { NextResponse } from "next/server";

import { awardTokens } from "@/lib/tokens/award";
import { TOKEN_REWARDS } from "@/lib/tokens/constants";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Get user's login streak state
  const { data: profile } = await supabase
    .from("users")
    .select("last_daily_login, login_streak")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Already claimed today
  if (profile.last_daily_login === today) {
    return NextResponse.json({ already_claimed: true, streak: profile.login_streak });
  }

  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const isConsecutive = profile.last_daily_login === yesterdayStr;
  const newStreak = isConsecutive ? profile.login_streak + 1 : 1;

  // Update user login state
  await supabase
    .from("users")
    .update({ last_daily_login: today, login_streak: newStreak })
    .eq("id", user.id);

  // Award daily login tokens
  const newBalance = await awardTokens(supabase, user.id, TOKEN_REWARDS.daily_login, "daily_login");

  // Award streak bonus at 7-day intervals
  let streakBonus = false;
  if (newStreak > 0 && newStreak % 7 === 0) {
    await awardTokens(supabase, user.id, TOKEN_REWARDS.streak_bonus, "streak_bonus");
    streakBonus = true;
  }

  return NextResponse.json({
    already_claimed: false,
    tokens_earned: TOKEN_REWARDS.daily_login,
    streak: newStreak,
    streak_bonus: streakBonus,
    new_balance: newBalance,
  });
}
```

**Step 2: Run typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/api/tokens/daily-login/route.ts
git commit -m "feat: add daily login token earning with streak tracking"
```

---

## Task 8: Token Balance & Transactions API Routes

**Files:**

- Create: `src/app/(frontend)/api/tokens/route.ts`
- Create: `src/app/(frontend)/api/tokens/transactions/route.ts`

**Step 1: Create balance route**

```typescript
// src/app/(frontend)/api/tokens/route.ts
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("tara_tokens")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ balance: data?.balance ?? 0 });
}
```

**Step 2: Create transactions route**

```typescript
// src/app/(frontend)/api/tokens/transactions/route.ts
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;
  const offset = Number(request.nextUrl.searchParams.get("offset")) || 0;

  const { data, error } = await supabase
    .from("token_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ transactions: data });
}
```

**Step 3: Typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/api/tokens/
git commit -m "feat: add token balance and transactions API routes"
```

---

## Task 9: Shop API Routes

**Files:**

- Create: `src/app/(frontend)/api/shop/items/route.ts`
- Create: `src/app/(frontend)/api/shop/purchase/route.ts`

**Step 1: Shop items listing**

```typescript
// src/app/(frontend)/api/shop/items/route.ts
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const category = request.nextUrl.searchParams.get("category");

  let query = supabase.from("shop_items").select("*").eq("is_active", true).order("sort_order");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data });
}
```

**Step 2: Purchase route (uses atomic RPC)**

```typescript
// src/app/(frontend)/api/shop/purchase/route.ts
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { item_id } = await request.json();

  if (!item_id) {
    return NextResponse.json({ error: "Missing item_id" }, { status: 400 });
  }

  const { data: result, error } = await supabase.rpc("purchase_shop_item", {
    p_user_id: user.id,
    p_item_id: item_id,
  });

  if (error) {
    console.error("[shop] purchase RPC error:", error.message);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }

  const rpcResult = result as {
    error?: string;
    success?: boolean;
    item_name?: string;
    new_balance?: number;
  };

  if (rpcResult.error) {
    return NextResponse.json({ error: rpcResult.error }, { status: 400 });
  }

  return NextResponse.json(rpcResult);
}
```

**Step 3: Typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/api/shop/
git commit -m "feat: add shop items listing and atomic purchase API routes"
```

---

## Task 10: User Inventory & Avatar Config API Routes

**Files:**

- Create: `src/app/(frontend)/api/users/inventory/route.ts`
- Create: `src/app/(frontend)/api/users/avatar-config/route.ts`

**Step 1: Inventory route**

```typescript
// src/app/(frontend)/api/users/inventory/route.ts
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_inventory")
    .select("*, shop_items(*)")
    .eq("user_id", user.id)
    .order("purchased_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inventory: data });
}
```

**Step 2: Avatar config route (GET + PATCH)**

```typescript
// src/app/(frontend)/api/users/avatar-config/route.ts
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("user_avatar_config")
    .select("*, avatar_animals(*)")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ config: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    animal_id,
    equipped_accessory_id,
    equipped_background_id,
    equipped_border_id,
    equipped_skin_id,
  } = body;

  const { data, error } = await supabase
    .from("user_avatar_config")
    .upsert(
      {
        user_id: user.id,
        ...(animal_id !== undefined && { animal_id }),
        ...(equipped_accessory_id !== undefined && { equipped_accessory_id }),
        ...(equipped_background_id !== undefined && { equipped_background_id }),
        ...(equipped_border_id !== undefined && { equipped_border_id }),
        ...(equipped_skin_id !== undefined && { equipped_skin_id }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("*, avatar_animals(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}
```

**Step 3: Typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/api/users/inventory/ src/app/(frontend)/api/users/avatar-config/
git commit -m "feat: add user inventory and avatar config API routes"
```

---

## Task 11: CompositeAvatar Component

**Files:**

- Create: `src/components/ui/CompositeAvatar.tsx`
- Modify: `src/components/ui/index.ts` (add export)

**Step 1: Build the component**

The `CompositeAvatar` component renders layers (background → animal → accessory → border) using absolute positioning. Falls back to existing `UserAvatar` if no animal is configured.

```typescript
// src/components/ui/CompositeAvatar.tsx
"use client";

import Image from "next/image";

import type { BorderSize, BorderTier } from "@/lib/constants/avatar-borders";
import { cn } from "@/lib/utils";

import Avatar from "./Avatar";
import UserAvatar from "./UserAvatar";

interface AvatarConfig {
  animalImageUrl?: string | null;
  accessoryImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  skinImageUrl?: string | null;
}

interface CompositeAvatarProps {
  /** Traditional photo URL (fallback if no animal config) */
  src?: string | null;
  alt: string;
  size?: BorderSize;
  className?: string;
  borderTier?: BorderTier | null;
  borderColor?: string | null;
  /** Avatar config from user_avatar_config join */
  avatarConfig?: AvatarConfig | null;
  onClick?: () => void;
}

const pixelMap = { sm: 32, md: 48, lg: 64, xl: 96 };
const sizeMap = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16", xl: "w-24 h-24" };

export default function CompositeAvatar({
  src,
  alt,
  size = "md",
  className,
  borderTier,
  borderColor,
  avatarConfig,
  onClick,
}: CompositeAvatarProps) {
  // If no animal configured, fall back to photo-based UserAvatar
  if (!avatarConfig?.animalImageUrl) {
    return (
      <UserAvatar
        src={src}
        alt={alt}
        size={size}
        className={className}
        borderTier={borderTier}
        borderColor={borderColor}
        onClick={onClick}
      />
    );
  }

  const px = pixelMap[size];
  const animalSrc = avatarConfig.skinImageUrl ?? avatarConfig.animalImageUrl;

  const content = (
    <div className={cn("relative rounded-full overflow-hidden flex-shrink-0", sizeMap[size])}>
      {/* Background layer */}
      {avatarConfig.backgroundImageUrl ? (
        <Image
          src={avatarConfig.backgroundImageUrl}
          alt=""
          width={px}
          height={px}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-lime-100 dark:bg-lime-900" />
      )}

      {/* Animal layer */}
      <Image
        src={animalSrc}
        alt={alt}
        width={px}
        height={px}
        className="absolute inset-0 w-full h-full object-contain z-10"
      />

      {/* Accessory layer */}
      {avatarConfig.accessoryImageUrl && (
        <Image
          src={avatarConfig.accessoryImageUrl}
          alt=""
          width={px}
          height={px}
          className="absolute inset-0 w-full h-full object-contain z-20"
        />
      )}
    </div>
  );

  // If has border tier, wrap with UserAvatar-style border
  // For now, delegate to UserAvatar's border logic by rendering content inside
  // TODO: integrate with border system once shop borders are implemented

  if (onClick) {
    return (
      <div
        className={cn("inline-flex cursor-pointer", className)}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return <div className={cn("inline-flex", className)}>{content}</div>;
}
```

**Step 2: Export from index**

Add to `src/components/ui/index.ts`:

```typescript
export { default as CompositeAvatar } from "./CompositeAvatar";
```

**Step 3: Typecheck and commit**

```bash
pnpm typecheck
git add src/components/ui/CompositeAvatar.tsx src/components/ui/index.ts
git commit -m "feat: add CompositeAvatar component with CSS-layered rendering"
```

---

## Task 12: Avatar Picker Onboarding Page

**Files:**

- Create: `src/app/(frontend)/(auth)/setup-avatar/page.tsx`

**Step 1: Build the avatar picker page**

Follow the same pattern as `setup-username/page.tsx`. Grid of 8 animals, live preview, continue/skip buttons.

Key behaviors:

- Check auth → redirect to `/login` if not authenticated
- Check if already picked → skip to `next` param
- Grid of tappable animal cards with selected state (ring highlight + bounce)
- Live CompositeAvatar preview of selected animal
- "Continue" → `PATCH /api/users/avatar-config` with animal_id + update `has_picked_avatar` → redirect to next
- "Skip" → assign random animal → redirect to next
- `next` param defaults to `/setup-username`

**Step 2: Typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/(auth)/setup-avatar/
git commit -m "feat: add avatar picker onboarding page"
```

---

## Task 13: Insert Avatar Picker into Auth Flow

**Files:**

- Modify: `src/app/(frontend)/auth/callback/route.ts:41-56` (check has_picked_avatar before username check)
- Modify: `src/app/(frontend)/(auth)/signup/page.tsx` (redirect to /setup-avatar after signup instead of /events)

**Step 1: Update auth callback**

In `auth/callback/route.ts`, after the user upsert, check `has_picked_avatar` in addition to `username`:

```typescript
const { data: profile } = await admin
  .from("users")
  .select("username, has_picked_avatar")
  .eq("id", user.id)
  .maybeSingle();

if (!profile?.has_picked_avatar) {
  const avatarNext = !profile?.username ? `/setup-username?next=${encodeURIComponent(next)}` : next;
  return NextResponse.redirect(`${origin}/setup-avatar?next=${encodeURIComponent(avatarNext)}`);
}

if (!profile?.username) {
  return NextResponse.redirect(`${origin}/setup-username?next=${encodeURIComponent(next)}`);
}
```

**Step 2: Update signup page redirect**

In the signup page's `handlePostSignup`, change the redirect target to go through `/setup-avatar` first.

**Step 3: Typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/auth/callback/route.ts src/app/(frontend)/(auth)/signup/page.tsx
git commit -m "feat: insert avatar picker into post-signup auth flow"
```

---

## Task 14: Shop Page UI

**Files:**

- Create: `src/app/(frontend)/(participant)/shop/page.tsx`
- Create: `src/components/shop/ShopItemCard.tsx`
- Create: `src/components/shop/PurchaseModal.tsx`
- Create: `src/components/shop/TokenBalanceBar.tsx`

**Step 1: Build TokenBalanceBar**

Sticky bar at top of shop page showing current TaraTokens balance with coin icon.

**Step 2: Build ShopItemCard**

Card component showing item image, name, price (with coin icon), rarity badge, and Buy/Owned button.

**Step 3: Build PurchaseModal**

Confirmation modal with:

- Live preview (CompositeAvatar with the item applied)
- Item name, price, current balance
- "Buy" button → calls `POST /api/shop/purchase`
- Error state for insufficient tokens
- Success state with balance update

**Step 4: Build Shop page**

Server component that fetches items, renders tab filter (Accessories | Backgrounds | Borders | Skins) + grid of ShopItemCards. Client wrapper for interactivity.

**Step 5: Typecheck and commit**

```bash
pnpm typecheck
git add src/app/(frontend)/(participant)/shop/ src/components/shop/
git commit -m "feat: add shop page with item cards, purchase modal, and token balance bar"
```

---

## Task 15: Token Balance in Navbar

**Files:**

- Modify: `src/components/layout/Navbar.tsx` (add token balance display near profile)

**Step 1: Add token balance fetch and display**

Add a small coin icon + balance number next to the profile avatar in the navbar. Fetch balance on mount via `/api/tokens`. Show nothing for guests/unauthenticated.

**Step 2: Typecheck and commit**

```bash
pnpm typecheck
git add src/components/layout/Navbar.tsx
git commit -m "feat: show TaraTokens balance in navbar"
```

---

## Task 16: Feature Flag

**Files:**

- Create: `supabase/migrations/20260311_avatar_shop_feature_flag.sql`
- Modify: `src/lib/cms/types.ts` (add flag)
- Modify: `src/lib/supabase/types.ts` (update cms_feature_flags)
- Modify: `src/lib/cms/cached.ts` (add helper)
- Modify: `src/components/admin/FeatureFlagsForm.tsx` (add to admin UI)
- Modify: `src/components/debug/DebugToolPanel.tsx` (add to debug)
- Modify: `src/app/(frontend)/api/feature-flags/route.ts` (add to public API)

**Step 1: Add `avatar_shop_enabled` feature flag across all touchpoints**

Follow the established feature flag pattern documented in memory. Migration inserts the flag row, all TypeScript files get the new flag key.

**Step 2: Typecheck and commit**

```bash
pnpm typecheck
git add supabase/migrations/20260311_avatar_shop_feature_flag.sql src/lib/cms/ src/lib/supabase/types.ts src/components/admin/ src/components/debug/ src/app/(frontend)/api/feature-flags/
git commit -m "feat: add avatar_shop_enabled feature flag"
```

---

## Task 17: Guard All New UI Behind Feature Flag

**Files:**

- Modify: Shop page, avatar picker, navbar token display — wrap in feature flag check

**Step 1: Conditionally render**

- Shop page: check `avatar_shop_enabled` flag, show "Coming Soon" if disabled
- Avatar picker: skip if flag is disabled (redirect straight to setup-username)
- Navbar token balance: hide if flag is disabled

**Step 2: Typecheck and commit**

```bash
pnpm typecheck
git commit -m "feat: guard avatar shop UI behind feature flag"
```

---

## Task 18: Final Verification

**Step 1: Run full CI checks**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

**Step 2: Manual smoke test**

1. Create new account → should see avatar picker
2. Pick an animal → should see it in navbar
3. Visit /shop → should see items with prices
4. Check token balance → should be 0
5. Check in to an event → balance should increase by 50
6. Buy a shop item → balance decreases, item appears in inventory
7. Equip item → avatar updates everywhere

**Step 3: Create PR**

```bash
git push -u origin feat/avatar-shop-tokens
gh pr create --title "feat: animal avatars, TaraTokens, and cosmetic shop" --body "..."
```
