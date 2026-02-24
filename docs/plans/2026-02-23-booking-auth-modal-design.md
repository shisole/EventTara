# Booking Auth Modal Design

**Date:** 2026-02-23
**Status:** Approved

## Problem

When a logged-out user navigates to `/events/[id]/book`, they can fill out the entire booking form but get an "Unauthorized" error on submit. There is no auth guard, no redirect-after-login, and no guidance on what to do next.

## Solution

An auth modal that appears on the booking page for unauthenticated users. The modal collects an email, sends a Supabase magic link (OTP), and polls for auth completion — all without leaving the page.

## User Flow

1. Unauthenticated user clicks "Book Now" on an event detail page
2. Booking page loads with the form **visible but blurred/disabled** behind a modal
3. Modal shows: event name, "Enter your email to continue booking", email input, submit button
4. User enters email and submits
5. Supabase sends a magic link via `signInWithOtp({ email })` — handles both new and existing users
6. Modal transitions to "Check your email" state with a message: "We sent a link to [email]. Click it to continue."
7. Modal polls `supabase.auth.getSession()` every ~3 seconds
8. User clicks magic link in their email (opens in new tab), auth callback sets session
9. Polling detects the session — modal transitions to success state
10. Success state: confetti animation (`canvas-confetti`) + checkmark + "Welcome, [name/email]! You're all set!"
11. After ~2 seconds, modal auto-closes and the booking form becomes interactable

## Modal States

### State 1: Email Input

- Event name displayed for context
- Single email input field with inline validation
- "Continue" submit button
- No password, no OAuth, no guest option

### State 2: Check Your Email

- Confirmation message: "We sent a link to **[email]**. Click it to continue."
- Background polling: `supabase.auth.getSession()` every ~3s
- "Resend email" link (with rate limiting)
- Polling timeout after 10 minutes → "Link expired. Send a new one?"

### State 3: Success

- `canvas-confetti` burst animation
- Checkmark icon
- "Welcome, [name/email]! You're all set!"
- Auto-closes after ~2 seconds
- Calls `onAuthenticated` callback to enable the booking form

## Component Architecture

### `AuthBookingModal` (new client component)

- **Location:** `src/components/auth-booking-modal.tsx`
- Manages 3 internal states (email → check email → success)
- Props: `eventName`, `isOpen`, `onAuthenticated`
- Uses `@supabase/ssr` client for OTP and session polling
- Fires `canvas-confetti` on success

### Booking Page Changes

- Server Component checks auth via `supabase.auth.getUser()`
- If authenticated: render `BookingForm` normally (no modal)
- If not authenticated: render `BookingForm` (blurred/disabled) + `AuthBookingModal`
- `onAuthenticated` callback re-fetches session and enables the form

### Auth Callback

- `/auth/callback/route.ts` already supports `?next=` parameter
- Magic link's `emailRedirectTo` points to `/auth/callback?next=/events/[id]/book`
- No changes needed to existing callback logic

## Error Handling

| Error                     | UX                                                          |
| ------------------------- | ----------------------------------------------------------- |
| Invalid email format      | Inline validation before submit                             |
| Supabase OTP rate limit   | "Too many attempts. Try again in a few minutes."            |
| Network error on OTP send | "Something went wrong. Please try again."                   |
| Polling timeout (10 min)  | "Link expired. Send a new one?" with resend button          |
| API-level 401 on booking  | Safety net — should not occur if modal flow works correctly |

## Dependencies

- `canvas-confetti` (~6KB gzipped) — lightweight, no framework dependency, fire-and-forget API

## What This Does NOT Change

- Existing login, signup, and guest-setup pages remain untouched
- API-level auth check in `/api/bookings` stays as a safety net
- Middleware continues to only refresh sessions (no new auth guards)
- Event detail page (`/events/[id]`) remains publicly accessible
