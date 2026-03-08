# EventTara Gamification System Design

**Date:** March 8, 2026
**Scope:** Comprehensive gamification UI/UX enhancements
**Status:** Design Approved

---

## Overview

EventTara has a solid foundation with 26 system badges and avatar borders, but lacks comprehensive UI for discovery, progress tracking, and social engagement. This design implements the missing pieces: achievements page enhancements, profile integration, leaderboards, real-time notifications, Strava activity linking, and social sharing.

---

## 1. Achievements Page Enhancements

### Current State

- Single view of all system badges (26 total)
- Shows earned vs locked with award dates
- Category pills and rarity styling

### Proposed Changes

#### 1.1 Badges Tab (Enhanced)

- **Progress on locked badges:** Show granular progress toward each locked badge
  - Example: "4/5 events completed" with progress bar
  - Distance badges: "30km / 100km toward Ultra Marathoner"
  - Summit badges: "3 / 5 mountains summited"
- **Share button** on earned badges: Quick access to share badge to social media
- **Expand/collapse:** View full criteria hint and progress details

#### 1.2 Borders Tab (New)

- Dedicated tab showing all avatar borders (currently on profile only)
- Display format: Similar to badges grid
  - Border preview showing avatar styling
  - Tier badge (common/rare/epic/legendary)
  - Lock/unlock status with criteria requirement
  - Sorted by tier: common → legendary
- Clicking unlocked border shows preview in large modal with styling details

#### 1.3 Leaderboards Tab (New)

- Three sub-sections accessible via toggle: Global / Friends
- Four leaderboard views:
  1. **Most Badges** — ranked by total earned badges
  2. **Most Summits** — ranked by distinct mountains summited
  3. **Highest Rarity** — ranked by rarity sum (legendary = 4 pts, epic = 3, etc.)
  4. **Most Active** — ranked by completed events (check-ins)
- Display: Top 10-20 users with rank, user avatar, name, metric value
- Highlight user's own rank if in top 50; show "You: #47" if outside top 10

---

## 2. Profile Page Enhancements

### 2.1 Badge Showcase Section

**Location:** Upper section after ProfileHeader, before stats
**Display:**

- **Top 8 earned badges** featured in a clean grid
- User can customize which 8 badges to showcase (via settings modal)
- Default sorting: by rarity (legendary first, then epic, rare, common)
- Each badge card shows:
  - Badge emoji/image
  - Title
  - Award date (small text)
  - Rarity ring styling
- Action button: "Configure showcase" → opens modal to select/reorder badges

**Fallback:** If user has <8 badges, show all earned badges

### 2.2 Border Customization Modal

**Location:** Profile settings (accessible from profile page)
**Sections:**

1. **Active Border Preview**
   - Large avatar preview with currently selected border
   - Dropdown to switch active border (only from unlocked borders)

2. **Unlocked Borders**
   - Grid showing all earned borders
   - Click to preview on avatar
   - Currently active border highlighted

3. **Locked Borders**
   - Grid showing unavailable borders (grayed out)
   - Show criteria requirement and progress (e.g., "Hike 3/5 events to unlock")
   - Criteria requirement text

---

## 3. Real-time Badge/Border Unlock Notifications

### 3.1 Modal Celebration

**Trigger:** User earns badge or border during event check-in
**Display:** Full-screen modal (z-index above chat panel) with:

- Confetti animation (canvas-confetti)
- Large badge/border display (4x normal size)
- "🎉 Badge Earned!" or "🎉 Border Unlocked!" header
- Badge/border title and rarity
- **NEW:** "Linked activities:" section showing Strava activities that contributed
  - Show activity name, distance, date, link to Strava
  - If no Strava activities, show generic "Event completed"
- Action buttons:
  - "Close" (dismiss modal)
  - "Share" (open share sheet)

### 3.2 Notification Center Entry

**Table:** `notifications`
**New notification type:**

- `badge_earned` — title: "Badge Earned", body: badge name
- `border_earned` — title: "Border Unlocked", body: border name
- Both include metadata: badge_id/border_id, rarity, award date
- Persist in notification center for user review

---

## 4. Strava Activity Linking

### 4.1 Badge Detail View

**Route:** `/badges/[id]` (already exists, enhance)
**New section:** "Linked Activities"

- If badge is earned:
  - Fetch all `strava_activities` records with matching `booking_id`s from events that contributed to this badge
  - Display as cards: activity name, distance, date, duration, elevation gain
  - Link to Strava activity URL
  - If multiple activities, show 3-5 most recent
- If badge is locked:
  - Show example activities that would count toward this badge
  - Instructions for how to earn

### 4.2 Profile Badge Cards

- Each featured badge on profile shows small "Activity" link if Strava activity exists
- Hover/click reveals Strava activity snippet

---

## 5. Social Sharing

### 5.1 Badge Share Card

**UI:** Share button on earned badges (achievements page + profile)
**Options:**

- Twitter
- Facebook
- Copy link
- Copy image (badge card as image)

**Share Format:**

- Custom OG metadata: `og:image` = badge card graphic
- URL: `eventtara.com/badges/[badge-id]?user=[username]`
- Message: "{user} just earned the {badge} badge on EventTara! 🎉"

### 5.2 Badge Share Landing Page (New)

**Route:** `/badges/[id]?user=[username]`
**Display:**

- Large badge showcase
- User info (avatar, name, link to profile)
- Badge details (description, earned date, rarity)
- "Earn this badge on EventTara" call-to-action button
- OG metadata for social previews

---

## 6. Data Model & API Changes

### 6.1 New Tables/Columns

**`user_badge_showcase` (new)**

```sql
CREATE TABLE user_badge_showcase (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
```

**`badge_shares` (optional, for analytics)**

```sql
CREATE TABLE badge_shares (
  id UUID PRIMARY KEY,
  badge_id UUID NOT NULL REFERENCES badges(id),
  user_id UUID NOT NULL REFERENCES users(id),
  platform TEXT NOT NULL, -- 'twitter', 'facebook', 'link_copy'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6.2 API Routes

**GET `/api/leaderboards/[type]`**

- Query params: `metric=most_badges|most_summits|highest_rarity|most_active`, `scope=global|friends`, `limit=20`
- Response: `{ leaderboards: [{ rank, user_id, full_name, avatar_url, metric_value }] }`

**GET `/api/badges/[id]/strava-activities`**

- Response: `{ activities: [{ id, name, distance, date, moving_time, strava_url }] }`

**GET `/api/badges/[id]/share`**

- Query: `platform=twitter|facebook`
- Response: `{ url, image_url, message }`

**POST `/api/badges/showcase`**

- Body: `{ badge_ids: [id1, id2, ...], order: [1, 2, ...] }`
- Updates `user_badge_showcase` table

**POST `/api/badges/[id]/share` (optional)**

- Logs share to `badge_shares` table

---

## 7. Component Architecture

### New/Modified Components

**Achievements Page:**

- `AchievementsPage` — add Borders tab + Leaderboards tab
- `BadgeGrid` — enhance with progress bars + share buttons
- `BorderGrid` (new) — display borders with preview modal
- `LeaderboardView` (new) — render leaderboards with metric toggle

**Profile Page:**

- `BadgeShowcase` (new) — featured 8 badges section
- `BorderCustomizationModal` (new) — settings modal for active border + preview
- Enhance `BadgeGrid` to show featured badges only

**Shared Components:**

- `BadgeUnlockModal` (new) — celebration modal for unlock events
- `BadgeShareSheet` (new) — share options (Twitter, Facebook, copy link)
- `BadgeCard` (enhance) — add progress bar, share button, Strava activity link
- `BorderCard` (new) — similar to BadgeCard, show criteria + preview button

---

## 8. User Flows

### 8.1 Earn Badge During Check-in

1. User checks in to event
2. Badge earned (backend determines)
3. Modal appears with confetti → celebration
4. Modal shows linked Strava activities (if connected)
5. User clicks "Share" → share sheet, or "Close"
6. Notification logged to notification center

### 8.2 View Achievements

1. User navigates to `/achievements`
2. Default view: Badges tab
3. Can switch to Borders or Leaderboards
4. Badges show progress on locked ones
5. Click earned badge → detail page with Strava activities
6. Click share → share to social

### 8.3 Customize Profile Badge Showcase

1. User on own profile
2. Click "Configure showcase" button on badge section
3. Modal opens: select/reorder 8 badges
4. Save → updates `user_badge_showcase` table
5. Profile updates to show selected badges

---

## 9. Feature Flag

**Flag:** `coming_soon_gamification` (currently disabled)
**Impact:**

- Leaderboards hidden if flag is false
- Badge showcase on profile shows all badges if flag is false
- Strava activity linking hidden if flag is false

When shipping: set to `true` in CMS

---

## 10. Success Metrics

- Users viewing achievements page (engagement)
- Badge shares to social media (virality)
- Leaderboard page views (competitive engagement)
- Border customization actions (personalization)
- Unlock notification click-through (engagement on achievement)

---

## 11. Out of Scope (Future)

- Badge trading/gifting
- Achievement streaks/challenges
- Team/group badges
- Dynamic badge unlock animations per badge type
- Badge progression (bronze → silver → gold versions)
