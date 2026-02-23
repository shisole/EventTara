# Booking Auth Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an auth modal to the booking page so unauthenticated users can sign in via magic link without leaving the page.

**Architecture:** A new `AuthBookingModal` client component with 3 states (email input → check email → confetti success). The booking page Server Component checks auth and conditionally renders the modal over a blurred/disabled form. Supabase OTP handles both new and existing users through a single email input.

**Tech Stack:** Next.js 15 (App Router), Supabase Auth (signInWithOtp), canvas-confetti, Tailwind CSS transitions

**Design doc:** `docs/plans/2026-02-23-booking-auth-modal-design.md`

---

### Task 1: Install canvas-confetti

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run: `npm install canvas-confetti && npm install -D @types/canvas-confetti`

**Step 2: Verify installation**

Run: `grep canvas-confetti package.json`
Expected: `"canvas-confetti": "^1.x.x"` in dependencies

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add canvas-confetti dependency for booking auth modal"
```

---

### Task 2: Create the AuthBookingModal component — Email Input state

**Files:**
- Create: `src/components/booking/AuthBookingModal.tsx`

**Step 1: Create the component with State 1 (email input)**

Create `src/components/booking/AuthBookingModal.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import confetti from "canvas-confetti";

type ModalState = "email" | "check-email" | "success";

interface AuthBookingModalProps {
  eventName: string;
  eventId: string;
  onAuthenticated: (userEmail: string) => void;
}

export default function AuthBookingModal({
  eventName,
  eventId,
  onAuthenticated,
}: AuthBookingModalProps) {
  const [state, setState] = useState<ModalState>("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [userDisplay, setUserDisplay] = useState("");

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Escape key — no-op (modal is required, can't dismiss)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/events/${eventId}/book`,
        },
      });

      if (otpError) {
        if (otpError.message?.includes("rate")) {
          setError("Too many attempts. Try again in a few minutes.");
        } else {
          setError(otpError.message || "Something went wrong. Please try again.");
        }
        return;
      }

      setUserDisplay(trimmed);
      setState("check-email");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {state === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-lime-600 dark:text-lime-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 id="auth-modal-title" className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                Sign in to continue booking
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {eventName}
              </p>
            </div>

            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-lime-500 focus:border-transparent outline-none transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500" role="alert">{error}</p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Sending link..." : "Continue"}
            </Button>

            <p className="text-xs text-center text-gray-400 dark:text-gray-500">
              We&apos;ll send a sign-in link to your email. Works for new and existing accounts.
            </p>
          </form>
        )}

        {state === "check-email" && (
          <div className="text-center space-y-4">
            {/* Placeholder — implemented in Task 3 */}
            <p>Check your email state — Task 3</p>
          </div>
        )}

        {state === "success" && (
          <div className="text-center space-y-3">
            {/* Placeholder — implemented in Task 4 */}
            <p>Success state — Task 4</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to `AuthBookingModal`

**Step 3: Commit**

```bash
git add src/components/booking/AuthBookingModal.tsx
git commit -m "feat: add AuthBookingModal with email input state"
```

---

### Task 3: Add Check Your Email state with polling

**Files:**
- Modify: `src/components/booking/AuthBookingModal.tsx`

**Step 1: Add the polling logic and check-email UI**

In `AuthBookingModal.tsx`, add the polling effect after the existing `useEffect` for animation:

```tsx
// Poll for auth session during check-email state
useEffect(() => {
  if (state !== "check-email") return;

  const supabase = createClient();
  let attempts = 0;
  const maxAttempts = 200; // ~10 minutes at 3s intervals

  const interval = setInterval(async () => {
    attempts++;
    if (attempts >= maxAttempts) {
      clearInterval(interval);
      setError("Link expired. Send a new one?");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      clearInterval(interval);
      const displayName =
        session.user.user_metadata?.full_name ||
        session.user.email ||
        userDisplay;
      setUserDisplay(displayName);
      setState("success");
    }
  }, 3000);

  return () => clearInterval(interval);
}, [state, userDisplay]);
```

Replace the check-email placeholder with:

```tsx
{state === "check-email" && (
  <div className="text-center space-y-4">
    <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-7 h-7 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51" />
      </svg>
    </div>

    <div>
      <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
        Check your email
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
        We sent a sign-in link to{" "}
        <span className="font-medium text-gray-900 dark:text-white">{userDisplay}</span>.
        Click it to continue.
      </p>
    </div>

    <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400 dark:text-gray-500">
      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Waiting for confirmation...
    </div>

    {error && (
      <div className="space-y-2">
        <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
        <button
          onClick={() => {
            setError("");
            setState("email");
          }}
          className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:underline"
        >
          Try again
        </button>
      </div>
    )}

    {!error && (
      <button
        onClick={handleResend}
        className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
      >
        Didn&apos;t get it? Resend email
      </button>
    )}
  </div>
)}
```

Also add the `handleResend` function alongside the other handlers:

```tsx
const handleResend = async () => {
  setError("");
  setLoading(true);
  try {
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: userDisplay,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/events/${eventId}/book`,
      },
    });
    if (otpError) {
      setError("Too many attempts. Try again in a few minutes.");
    }
  } catch {
    setError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/booking/AuthBookingModal.tsx
git commit -m "feat: add check-email state with session polling and resend"
```

---

### Task 4: Add Success state with confetti

**Files:**
- Modify: `src/components/booking/AuthBookingModal.tsx`

**Step 1: Add the success effect and UI**

Add a `useEffect` for the success state (fires confetti + auto-close):

```tsx
// Success: fire confetti and auto-close
useEffect(() => {
  if (state !== "success") return;

  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#84cc16", "#22d3ee", "#fbbf24", "#f472b6"],
  });

  const timer = setTimeout(() => {
    setIsVisible(false);
    setTimeout(() => onAuthenticated(userDisplay), 200);
  }, 2000);

  return () => clearTimeout(timer);
}, [state, userDisplay, onAuthenticated]);
```

Replace the success placeholder with:

```tsx
{state === "success" && (
  <div className="text-center space-y-3">
    <div className="w-14 h-14 bg-lime-100 dark:bg-lime-900/30 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-7 h-7 text-lime-600 dark:text-lime-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
      You&apos;re all set!
    </h2>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Welcome, <span className="font-medium text-gray-900 dark:text-white">{userDisplay}</span>!
    </p>
  </div>
)}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/booking/AuthBookingModal.tsx
git commit -m "feat: add success state with confetti animation and auto-close"
```

---

### Task 5: Create BookingPageClient wrapper component

The booking page is currently a Server Component. We need a client wrapper that manages the `isAuthenticated` state and conditionally shows the modal + blurred form.

**Files:**
- Create: `src/components/booking/BookingPageClient.tsx`

**Step 1: Create the client wrapper**

Create `src/components/booking/BookingPageClient.tsx`:

```tsx
"use client";

import { useState } from "react";
import BookingForm from "./BookingForm";
import AuthBookingModal from "./AuthBookingModal";

interface BookingPageClientProps {
  isAuthenticated: boolean;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  price: number;
  organizerPaymentInfo?: {
    gcash_number?: string;
    maya_number?: string;
  } | null;
  spotsLeft: number;
  mode: "self" | "friend";
}

export default function BookingPageClient({
  isAuthenticated: initialAuth,
  eventId,
  eventTitle,
  eventDate,
  price,
  organizerPaymentInfo,
  spotsLeft,
  mode,
}: BookingPageClientProps) {
  const [authenticated, setAuthenticated] = useState(initialAuth);

  const handleAuthenticated = () => {
    setAuthenticated(true);
  };

  return (
    <>
      {!authenticated && (
        <AuthBookingModal
          eventName={eventTitle}
          eventId={eventId}
          onAuthenticated={handleAuthenticated}
        />
      )}

      <div className={!authenticated ? "pointer-events-none select-none blur-sm" : undefined}>
        <BookingForm
          eventId={eventId}
          eventTitle={eventTitle}
          eventDate={eventDate}
          price={price}
          organizerPaymentInfo={organizerPaymentInfo}
          spotsLeft={spotsLeft}
          mode={mode}
        />
      </div>
    </>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/booking/BookingPageClient.tsx
git commit -m "feat: add BookingPageClient wrapper with auth modal integration"
```

---

### Task 6: Update the booking page to use BookingPageClient

**Files:**
- Modify: `src/app/(frontend)/(participant)/events/[id]/book/page.tsx`

**Step 1: Replace BookingForm with BookingPageClient**

Update the booking page Server Component. The key changes:
1. Import `BookingPageClient` instead of `BookingForm`
2. Pass `isAuthenticated={!!user}` to the wrapper
3. Remove the redirect for unauthenticated users (the modal handles it now)

The page already fetches `user` via `supabase.auth.getUser()` (line 28-30). Change the render section:

Replace the import:
```tsx
// Before
import BookingForm from "@/components/booking/BookingForm";

// After
import BookingPageClient from "@/components/booking/BookingPageClient";
```

Replace the return JSX (the `<BookingForm>` usage):
```tsx
return (
  <div className="max-w-lg mx-auto px-4 py-12">
    <h1 className="text-2xl font-heading font-bold mb-8 text-center">
      {mode === "friend" ? "Book for a Friend" : "Book Your Spot"}
    </h1>
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-5 sm:p-8">
      <BookingPageClient
        isAuthenticated={!!user}
        eventId={event.id}
        eventTitle={event.title}
        eventDate={event.date}
        price={Number(event.price)}
        organizerPaymentInfo={organizerPaymentInfo}
        spotsLeft={spotsLeft}
        mode={mode}
      />
    </div>
  </div>
);
```

**Important:** Keep the existing `user` fetch and the `existingBooking` check (which still guards against double-booking for authenticated users). Only remove the assumption that users must be logged in to view the page.

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Manual test**

Run: `npm run dev -- --port 3001`

1. Open an incognito window, navigate to an event, click "Book Now"
2. Verify: booking form appears blurred behind the auth modal
3. Enter an email, submit — verify "check your email" state appears
4. Check email inbox for magic link
5. Click magic link — verify the original tab detects auth, shows confetti, auto-closes modal
6. Verify booking form is now interactable

**Step 4: Commit**

```bash
git add src/app/'(frontend)'/'(participant)'/events/'[id]'/book/page.tsx
git commit -m "feat: integrate auth modal into booking page for unauthenticated users"
```

---

### Task 7: Visual polish and edge cases

**Files:**
- Modify: `src/components/booking/AuthBookingModal.tsx`

**Step 1: Add body scroll lock when modal is open**

Add a `useEffect` at the top of the component:

```tsx
// Lock body scroll while modal is open
useEffect(() => {
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = "";
  };
}, []);
```

**Step 2: Handle the case where the user opens the magic link in the same tab**

The auth callback already redirects to `/events/[id]/book` via the `?next=` param. When the page reloads, the Server Component detects the authenticated session and renders without the modal. No additional code needed — this works automatically.

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/booking/AuthBookingModal.tsx
git commit -m "fix: add body scroll lock to auth booking modal"
```

---

### Task 8: Build verification

**Step 1: Run the production build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run the linter**

Run: `npm run lint`
Expected: No new warnings or errors

**Step 3: Final commit if any fixes needed**

If the build or lint reveals issues, fix them and commit:

```bash
git add -A
git commit -m "fix: resolve build/lint issues in booking auth modal"
```
