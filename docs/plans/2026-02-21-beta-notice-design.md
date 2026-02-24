# Beta Notice Modal Design

**Date:** 2026-02-21
**Status:** Approved
**Implementation:** Pending

## Overview

Add a user-friendly modal/popup that appears on the landing page to inform visitors that EventTara is in beta and currently displays sample/demo data for demonstration purposes.

## Requirements

- **Format:** Modal/popup that appears on page load
- **Frequency:** Once per user (dismissible forever using localStorage)
- **Tone:** Friendly & Educational (non-technical language)
- **Action:** Single "Got it" button to dismiss
- **Persistence:** LocalStorage to track dismissal across sessions

## User Story

As a visitor landing on EventTara for the first time, I want to understand that I'm viewing a beta preview with sample data, so I know that the events and bookings are demonstrations and not real.

## Approach

### Selected: Inline Client Component

We're implementing a simple client-side modal component that lives alongside the landing page. This approach:

- Requires no additional dependencies
- Matches existing Tailwind CSS design system
- Keeps code simple and maintainable
- Provides exactly what's needed without over-engineering

### Alternatives Considered

1. **Reusable Modal with Context:** Too complex for a single-use case
2. **Third-party library (Headless UI):** Adds unnecessary dependencies

## Architecture

### File Structure

```
src/
├── components/
│   └── landing/
│       └── BetaNoticeModal.tsx  (new Client Component)
└── app/
    └── (frontend)/
        └── page.tsx  (modified to include the modal)
```

### Component Hierarchy

- Landing page (`page.tsx`) remains a Server Component
- Import and render `<BetaNoticeModal />` at the top of the page JSX
- `BetaNoticeModal` is a Client Component that manages its own visibility state

## Component Design

### BetaNoticeModal.tsx

**Type:** Client Component (`"use client"`)

**State:**

- `isOpen: boolean` - Controls modal visibility (starts `false`, becomes `true` if localStorage check passes)

**Lifecycle:**

1. Component mounts
2. `useEffect` checks localStorage for `"beta-notice-dismissed"` key
3. If not found, sets `isOpen = true` to display modal
4. User clicks "Got it" → stores dismissal → closes modal
5. Future visits: localStorage check finds the key → modal stays closed

**Props:** None (self-contained)

## UI Design

### Visual Elements

**Backdrop:**

- Full-screen overlay
- Semi-transparent dark background (`bg-black/60`)
- Fixed positioning with z-index to overlay all content

**Modal Box:**

- Centered card (flexbox center)
- Max width: ~500px for readability
- White background with shadow (consistent with existing Card component)
- Rounded corners (`rounded-2xl`)
- Comfortable padding (`p-8`)

**Content:**

- **Icon:** 🎉 or 🚀 emoji at top for friendly feel
- **Title:** "Welcome to EventTara Beta!" in `font-heading` font (Plus Jakarta Sans)
- **Message:**
  > "Welcome! You're exploring a preview of EventTara with sample events and demo bookings. Everything you see is for demonstration purposes to show you how the platform works."
- **Button:** Primary lime-colored button ("Got it") matching design system

### Color Scheme

- Backdrop: `bg-black/60`
- Modal: `bg-white dark:bg-slate-800`
- Title: `text-gray-900 dark:text-white`
- Message: `text-gray-600 dark:text-gray-400`
- Button: `bg-lime-500 hover:bg-lime-400 text-slate-900`

### Animation

- **Modal appear:** Fade-in (opacity 0 → 1) + subtle scale (95% → 100%)
- **Modal dismiss:** Fade-out + scale down
- **Transition duration:** ~200-300ms for smooth feel

### Accessibility

- `role="dialog"` on modal
- `aria-modal="true"` to indicate modal state
- `aria-labelledby` pointing to title
- Focus management: focus trapped within modal when open
- Keyboard support: Escape key dismisses modal
- Click outside backdrop dismisses modal (UX preference)

## Data Flow & Storage

### LocalStorage Strategy

**Key:** `"beta-notice-dismissed"`
**Value:** `"true"` (string)

### Flow Diagram

```
User visits landing page
         ↓
Component mounts (client-side)
         ↓
Check localStorage["beta-notice-dismissed"]
         ↓
    ┌────┴────┐
    ↓         ↓
  Exists   Not found
    ↓         ↓
Stay closed  Show modal
              ↓
         User clicks "Got it"
              ↓
    Set localStorage = "true"
              ↓
         Close modal
              ↓
    Never shows again
```

### Code Flow

**1. Component Mount:**

```typescript
useEffect(() => {
  const dismissed = localStorage.getItem("beta-notice-dismissed");
  if (!dismissed) {
    setIsOpen(true);
  }
}, []);
```

**2. User Dismisses:**

```typescript
const handleDismiss = () => {
  localStorage.setItem("beta-notice-dismissed", "true");
  setIsOpen(false);
};
```

**3. Future Visits:**

- LocalStorage persists across browser sessions
- Modal never appears again for that browser/device
- Only clearing browser data will reset it

## Edge Cases

### LocalStorage Unavailable

- **Scenario:** Private browsing mode or localStorage disabled
- **Behavior:** Modal will show on every visit (graceful degradation)
- **Impact:** Minor annoyance but still functional

### Server-Side Rendering

- **Issue:** Modal state must start `false` to prevent hydration mismatch
- **Solution:** Only check localStorage and set `isOpen = true` in `useEffect` (client-side only)
- **Result:** Modal briefly invisible during hydration, then appears if needed

### Multiple Tabs/Windows

- **Scenario:** User opens EventTara in multiple tabs
- **Behavior:** Dismissing in one tab prevents it from showing in new tabs (localStorage is shared per origin)
- **Impact:** Expected behavior, no issues

### Browser Data Clearing

- **Scenario:** User clears browsing data
- **Behavior:** Modal will appear again on next visit
- **Impact:** Acceptable, user explicitly cleared data

## Future Enhancements

If needed later, we can:

1. **Versioned notices:** Change key to `"beta-notice-dismissed-v2"` for new important messages
2. **Expiry dates:** Add timestamp to localStorage, re-show after X days
3. **Different notices per page:** Use page-specific keys like `"beta-notice-dismissed-events"`
4. **Analytics:** Track modal views/dismissals (would require backend)

Not implementing now to keep it simple (YAGNI principle).

## Implementation Checklist

- [ ] Create `src/components/landing/BetaNoticeModal.tsx`
- [ ] Add client component with modal UI
- [ ] Implement localStorage check and storage
- [ ] Add accessibility features (ARIA, keyboard, focus trap)
- [ ] Add animations with Tailwind
- [ ] Import and render in `src/app/(frontend)/page.tsx`
- [ ] Test on different browsers
- [ ] Test localStorage persistence
- [ ] Test with localStorage disabled
- [ ] Test keyboard navigation (Escape, Tab)
- [ ] Verify dark mode styling
- [ ] Verify responsive design (mobile, tablet, desktop)

## Success Criteria

✅ Modal appears on first visit to landing page
✅ Modal does not appear on subsequent visits
✅ "Got it" button dismisses modal permanently
✅ Modal is visually consistent with EventTara design
✅ Message uses friendly, non-technical language
✅ Works in light and dark mode
✅ Accessible via keyboard
✅ Gracefully degrades if localStorage unavailable
✅ No hydration errors in Next.js

## Notes

- Keep the message concise and friendly
- Ensure modal doesn't block critical functionality
- Consider A/B testing message variations later
- May want to add a "Learn More" link in future iterations
