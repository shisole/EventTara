# Animal Avatar, TaraTokens & Cosmetic Shop Design

**Date:** 2026-03-11

## Overview

Animal avatar system with virtual currency (TaraTokens) and cosmetic shop. Users pick a cute baby animal avatar during onboarding, earn tokens through platform activity, and spend them on cosmetic items in the shop.

## Data Model

### New Tables

**`avatar_animals`** — Starter animal catalog (6-8 animals)

- `id`, `slug` (bear, cat, dog, bunny, fox, panda, koala, frog), `name`, `image_url`, `sort_order`

**`tara_tokens`** — Cached balance per user

- `user_id` (PK, FK users), `balance` (int, default 0), `updated_at`

**`token_transactions`** — Immutable append-only ledger

- `id`, `user_id`, `amount` (+/-), `reason` (enum: check_in, hosting, daily_login, streak_bonus, milestone, purchase, admin_grant), `reference_id` (nullable, e.g. event_id or shop_item_id), `created_at`

**`shop_items`** — Items available for purchase

- `id`, `slug`, `name`, `category` (accessory, background, border, skin), `image_url`, `price` (int, tokens), `rarity` (common, uncommon, rare, legendary), `is_active`, `sort_order`, `created_at`

**`user_inventory`** — Purchased items per user

- `id`, `user_id`, `shop_item_id`, `purchased_at`
- Unique constraint on (user_id, shop_item_id)

**`user_avatar_config`** — Equipped state per user

- `user_id` (PK, FK users), `animal_id` (FK avatar_animals), `equipped_accessory_id` (FK shop_items, nullable), `equipped_background_id` (FK shop_items, nullable), `equipped_border_id` (FK shop_items, nullable), `equipped_skin_id` (FK shop_items, nullable), `updated_at`

### Users Table Additions

- `has_picked_avatar` (boolean, default false)
- `last_daily_login` (date, nullable)
- `login_streak` (int, default 0)

## TaraTokens Economy

### Earning Rates

| Action                   | Tokens | Frequency    |
| ------------------------ | ------ | ------------ |
| Event check-in           | 50     | Per event    |
| Hosting an event         | 100    | Per event    |
| Daily login              | 5      | Once/day     |
| 7-day login streak       | 25     | Weekly bonus |
| Badge earned (common)    | 50     | On award     |
| Badge earned (rare)      | 100    | On award     |
| Badge earned (legendary) | 200    | On award     |
| First event attended     | 100    | One-time     |
| Buy tokens (real money)  | TBD    | Deferred     |

### Balance Rules

- Balance can never go negative
- Ledger is immutable (append-only)
- Cached balance in `tara_tokens` updated atomically with transactions
- Shop purchases use atomic Postgres RPC (check balance + deduct + add inventory in one call)

## Avatar Composition & Rendering

### `<CompositeAvatar>` Component

CSS layering approach — stacks flat 2D images with absolute positioning:

```
Layer stack (bottom to top):
  Background (z-0)  ← shop background or default solid color
  Animal (z-10)     ← base animal SVG
  Accessory (z-20)  ← hat/scarf/glasses, optional
  Border (z-30)     ← existing border system or premium shop border
```

- Sizes: sm (32px), md (48px), lg (80px), xl (128px)
- Falls back to photo-based UserAvatar if no animal picked
- Asset URLs point to Supabase Storage `avatar-assets/` bucket

### Asset Storage Structure

```
avatar-assets/
  animals/       ← bear.svg, cat.svg, etc.
  accessories/   ← hat-beanie.svg, scarf-red.svg, etc.
  backgrounds/   ← gradient-sunset.svg, mountain-scene.svg, etc.
  borders/       ← premium-gold.svg, premium-neon.svg, etc.
```

## Shop UI & Purchase Flow

**Route:** `/shop` under `(participant)` route group

**Layout:**

- Sticky balance bar at top showing current TaraTokens
- Tab filter: Accessories | Backgrounds | Borders | Skins
- Grid of item cards showing preview, name, price, buy/owned status

**Purchase flow:**

1. Tap "Buy" → confirmation modal with live preview (item on user's avatar)
2. Confirm → `POST /api/shop/purchase` (atomic RPC)
3. Success → item added to inventory, balance updated
4. Insufficient tokens → "Not enough tokens" message

**Equipping:** Tap owned items to equip/unequip. One item per slot. Saves via `PATCH /api/users/avatar-config`.

### API Routes

- `GET /api/shop/items` — list items (filterable by category)
- `POST /api/shop/purchase` — atomic purchase RPC
- `GET /api/users/inventory` — user's owned items
- `PATCH /api/users/avatar-config` — update equipped items

## Onboarding Flow

**New page:** `/setup-avatar` inserted into post-signup chain:

```
Signup → /setup-avatar (pick animal) → /setup-username → /feed
```

- Grid of 6-8 animals as tappable cards with bounce animation on select
- Live preview shows selected animal in CompositeAvatar with default background
- "Continue" saves pick and redirects to /setup-username
- "Skip" assigns random animal, user can pick later from profile settings

## Migration Strategy

**No breaking changes.** Purely additive.

**Rendering priority:**

1. Has `user_avatar_config` with animal → composite avatar
2. Has `avatar_url` (photo) but no animal → current photo-based UserAvatar
3. Neither → default initials circle

**Rollout order:**

1. DB migration + seed data (animals + initial shop items)
2. Token earning hooks (check-in, booking, hosting flows)
3. CompositeAvatar component (replace UserAvatar across all sites)
4. Avatar picker onboarding page (/setup-avatar)
5. Shop page (/shop)
6. Token balance display in navbar
