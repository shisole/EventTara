# Xendit Organizer Payouts System

**Status:** Design
**Date:** 2026-03-12
**Author:** Claude Code

## Overview

Implement automated organizer payouts using Xendit's Disbursement API. This replaces the current manual GCash/Maya payment verification system with:

- **Participants** pay via Xendit checkout (GCash, Maya, Bank Transfer, Cards)
- **EventTara** receives payment in Xendit merchant account
- **Organizers** automatically receive their cut via Xendit Disbursements to their individual GCash/bank accounts

## Why Xendit vs Alternatives

| Feature                  | Xendit                                     | DragonPay                 |
| ------------------------ | ------------------------------------------ | ------------------------- |
| **Disbursements API**    | ✅ Yes — auto payouts to multiple accounts | ❌ No                     |
| **Multi-merchant Split** | ✅ Built-in, scalable                      | ❌ Manual workaround only |
| **GCash Support**        | ✅ Instant in some cases                   | ✅ Limited                |
| **Webhook Reliability**  | Excellent                                  | Legacy                    |
| **Developer Experience** | Modern REST API                            | XML-based                 |

## Architecture

```
Participant Books Event
    ↓
Xendit Checkout (GCash/Maya/Cards)
    ↓
Payment → EventTara Merchant Account
    ↓
Event Completes / Manual Trigger / Auto-schedule
    ↓
Create Disbursement → Organizer's GCash/Bank Account
    ↓
Webhook: Disbursement Success/Failed
    ↓
Update Payout Record in Database
```

## Database Schema Changes

### 1. Add Organizer Payout Details to `club_members`

```sql
ALTER TABLE club_members ADD COLUMN payout_method TEXT; -- 'gcash' | 'bank' | 'none'
ALTER TABLE club_members ADD COLUMN payout_details JSONB; -- { gcashNumber, bankCode, accountNumber, accountHolderName }
ALTER TABLE club_members ADD COLUMN payout_enabled BOOLEAN DEFAULT FALSE;
```

### 2. New `organizer_payouts` Table

Track all payouts to organizers (for auditing + reconciliation):

```sql
CREATE TABLE organizer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payout_method TEXT NOT NULL, -- 'gcash' | 'bank_transfer'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  xendit_disbursement_id TEXT UNIQUE,
  xendit_failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_logs JSONB
);

CREATE INDEX idx_organizer_payouts_club_id ON organizer_payouts(club_id);
CREATE INDEX idx_organizer_payouts_event_id ON organizer_payouts(event_id);
CREATE INDEX idx_organizer_payouts_status ON organizer_payouts(status);
```

### 3. Update `bookings` Table

Remove manual payment fields (or keep for backward compatibility):

```sql
-- Can keep these, or deprecate:
-- ALTER TABLE bookings DROP COLUMN payment_proof_url;
-- ALTER TABLE bookings DROP COLUMN payment_verified_at;
-- ALTER TABLE bookings DROP COLUMN payment_verified_by;
-- ALTER TABLE bookings DROP COLUMN manual_status;

-- Add Xendit reference:
ALTER TABLE bookings ADD COLUMN xendit_charge_id TEXT;
ALTER TABLE bookings ADD COLUMN xendit_payment_id TEXT;
```

## API Integration Points

### 1. Xendit Client Setup

**`src/lib/xendit/client.ts`** — Initialize Xendit client:

```typescript
import { Xendit } from "xendit-sdk";

export function getXenditClient() {
  return new Xendit({
    secretKey: process.env.XENDIT_API_KEY,
  });
}
```

### 2. Booking Payment Flow

**`src/app/api/bookings/checkout/route.ts`** — Create Xendit Invoice:

```typescript
const xendit = getXenditClient();

const invoice = await xendit.Invoice.createInvoice({
  external_id: `booking-${bookingId}`,
  amount: event.price,
  payer_email: user.email,
  description: `${event.title} - EventTara Booking`,
  customer: {
    given_names: user.full_name,
    email: user.email,
  },
  fees: [
    {
      type: "XENDIT_ADMIN_FEE",
      value: Math.ceil(event.price * 0.03), // 3% fee example
    },
  ],
  items: [
    {
      name: event.title,
      quantity: 1,
      price: event.price,
    },
  ],
  callbacks: {
    success_redirect_url: `${baseUrl}/events/${eventId}/book?success=true`,
    failure_redirect_url: `${baseUrl}/events/${eventId}/book?success=false`,
  },
  metadata: {
    booking_id: bookingId,
    event_id: eventId,
    user_id: userId,
    club_id: event.club_id,
  },
});

return { invoice_url: invoice.invoice_url, invoice_id: invoice.id };
```

### 3. Webhook: Payment Confirmed

**`src/app/api/webhooks/xendit/route.ts`** — Handle payment success:

```typescript
export async function POST(req: Request) {
  const body = await req.json();

  // Verify signature
  const isValid = verifyXenditSignature(req.headers, body);
  if (!isValid) return new Response("Unauthorized", { status: 401 });

  const { type, data } = body;

  if (type === "invoice.payment_succeeded") {
    const { external_id, amount, charge_id } = data;
    const bookingId = external_id.split("-")[1];

    // Update booking
    await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        payment_method: "xendit_checkout",
        xendit_charge_id: charge_id,
      })
      .eq("id", bookingId);

    // Trigger payout calculation (optional - can schedule later)
    // await calculateEventPayouts(eventId);
  }

  return new Response("OK");
}
```

### 4. Create Organizer Payout

**`src/lib/xendit/payouts.ts`** — Disburse to organizer:

```typescript
export async function createOrganizerPayout(
  clubId: string,
  eventId: string,
  amount: number,
  payoutDetails: PayoutDetails, // { gcashNumber, bankCode, etc }
) {
  const xendit = getXenditClient();

  try {
    // Determine recipient based on payout_method
    const recipient =
      payoutDetails.method === "gcash"
        ? {
            type: "EWALLET",
            ewallet_type: "GCASH",
            account_number: payoutDetails.gcashNumber,
          }
        : {
            type: "BANK_ACCOUNT",
            bank_code: payoutDetails.bankCode,
            account_holder_name: payoutDetails.accountHolderName,
            account_number: payoutDetails.accountNumber,
          };

    const disbursement = await xendit.Disbursement.createDisbursement({
      external_id: `payout-${clubId}-${eventId}-${Date.now()}`,
      amount,
      bank_code: recipient.bank_code,
      account_holder_name: recipient.account_holder_name,
      account_number: recipient.account_number,
      description: `EventTara Booking Payout - Event: ${eventId}`,
      email_recipient: false,
    });

    // Save payout record
    await supabase.from("organizer_payouts").insert({
      club_id: clubId,
      event_id: eventId,
      amount,
      payout_method: payoutDetails.method,
      status: "processing",
      xendit_disbursement_id: disbursement.id,
    });

    return disbursement;
  } catch (error) {
    console.error("Payout creation failed:", error);
    throw error;
  }
}
```

### 5. Webhook: Payout Status

**`src/app/api/webhooks/xendit/route.ts`** — Handle disbursement updates:

```typescript
if (type === "disbursement") {
  const { external_id, status, failure_reason } = data;

  const payoutStatus =
    status === "COMPLETED" ? "completed" : status === "FAILED" ? "failed" : "processing";

  await supabase
    .from("organizer_payouts")
    .update({
      status: payoutStatus,
      completed_at: payoutStatus !== "processing" ? new Date() : null,
      xendit_failure_reason: failure_reason,
    })
    .eq("xendit_disbursement_id", external_id);
}
```

## Organizer UI: Add Payout Account

**`src/components/dashboard/ClubPayoutSettings.tsx`**:

```typescript
export function ClubPayoutSettings({ club }: { club: Club }) {
  const [method, setMethod] = useState("gcash");
  const [details, setDetails] = useState({});

  const handleSave = async () => {
    await fetch(`/api/clubs/${club.slug}/payout-settings`, {
      method: "PATCH",
      body: JSON.stringify({
        payout_method: method,
        payout_details: details,
        payout_enabled: true,
      }),
    });
  };

  return (
    <div className="space-y-4">
      <h2>Payout Settings</h2>

      <div>
        <label>Payment Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <option value="gcash">GCash</option>
          <option value="bank">Bank Transfer</option>
        </select>
      </div>

      {method === "gcash" && (
        <input
          placeholder="GCash Phone Number"
          value={details.gcashNumber || ""}
          onChange={(e) =>
            setDetails({ ...details, gcashNumber: e.target.value })
          }
        />
      )}

      {method === "bank" && (
        <>
          <input placeholder="Bank Code (e.g., 023)" />
          <input placeholder="Account Number" />
          <input placeholder="Account Holder Name" />
        </>
      )}

      <button onClick={handleSave}>Save Payout Account</button>
    </div>
  );
}
```

## Payout Triggers

### Option 1: Manual (Admin)

- Dashboard button to create payouts per event
- Full control, safer for edge cases

### Option 2: Auto on Event Completion

- Webhook/cron triggered when event status → 'completed'
- Automatic once per event

### Option 3: Scheduled (Recommended)

- Background job (e.g., Vercel Cron) runs daily
- Batches payouts, retries failed ones
- Configurable hold period (e.g., 7 days after event)

## Environment Variables

```bash
XENDIT_API_KEY=xnd_live_...          # Live key from Xendit Dashboard
XENDIT_WEBHOOK_VERIFY_TOKEN=secret   # For webhook verification
```

## Testing

### Unit Tests

- `src/lib/xendit/__tests__/payouts.test.ts` — Payout calculation, Xendit API mocks

### E2E Tests

- `e2e/payment-flow.spec.ts` — Full booking → payout flow (use Xendit sandbox)

## Rollout Plan

1. **Phase 1: Setup**
   - Add migration files for schema changes
   - Implement Xendit client + checkout
   - Test with sandbox API

2. **Phase 2: Payout System**
   - Implement disbursement logic
   - Add organizer UI for payout account setup
   - Webhook integration for status updates

3. **Phase 3: Migration**
   - Migrate existing bookings (manual mark as paid)
   - Phase out manual payment verification
   - Monitor payouts for 2 weeks

4. **Phase 4: Optimization**
   - Add retry logic for failed payouts
   - Batch payout scheduling
   - Reconciliation reports

## Risks & Mitigations

| Risk                                      | Mitigation                                  |
| ----------------------------------------- | ------------------------------------------- |
| Organizer enters wrong GCash/bank details | Verification step (send test payout first)  |
| Payout fails but user thinks it succeeded | Webhook + email notification of status      |
| High Xendit fees                          | Negotiate volume discounts, cap fee percent |
| Webhook delivery failure                  | Scheduled reconciliation job                |

## Estimated Effort

- **Setup:** 4 hours (Xendit auth, migrations, API routes)
- **UI & Logic:** 6 hours (payout settings, disbursement logic)
- **Testing:** 4 hours (unit + E2E + sandbox)
- **Deployment & Monitoring:** 2 hours

**Total:** ~16 hours (2 working days)
