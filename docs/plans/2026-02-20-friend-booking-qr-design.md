# Friend Booking QR Code Design

**Date**: 2026-02-20
**Status**: Approved

## Problem

When a user books for friends (companions), the BookingConfirmation page shows the booker's own QR code alongside companion QR codes. The booker's QR should not be shown in friend mode — only companion QR codes should appear. Additionally, companion bookings should be labeled as "for a friend" on the profile page.

## Design

### 1. API Response Change

**File**: `src/app/(frontend)/api/bookings/route.ts`

Add `mode` to the JSON response so the frontend can distinguish between self and friend bookings. The API already handles friend mode correctly (reuses existing booking, only creates companion rows). No logic changes needed — just include the mode in the response payload.

### 2. BookingConfirmation Component

**File**: `src/components/booking/BookingConfirmation.tsx`

- Accept a `mode` prop (`"self" | "friend"`)
- In friend mode: hide the user's QR code section entirely
- In friend mode: change success messaging (e.g., "Friends Registered!" instead of "You're In!")
- Only show companion QR codes in friend mode

### 3. BookingForm Pass-through

**File**: `src/components/booking/BookingForm.tsx`

Pass the `mode` prop through to `BookingConfirmation` when rendering the success state.

### 4. Profile UpcomingBookings Display

**File**: `src/components/participant/UpcomingBookings.tsx`

Companions grouped under the user's original booking card get a visual label (e.g., "For a friend" badge or people icon) to distinguish them from the user's own booking.

### 5. No Schema Changes

The existing `bookings` and `booking_companions` tables handle all scenarios. The `mode` is transient — used during API calls and passed to the frontend, not stored.
