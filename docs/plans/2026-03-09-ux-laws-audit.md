# EventTara UX Laws Audit Report

**Date:** 2026-03-09
**Scope:** Full site audit against 14 UX laws
**Laws audited:** Fitts' Law, Hick's Law, Doherty Threshold, Peak-End Rule, Zeigarnik Effect, Goal Gradient, Von Restorff, Serial Position, Aesthetic-Usability, Jakob's Law, Miller's Law, Tesler's Law, Postel's Law, Gestalt Principles

---

## Scorecard Summary

| Page / Area              | Score | Critical Violations                                                                                                      |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| Landing / Home           | 11/14 | Hick's (hero CTAs), Doherty (carousel load), Miller's (nav overflow)                                                     |
| Login / Signup           | 12/14 | Hick's (4 auth methods), Doherty (no skeleton)                                                                           |
| Guest Setup              | 13/14 | Zeigarnik (no progress indicator)                                                                                        |
| Explore Events           | 10/14 | Hick's (filter overload), Miller's (12+ filter combos), Von Restorff (badges identical), Doherty (no skeleton)           |
| Event Detail             | 11/14 | Miller's (15+ info pieces), Hick's (multiple CTAs), Doherty (map load)                                                   |
| Booking Flow             | 11/14 | Zeigarnik (no step indicator), Doherty (no optimistic UI), Goal Gradient (no progress)                                   |
| Dashboard Sidebar        | 10/14 | Hick's (6+ nav sections), Miller's (15+ menu items), Serial Position (deep nesting), Tesler's (hidden complexity)        |
| Event Form (Create/Edit) | 9/14  | Miller's (15+ fields), Hick's (many dropdowns), Zeigarnik (no progress), Goal Gradient (no steps), Doherty (no autosave) |
| Check-in Page            | 12/14 | Doherty (QR scan feedback), Fitts' (small manual input)                                                                  |
| Profile Page             | 11/14 | Hick's (8-10 sections), Miller's (type breakdown), Von Restorff (stats identical)                                        |
| Guide Detail             | 12/14 | Von Restorff (stats identical), Miller's (6+ sections on load)                                                           |
| About Page               | 12/14 | Fitts' (CTA buttons small on mobile), Zeigarnik (no engagement hooks)                                                    |
| Contact Page             | 13/14 | Doherty (no timeout feedback)                                                                                            |
| Activity Feed            | 11/14 | Peak-End (no scroll end), Goal Gradient (no milestones), Gestalt (card boundaries)                                       |
| Reviews                  | 12/14 | Postel's (no char counter), Fitts' (small submit button)                                                                 |
| Navbar / Mobile Nav      | 11/14 | Hick's (6+ dropdown items), Gestalt (top/bottom nav split)                                                               |
| Footer                   | 12/14 | Hick's (10+ links)                                                                                                       |
| Event Card               | 10/14 | Hick's (10+ details), Miller's (badge overload), Von Restorff (badges identical), Gestalt (badge grouping)               |

---

## Violations by Law (Sorted by Frequency)

### 1. Hick's Law — 10 violations (MOST COMMON)

Excessive choices slow decision-making.

| Page              | Issue                                                                    | Suggested Fix                                                               |
| ----------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Landing           | Hero has multiple CTAs competing for attention                           | Single primary CTA; secondary as text link                                  |
| Login/Signup      | 4 auth methods (email, Google, Strava, guest)                            | Progressive disclosure — show email + Google first, "More options" for rest |
| Explore Events    | 12+ filter combinations                                                  | Show 3 primary filters; "Advanced" toggle for rest                          |
| Event Detail      | Multiple action buttons (book, share, review, map)                       | Clear visual hierarchy — one primary CTA                                    |
| Dashboard Sidebar | 6+ sections, 15+ menu items                                              | Collapse secondary sections by default                                      |
| Event Form        | Many dropdown/select fields                                              | Group into wizard steps                                                     |
| Profile           | 8-10 major sections                                                      | Tab interface or lazy-load below fold                                       |
| Navbar Dropdown   | 6+ items (Admin, Dashboard, Profile, My Events, Border, Theme, Sign Out) | Move "Change Border" to profile settings; keep 4 items max                  |
| Footer            | 10+ links across 3-4 sections                                            | Collapse to 2 sections; "More" link                                         |
| Event Card        | 10+ pieces of info (badges, price, date, location, rating, spots)        | Show 5 key items; reveal rest on hover/tap                                  |

### 2. Miller's Law — 7 violations

Information exceeding 7 items overwhelms working memory.

| Page              | Issue                                     | Suggested Fix                                  |
| ----------------- | ----------------------------------------- | ---------------------------------------------- |
| Explore Events    | 12+ filter options simultaneously visible | Group into categories; max 5 visible           |
| Event Detail      | 15+ discrete pieces of info on page       | Section with progressive disclosure            |
| Event Form        | 15+ form fields in single view            | Multi-step wizard (3-4 steps)                  |
| Dashboard Sidebar | 15+ menu items visible                    | Collapsible sections; show active section only |
| Profile           | Activity type breakdown can exceed 7      | Show top 3 types; "See all" link               |
| Event Card        | 10+ visual elements per card              | Simplify to 5 on mobile                        |
| Landing Nav       | Overflow on mobile with many links        | Hamburger with prioritized items               |

### 3. Doherty Threshold — 6 violations

System response > 400ms without feedback feels broken.

| Page           | Issue                                      | Suggested Fix                              |
| -------------- | ------------------------------------------ | ------------------------------------------ |
| Landing        | Hero carousel images load without skeleton | Add shimmer/skeleton placeholder           |
| Login/Signup   | Auth redirect has no loading indicator     | Full-screen spinner with "Signing in..."   |
| Explore Events | Filter changes have no loading state       | Skeleton grid while fetching               |
| Event Detail   | Leaflet map loads without placeholder      | Map skeleton with "Loading map..."         |
| Booking        | No optimistic UI after submit              | Immediate success state; rollback on error |
| Contact        | No timeout feedback for slow email send    | Show timeout message after 5s              |

### 4. Von Restorff Effect — 4 violations

When everything looks the same, nothing stands out.

| Page           | Issue                                          | Suggested Fix                                  |
| -------------- | ---------------------------------------------- | ---------------------------------------------- |
| Profile        | Stats cards all identically styled             | Different accent colors per stat               |
| Guide Detail   | 3 stats boxes identical in appearance          | Distinct icons and background tints            |
| Event Card     | Type/difficulty/distance badges all same style | Different colors or icon shapes per badge type |
| Explore Events | All filter pills look identical                | Active filters in distinct color               |

### 5. Zeigarnik Effect — 4 violations

Incomplete tasks stick in memory — use this to motivate users.

| Page         | Issue                                       | Suggested Fix                                     |
| ------------ | ------------------------------------------- | ------------------------------------------------- |
| Guest Setup  | No progress indicator                       | Step dots (1 of 2)                                |
| Booking Flow | No step indicator (select → confirm → done) | Progress bar                                      |
| Event Form   | No save progress indication                 | Step wizard with progress; autosave indicator     |
| About Page   | Story concludes without engagement hook     | Add "Join the community" or "What's next?" teaser |

### 6. Goal Gradient — 3 violations

Users accelerate as they approach a goal.

| Page          | Issue                                | Suggested Fix                        |
| ------------- | ------------------------------------ | ------------------------------------ |
| Booking Flow  | No visual progress toward completion | 3-step progress bar                  |
| Event Form    | No sense of completion progress      | Step indicator showing "Step 2 of 4" |
| Activity Feed | Infinite scroll with no milestones   | "You've seen 20 activities" markers  |

### 7. Gestalt Principles — 3 violations

Visual grouping affects perception.

| Page          | Issue                                            | Suggested Fix                                             |
| ------------- | ------------------------------------------------ | --------------------------------------------------------- |
| Activity Feed | Cards blend into background; no clear boundaries | Subtle border or alternating backgrounds                  |
| Mobile Nav    | Top navbar + bottom nav = split attention        | Consider unified hamburger/drawer pattern                 |
| Event Card    | Badges not visually grouped by category          | Position badges by type (status top-left, details bottom) |

### 8. Fitts' Law — 3 violations

Larger, closer targets are easier to hit.

| Page       | Issue                                   | Suggested Fix                  |
| ---------- | --------------------------------------- | ------------------------------ |
| About Page | CTA buttons small on mobile (px-8 py-3) | `w-full sm:w-auto` on mobile   |
| Reviews    | Submit button size="sm"                 | Increase to size="md"          |
| Check-in   | Manual participant ID input is small    | Larger input with autocomplete |

### 9. Postel's Law — 2 violations

Be liberal in what you accept, strict in what you produce.

| Page       | Issue                                   | Suggested Fix               |
| ---------- | --------------------------------------- | --------------------------- |
| ReviewForm | No character counter for 500-char limit | Show "X/500" below textarea |
| Contact    | No feedback on processing delays        | Timeout message after 5s    |

### 10. Tesler's Law — 2 violations

Every system has irreducible complexity — surface it correctly.

| Page              | Issue                                                        | Suggested Fix                     |
| ----------------- | ------------------------------------------------------------ | --------------------------------- |
| Dashboard Sidebar | Hidden sections require learning navigation structure        | Onboarding tooltip on first visit |
| Event Form        | Complex fields (date range, location, pricing) need guidance | Inline help text or info tooltips |

### 11. Serial Position — 1 violation

Users remember first and last items best.

| Page              | Issue                                         | Suggested Fix                                           |
| ----------------- | --------------------------------------------- | ------------------------------------------------------- |
| Dashboard Sidebar | Important items buried in middle of long list | Pin critical items (Events, Settings) to top and bottom |

### 12. Peak-End Rule — 1 violation

Users judge experience by its peak and end.

| Page          | Issue                                   | Suggested Fix                                          |
| ------------- | --------------------------------------- | ------------------------------------------------------ |
| Activity Feed | Infinite scroll has no memorable ending | "You're all caught up!" message with suggested actions |

---

## Top 10 Highest-Impact Fixes

Ranked by frequency of violation x number of users affected:

| #   | Fix                                                       | Laws Addressed                              | Pages Affected                          | Effort |
| --- | --------------------------------------------------------- | ------------------------------------------- | --------------------------------------- | ------ |
| 1   | **Multi-step Event Form wizard**                          | Miller's, Hick's, Zeigarnik, Goal Gradient  | EventForm                               | High   |
| 2   | **Simplify Event Card — hide secondary badges on mobile** | Hick's, Miller's, Von Restorff              | EventCard, Explore                      | Medium |
| 3   | **Add skeleton/loading states for async content**         | Doherty Threshold                           | Landing, Explore, Event Detail, Booking | Medium |
| 4   | **Collapse Dashboard Sidebar sections**                   | Hick's, Miller's, Serial Position, Tesler's | Dashboard                               | Medium |
| 5   | **Progressive disclosure for auth methods**               | Hick's                                      | Login, Signup                           | Low    |
| 6   | **Reduce Explore filter visibility**                      | Hick's, Miller's                            | Explore Events                          | Low    |
| 7   | **Add progress indicators to booking flow**               | Zeigarnik, Goal Gradient                    | Booking                                 | Low    |
| 8   | **Differentiate stats/badge styling**                     | Von Restorff                                | Profile, Guide, Event Card              | Low    |
| 9   | **"You're all caught up" feed ending**                    | Peak-End, Goal Gradient                     | Feed                                    | Low    |
| 10  | **Full-width mobile CTAs**                                | Fitts' Law                                  | About, Reviews                          | Low    |

---

## What's Working Well

The site scores consistently high on:

- **Jakob's Law** — Follows established UI patterns (social profiles, event cards, nav layout)
- **Aesthetic-Usability** — Clean design, dark mode, proper spacing throughout
- **Serial Position** — Important elements placed at start/end of pages
- **Peak-End Rule** — Most flows have satisfying success states
- **Postel's Law** — Graceful handling of missing data across the board
- **Gestalt (Proximity)** — Related content grouped consistently

---

## Methodology

Audited by scanning all page components, layouts, and interactive elements against each of the 14 UX laws. Pages grouped into 4 audit zones:

1. Landing + Auth (home, login, signup, guest-setup, forgot/reset-password)
2. Events + Booking (explore, event detail, booking form, reviews)
3. Dashboard + Organizer (sidebar, event form, check-in, badges, settings)
4. Profile + Guides + Feed (profile, guide detail, about, contact, feed, nav/footer)
