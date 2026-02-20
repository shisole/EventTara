# Payment System Design — Manual GCash/Maya/Cash

**Date:** 2026-02-20
**Status:** Approved

## Overview

Manual payment system for EventTara where participants pay organizers directly via GCash, Maya, or cash. Organizers verify e-wallet payments by reviewing uploaded proof screenshots. No payment gateway integration required.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Payment model | Manual (no gateway) | Simplest to build, common in PH outdoor events |
| Payment methods | GCash, Maya, Cash | All 3 always available for paid events |
| Payment proof | Screenshot upload | Stored in Supabase Storage |
| Verification | Dashboard only | Organizer reviews proof in event dashboard |
| Free events | Skip payment flow | Current instant-confirmation behavior unchanged |
| Storage | Supabase Storage | Already integrated, consistent with stack |

## Participant Booking Flow

### Paid events (price > 0)

1. Participant clicks "Book Now" on event page
2. Booking page shows event details + price
3. Payment method selection: GCash, Maya, or Cash

**GCash/Maya path:**
- Display organizer's GCash/Maya number (from `organizer_profiles.payment_info`)
- Show instructions: "Send {price} to {number}, then upload your payment screenshot"
- File upload for screenshot (image only, max 5MB)
- Submit creates booking with `payment_status: "pending"`, uploads proof to Supabase Storage
- Participant sees "Booking submitted! Waiting for organizer to verify your payment."
- No QR code until organizer approves

**Cash path:**
- Show notice: "You'll pay {price} in cash on the event day"
- Submit creates booking with `payment_status: "pending"`, `payment_method: "cash"`
- QR code issued immediately (needed for check-in tracking)
- Status shows "Payment: Pay on event day"

### Free events (price = 0)

Current behavior unchanged — instant confirmation + QR code.

## Organizer Verification Flow

### New "Payments" tab on event dashboard

**Payment overview cards:**
- Total Revenue (confirmed payments only)
- Pending Payments (count)
- Cash Payments (count, pending on day)

**Booking list with payment status:**
- Table of all bookings: participant name, payment method, payment status, date
- Filter by: All / Pending / Paid / Rejected
- Status badges: pending (yellow), paid (green), rejected (red)

**E-wallet verification:**
- Click pending booking -> modal opens
- Shows: participant info, payment method, uploaded screenshot
- Two buttons: "Approve" (marks paid, sends confirmation email + QR code) and "Reject" (sends rejection notice)

**Cash payment:**
- "Mark as Paid" button on cash bookings
- Can be done from payments tab or during check-in

**Rejection flow:**
- Rejected participant gets email: "Payment could not be verified. Please re-upload or contact the organizer."
- Participant can re-upload proof from "My Events" page

## Database Changes

### Modify `bookings` table

```sql
-- New fields
payment_proof_url TEXT,          -- Supabase Storage URL for screenshot
payment_verified_at TIMESTAMPTZ, -- When organizer approved
payment_verified_by UUID,        -- Which organizer approved

-- Update payment_method constraint
payment_method TEXT CHECK (payment_method IN ('gcash', 'maya', 'cash'))

-- Update payment_status constraint
payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'rejected', 'refunded'))
```

### New Supabase Storage bucket

```
payment-proofs/
  └── {event_id}/
      └── {booking_id}.{ext}
```

- RLS: participants can upload to their own booking, organizers can read for their events
- Max file size: 5MB
- Accepted types: image/jpeg, image/png, image/webp

## API Changes

### Modified endpoints

**`POST /api/bookings`** — Updated booking creation:
- Accept `payment_method` (gcash/maya/cash)
- If e-wallet + paid event: require `payment_proof` (file) in FormData
- Upload proof to Supabase Storage
- Create booking with `payment_status: "pending"` (not hardcoded "paid")
- If cash: create booking with `payment_status: "pending"`, no proof needed
- If free event: keep current behavior (`payment_status: "paid"`, instant confirmation)
- Only issue QR code for: free events and cash bookings

### New endpoints

**`PATCH /api/bookings/[id]/verify`** — Organizer verifies payment:
- Auth: must be the event's organizer
- Body: `{ action: "approve" | "reject" }`
- If approve: set `payment_status: "paid"`, `payment_verified_at`, `payment_verified_by`, generate QR code, send confirmation email
- If reject: set `payment_status: "rejected"`, send rejection email

**`PATCH /api/bookings/[id]/proof`** — Participant re-uploads proof:
- Auth: must be the booking's participant
- Only allowed when `payment_status` is "pending" or "rejected"
- Upload new screenshot, update `payment_proof_url`, reset status to "pending"

**`GET /api/events/[id]/payments`** — Payment summary for organizer:
- Returns booking list with payment details + aggregate stats
- Auth: must be the event's organizer

## UI Components

### Modified

1. **`BookingForm.tsx`** — Show payment info, add proof upload, different success states
2. **`PaymentMethodPicker.tsx`** — Add "Cash" as third option

### New

3. **`PaymentInstructions.tsx`** — Displays organizer's GCash/Maya number + amount + steps
4. **`PaymentProofUpload.tsx`** — Drag-and-drop file upload with preview, max 5MB
5. **`PaymentVerificationPanel.tsx`** — Organizer dashboard: booking list with payment status + filters
6. **`PaymentProofViewer.tsx`** — Modal to view screenshot + approve/reject buttons
7. **`PaymentStatusBadge.tsx`** — Reusable badge: pending (yellow), paid (green), rejected (red)

### Modified pages

8. **Event dashboard** — Add "Payments" tab
9. **My Events** — Show payment status, allow re-upload if rejected
10. **Booking confirmation** — Different messaging based on payment status

## Future Considerations (Not in scope)

- Payment gateway integration (PayMongo) for automated verification
- Auto-cancel bookings after payment deadline
- Email notifications when proof is uploaded
- Partial refunds
- Payment receipts/invoices
