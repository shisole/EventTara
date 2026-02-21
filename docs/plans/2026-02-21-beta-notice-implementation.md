# Beta Notice Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a user-friendly modal to the landing page that informs first-time visitors about beta status and sample data.

**Architecture:** Client-side modal component using React state and localStorage for dismissal tracking. Modal renders conditionally on landing page, checks localStorage on mount, and persists dismissal permanently.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, localStorage API

---

## Task 1: Create BetaNoticeModal Component Structure

**Files:**
- Create: `src/components/landing/BetaNoticeModal.tsx`

**Step 1: Create the component directory**

```bash
mkdir -p src/components/landing
```

**Step 2: Create the basic component file**

Create `src/components/landing/BetaNoticeModal.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

export default function BetaNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);

  return null; // Placeholder
}
```

**Step 3: Verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds with no errors in BetaNoticeModal.tsx

**Step 4: Commit**

```bash
git add src/components/landing/BetaNoticeModal.tsx
git commit -m "feat: create BetaNoticeModal component structure"
```

---

## Task 2: Implement LocalStorage Check Logic

**Files:**
- Modify: `src/components/landing/BetaNoticeModal.tsx`

**Step 1: Add localStorage check in useEffect**

Update `src/components/landing/BetaNoticeModal.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "beta-notice-dismissed";

export default function BetaNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the notice
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return <div>Modal Placeholder</div>;
}
```

**Step 2: Test in browser**

Manual test:
1. Start dev server: `npm run dev`
2. Open browser console
3. Clear localStorage: `localStorage.clear()`
4. Refresh page → should see "Modal Placeholder"
5. Set dismissed: `localStorage.setItem("beta-notice-dismissed", "true")`
6. Refresh → placeholder should not appear

**Step 3: Commit**

```bash
git add src/components/landing/BetaNoticeModal.tsx
git commit -m "feat: add localStorage check logic to BetaNoticeModal"
```

---

## Task 3: Build Modal UI Structure

**Files:**
- Modify: `src/components/landing/BetaNoticeModal.tsx`

**Step 1: Add modal backdrop and container**

Update the return statement in `BetaNoticeModal.tsx`:

```tsx
if (!isOpen) return null;

return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
    role="dialog"
    aria-modal="true"
    aria-labelledby="beta-notice-title"
  >
    {/* Modal Box */}
    <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
      {/* Content will go here */}
      <button onClick={handleDismiss}>Close (temp)</button>
    </div>
  </div>
);
```

**Step 2: Test backdrop styling**

Manual test:
1. Clear localStorage in browser
2. Refresh page
3. Verify: dark backdrop appears, modal box is centered, has rounded corners
4. Verify: clicking "Close (temp)" dismisses modal

**Step 3: Commit**

```bash
git add src/components/landing/BetaNoticeModal.tsx
git commit -m "feat: add modal backdrop and container structure"
```

---

## Task 4: Add Modal Content (Icon, Title, Message)

**Files:**
- Modify: `src/components/landing/BetaNoticeModal.tsx`

**Step 1: Add complete modal content**

Update the modal box content in `BetaNoticeModal.tsx`:

```tsx
<div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
  {/* Icon */}
  <div className="text-center mb-4">
    <span className="text-5xl" role="img" aria-label="celebration">
      🎉
    </span>
  </div>

  {/* Title */}
  <h2
    id="beta-notice-title"
    className="text-2xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4"
  >
    Welcome to EventTara Beta!
  </h2>

  {/* Message */}
  <p className="text-center text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
    Welcome! You're exploring a preview of EventTara with sample events and demo bookings.
    Everything you see is for demonstration purposes to show you how the platform works.
  </p>

  {/* Button */}
  <button
    onClick={handleDismiss}
    className="w-full py-3 px-6 bg-lime-500 hover:bg-lime-400 text-slate-900 font-semibold rounded-xl transition-colors"
  >
    Got it
  </button>
</div>
```

**Step 2: Test content display**

Manual test:
1. Clear localStorage
2. Refresh page
3. Verify: 🎉 emoji displays at top
4. Verify: Title is in heading font and centered
5. Verify: Message text is readable and centered
6. Verify: "Got it" button is full-width with lime background
7. Test dark mode toggle (if available) → verify text colors

**Step 3: Commit**

```bash
git add src/components/landing/BetaNoticeModal.tsx
git commit -m "feat: add modal content (icon, title, message, button)"
```

---

## Task 5: Add Animations with Tailwind

**Files:**
- Modify: `src/components/landing/BetaNoticeModal.tsx`

**Step 1: Add animation state**

Update component to include animation classes:

```tsx
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "beta-notice-dismissed";

export default function BetaNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsOpen(true);
      // Trigger animation after mount
      setTimeout(() => setIsVisible(true), 10);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      setIsOpen(false);
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-notice-title"
      onClick={handleDismiss}
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="text-center mb-4">
          <span className="text-5xl" role="img" aria-label="celebration">
            🎉
          </span>
        </div>

        {/* Title */}
        <h2
          id="beta-notice-title"
          className="text-2xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4"
        >
          Welcome to EventTara Beta!
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          Welcome! You're exploring a preview of EventTara with sample events and demo bookings.
          Everything you see is for demonstration purposes to show you how the platform works.
        </p>

        {/* Button */}
        <button
          onClick={handleDismiss}
          className="w-full py-3 px-6 bg-lime-500 hover:bg-lime-400 text-slate-900 font-semibold rounded-xl transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Test animations**

Manual test:
1. Clear localStorage
2. Refresh page
3. Verify: Modal fades in smoothly (opacity 0 → 1)
4. Verify: Modal scales up slightly (95% → 100%)
5. Click "Got it"
6. Verify: Modal fades out and scales down before disappearing
7. Verify: Animation feels smooth (~200ms)

**Step 3: Commit**

```bash
git add src/components/landing/BetaNoticeModal.tsx
git commit -m "feat: add fade-in/out and scale animations to modal"
```

---

## Task 6: Add Keyboard Support (Escape Key)

**Files:**
- Modify: `src/components/landing/BetaNoticeModal.tsx`

**Step 1: Add keyboard event listener**

Add useEffect for escape key handling:

```tsx
useEffect(() => {
  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (!dismissed) {
    setIsOpen(true);
    setTimeout(() => setIsVisible(true), 10);
  }
}, []);

// Add this new useEffect
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      handleDismiss();
    }
  };

  document.addEventListener("keydown", handleEscape);
  return () => document.removeEventListener("keydown", handleEscape);
}, [isOpen]);
```

**Step 2: Test keyboard support**

Manual test:
1. Clear localStorage and refresh
2. Modal appears
3. Press Escape key
4. Verify: Modal dismisses with animation
5. Verify: localStorage is set (check dev tools)

**Step 3: Commit**

```bash
git add src/components/landing/BetaNoticeModal.tsx
git commit -m "feat: add Escape key support to dismiss modal"
```

---

## Task 7: Integrate Modal into Landing Page

**Files:**
- Modify: `src/app/(frontend)/page.tsx`

**Step 1: Import and render modal**

At the top of `src/app/(frontend)/page.tsx`, add import:

```tsx
import BetaNoticeModal from "@/components/landing/BetaNoticeModal";
```

Then in the component's return statement, add the modal at the very top:

```tsx
return (
  <main>
    <BetaNoticeModal />

    {/* Hero Section */}
    <section className="relative py-24 sm:py-32 overflow-hidden min-h-[500px] flex items-center">
      {/* ... rest of existing content ... */}
```

**Step 2: Test integration**

Manual test:
1. Clear localStorage: `localStorage.clear()`
2. Navigate to `/` (home page)
3. Verify: Modal appears on page load
4. Click "Got it"
5. Verify: Modal dismisses
6. Refresh page
7. Verify: Modal does NOT appear (localStorage persisted)
8. Clear localStorage again
9. Verify: Modal appears again

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add src/app/(frontend)/page.tsx
git commit -m "feat: integrate BetaNoticeModal into landing page"
```

---

## Task 8: Manual Testing & Verification

**Files:**
- None (testing only)

**Step 1: Test localStorage persistence**

Manual test:
1. Clear localStorage
2. Visit home page → modal appears
3. Dismiss modal
4. Open new tab to same URL → modal does NOT appear
5. Close browser completely
6. Reopen browser and visit site → modal does NOT appear
7. ✅ Persistence works

**Step 2: Test localStorage unavailable (private browsing simulation)**

Manual test in browser console:
1. Simulate disabled localStorage by overriding:
   ```js
   const originalGetItem = localStorage.getItem;
   localStorage.getItem = () => { throw new Error("Disabled") };
   ```
2. Refresh page
3. Verify: Modal still appears (graceful degradation)
4. Restore: `localStorage.getItem = originalGetItem`

**Step 3: Test responsive design**

Manual test:
1. Desktop (1920px): Modal should be centered, max-width 500px
2. Tablet (768px): Modal should adapt, maintain padding
3. Mobile (375px): Modal should fit screen with outer padding
4. ✅ All sizes work correctly

**Step 4: Test dark mode**

Manual test:
1. Toggle system to dark mode (or use browser dev tools)
2. Clear localStorage and refresh
3. Verify: Modal has dark background (slate-800)
4. Verify: Text is light colored and readable
5. Verify: Button remains lime-500 (visible in dark mode)
6. ✅ Dark mode works

**Step 5: Test keyboard accessibility**

Manual test:
1. Clear localStorage, refresh
2. Modal appears
3. Press Tab → focus should stay within modal
4. Press Escape → modal dismisses
5. ✅ Keyboard works

**Step 6: Test backdrop click**

Manual test:
1. Clear localStorage, refresh
2. Click on dark backdrop (outside modal box)
3. Verify: Modal dismisses
4. Click on modal box itself (white area)
5. Verify: Modal stays open (stopPropagation works)
6. ✅ Click behavior correct

**Step 7: Document test results**

Create a quick summary in commit message for the testing phase.

**Step 8: Commit (if any fixes were needed)**

```bash
# If no code changes needed, just document
git commit --allow-empty -m "test: verify BetaNoticeModal functionality across browsers and devices

- LocalStorage persistence ✅
- Responsive design (mobile, tablet, desktop) ✅
- Dark mode support ✅
- Keyboard accessibility (Escape, Tab) ✅
- Backdrop click to dismiss ✅
- Graceful degradation without localStorage ✅"
```

---

## Task 9: Final Code Review & Cleanup

**Files:**
- Review: `src/components/landing/BetaNoticeModal.tsx`
- Review: `src/app/(frontend)/page.tsx`

**Step 1: Review BetaNoticeModal.tsx**

Check for:
- [ ] TypeScript types are correct
- [ ] No console.log statements left
- [ ] Comments are helpful but not excessive
- [ ] Code follows DRY principle
- [ ] ARIA labels are present
- [ ] Tailwind classes are optimized

**Step 2: Review page.tsx integration**

Check for:
- [ ] Import is at top with other imports
- [ ] Component placement is logical (top of main)
- [ ] No unintended side effects

**Step 3: Run linter**

```bash
npm run lint
```

Expected: No linting errors in modified files

**Step 4: Final build test**

```bash
npm run build
npm run start
```

Test in production mode:
1. Clear localStorage
2. Visit http://localhost:3000
3. Verify modal works identically to dev mode

**Step 5: Commit any final cleanup**

```bash
git add .
git commit -m "chore: final cleanup and review for BetaNoticeModal"
```

---

## Success Criteria Checklist

Before marking complete, verify all success criteria from design doc:

- [ ] ✅ Modal appears on first visit to landing page
- [ ] ✅ Modal does not appear on subsequent visits
- [ ] ✅ "Got it" button dismisses modal permanently
- [ ] ✅ Modal is visually consistent with EventTara design
- [ ] ✅ Message uses friendly, non-technical language
- [ ] ✅ Works in light and dark mode
- [ ] ✅ Accessible via keyboard (Escape, Tab navigation)
- [ ] ✅ Gracefully degrades if localStorage unavailable
- [ ] ✅ No hydration errors in Next.js
- [ ] ✅ Backdrop click dismisses modal
- [ ] ✅ Animations are smooth (200ms transitions)
- [ ] ✅ Responsive on mobile, tablet, desktop

---

## Notes for Implementation

**Common Issues to Avoid:**

1. **Hydration Mismatch:**
   - Start `isOpen` as `false`, only set to `true` in `useEffect`
   - Never check localStorage during SSR

2. **Animation Timing:**
   - Use `setTimeout` to trigger visibility after mount
   - Wait for animation to complete before removing from DOM

3. **Event Bubbling:**
   - Use `stopPropagation` on modal box click
   - Allows backdrop click to dismiss without triggering on modal content

4. **Focus Management:**
   - Browser naturally handles focus within modal
   - Escape key handled via event listener

5. **Z-Index:**
   - Use `z-50` to ensure modal appears above all page content
   - Check that no other elements have higher z-index

**Design System Alignment:**

- Colors match existing theme (lime-500, slate-900, gray-600)
- Fonts use `font-heading` for title (Plus Jakarta Sans)
- Rounded corners use `rounded-2xl` (consistent with EventCard)
- Button style matches existing primary buttons
- Dark mode uses slate-800 (consistent with other dark mode elements)

**Future Enhancements (Not in This Plan):**

- Analytics tracking (modal views/dismissals)
- A/B testing different messages
- "Learn More" secondary button
- Versioned notices for new announcements
- Expiry dates for re-showing notices
