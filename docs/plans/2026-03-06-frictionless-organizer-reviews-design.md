# Frictionless Organizer Reviews

## Problem

Organizer reviews are locked behind authentication — no "Write a Review" button is visible to unauthenticated visitors, and there's no easy way for organizers to share a review link. New users have no path to leave a review without first discovering the signup flow on their own.

## Solution

Three changes to make leaving a review frictionless:

### 1. Review Page CTA + Inline Auth Modal

**Review page (`/organizers/{id}/reviews`):**

- Show a prominent "Write a Review" CTA at the top, visible to all visitors (signed in or not)
- Signed-in users: toggles the review form open directly
- Not signed in: opens `AuthReviewModal`

**`AuthReviewModal`** (adapted from existing `AuthBookingModal`):

- Same flow: email input -> password or OTP -> success
- Review-specific copy: "Sign in to leave your review"
- On success: closes modal, refreshes user state, reveals the review form

**`OrganizerReviewSection` changes:**

- Remove the `canReview` guard that hides the button for unauthenticated users
- Add `showAuthModal` state — unauthenticated click opens modal
- After auth completes, re-fetch user state to show the form

### 2. QR Code in Organizer Dashboard

**Location:** Dashboard settings page (`/dashboard/settings`)

- "Review QR Code" card with a QR code linking to `/organizers/{id}/reviews`
- Generated client-side with `qrcode.react`
- "Download as PNG" button + copyable shareable URL
- Instructions: "Share this QR code at your events so participants can leave reviews"

Reviews are per-organizer (not per-event), so one QR code covers all events.

### 3. Post-Event Review Request Email

**Trigger:** `onEventCompleted()` in `src/lib/badges/award-event-badge.ts`

**Recipients:** All checked-in participants (same set as badge emails)

**Email:**

- Subject: "How was {event title}? Leave a review for {organizer name}"
- Body: event name, date, organizer name, CTA button to `/organizers/{organizerId}/reviews`
- Separate from badge email (fire-and-forget, doesn't clutter badge celebration)

**Template:** `src/lib/email/templates/review-request.ts`

## Key Decisions

- **Inline modal over redirect:** Keeps user in review context, proven pattern from booking modal
- **Adapt (not refactor) AuthBookingModal:** Avoids risk of breaking existing booking flow; can DRY up later
- **Dashboard settings (not per-event):** Reviews are organizer-level, so one QR/link is sufficient
- **Separate email from badges:** Cleaner UX, each email has a single purpose
