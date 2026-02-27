# Payment Integration Plan: GCash & Maya

## Overview

EventTara will accept payments via **GCash**, **Maya**, **GrabPay**, and **credit/debit cards** through a Philippine payment gateway. Direct GCash/Maya API integration is not available for small businesses — a payment gateway is required.

## Gateway Comparison

| Criteria          | PayMongo                     | Dragonpay (Lite)             | Xendit       |
| ----------------- | ---------------------------- | ---------------------------- | ------------ |
| GCash fee         | 2.23% (+ VAT)                | 2.0% + P10 (VAT-inclusive)   | 2.5%         |
| Maya fee          | 1.96% (+ VAT)                | 2.0% (VAT-inclusive)         | 2.5%         |
| Credit card fee   | 3.125% + P13.39 (+ VAT)      | Varies (evaluation-based)    | 2.9% + P15   |
| Online banking    | 0.71% or P13.39 (+ VAT)      | P10-15 flat (VAT-inclusive)  | 1.5% + P20   |
| Setup fee         | None                         | None (waived for PH)         | None         |
| Monthly fee       | None                         | None                         | None         |
| Sandbox/test mode | Yes                          | Yes (`test.dragonpay.ph`)    | Yes          |
| API style         | REST JSON                    | REST JSON (API v2)           | REST JSON    |
| Hosted checkout   | Yes                          | Yes (redirect-based)         | Yes          |
| Node.js/Next.js   | Native REST, well-documented | REST, community NestJS guide | Native REST  |
| Fees include VAT? | No (add 12%)                 | Yes                          | No (add 12%) |

### Key Takeaway

- **PayMongo** — best developer experience, easiest to integrate, but percentage-based fees add up on higher-value bookings
- **Dragonpay** — more competitive fees for P1,500+ events due to flat/lower rates, VAT-inclusive pricing, broadest payment channel coverage (including crypto, over-the-counter)
- **Xendit** — strong regional player (SEA-wide), but highest e-wallet fees of the three

## Fee Comparison by Event Price

### PayMongo (fees are + 12% VAT)

| Payment Method    | Fee             | P500   | P1,500 | P3,000  | P5,000  |
| ----------------- | --------------- | ------ | ------ | ------- | ------- |
| GCash             | 2.23%           | P12.49 | P37.46 | P74.93  | P124.88 |
| Maya              | 1.96%           | P10.98 | P32.93 | P65.86  | P109.76 |
| GrabPay           | 1.96%           | P10.98 | P32.93 | P65.86  | P109.76 |
| Credit/Debit Card | 3.125% + P13.39 | P32.50 | P67.50 | P119.99 | P189.93 |
| Online Banking    | P13.39          | P15.00 | P15.00 | P23.86  | P23.86  |

### Dragonpay Lite (fees are VAT-inclusive)

| Payment Method    | Fee         | P500   | P1,500 | P3,000 | P5,000  |
| ----------------- | ----------- | ------ | ------ | ------ | ------- |
| GCash             | 2.0% + P10  | P20.00 | P40.00 | P70.00 | P110.00 |
| Maya              | 2.0%        | P10.00 | P30.00 | P60.00 | P100.00 |
| Online Banking    | P10-15 flat | P10-15 | P10-15 | P10-15 | P10-15  |
| Over-the-Counter  | P15-20 flat | P15-20 | P15-20 | P15-20 | P15-20  |
| Credit/Debit Card | Varies      | —      | —      | —      | —       |

### Side-by-Side: GCash Fee on a P1,500 Event

| Gateway        | Fee                    | Effective Rate |
| -------------- | ---------------------- | -------------- |
| PayMongo       | P37.46 (with VAT)      | 2.50%          |
| Dragonpay Lite | P40.00 (VAT-inclusive) | 2.67%          |
| Xendit         | P42.00 (with VAT)      | 2.80%          |

At P1,500 the fees are close. **Dragonpay pulls ahead on higher-value events** because the P10 fixed component stays flat while PayMongo's percentage scales.

### Side-by-Side: GCash Fee on a P5,000 Event

| Gateway        | Fee                     | Effective Rate |
| -------------- | ----------------------- | -------------- |
| PayMongo       | P124.88 (with VAT)      | 2.50%          |
| Dragonpay Lite | P110.00 (VAT-inclusive) | 2.20%          |
| Xendit         | P140.00 (with VAT)      | 2.80%          |

## Revenue Projection Example

For an organizer running 10 hiking events/month with 30 participants each at P1,500/event:

| Metric                | PayMongo (GCash) | Dragonpay Lite (GCash) |
| --------------------- | ---------------- | ---------------------- |
| Monthly bookings      | 300              | 300                    |
| Gross revenue         | P450,000         | P450,000               |
| Total processing fees | P11,238          | P12,000                |
| Net after fees        | P438,762         | P438,000               |
| Effective fee rate    | 2.50%            | 2.67%                  |

At P3,000/event (300 bookings):

| Metric                | PayMongo (GCash) | Dragonpay Lite (GCash) |
| --------------------- | ---------------- | ---------------------- |
| Gross revenue         | P900,000         | P900,000               |
| Total processing fees | P22,479          | P21,000                |
| Net after fees        | P877,521         | P879,000               |
| Effective fee rate    | 2.50%            | 2.33%                  |

**Crossover point:** Dragonpay becomes cheaper than PayMongo for GCash at ~P1,900+ per event.

## How It Works (User Flow)

1. Participant clicks "Book" on an event page
2. EventTara creates a payment session via the gateway's API
3. Participant is redirected to the gateway's hosted checkout page
4. Participant selects payment method (GCash, Maya, card, etc.)
5. For e-wallets: the GCash/Maya app opens for authorization
6. Participant is redirected back to EventTara with a success/failure status
7. Gateway sends a webhook/callback to confirm payment
8. EventTara updates the booking status to "confirmed" in the database

Free events skip this flow entirely and auto-confirm on booking.

## Signup Requirements

### PayMongo

| Account Type              | Requirements                | Payment Methods                         |
| ------------------------- | --------------------------- | --------------------------------------- |
| Individual (unregistered) | None                        | QR Ph only                              |
| Individual (with website) | Website URL                 | QR Ph, Maya, GrabPay, ShopeePay         |
| **Sole Proprietorship**   | **DTI + BIR 2303 + Gov ID** | **All methods including GCash + Cards** |
| Corporation               | SEC + BIR 2303              | All methods                             |

- Sign up at [dashboard.paymongo.com/signup](https://dashboard.paymongo.com/signup)
- Test mode available immediately with test API keys
- Submit business documents to activate live mode

### Dragonpay

**Standard Merchant:**

- DTI/CDA/SEC Registration
- BIR Certificate of Registration
- Scanned passbook (account name, number, bank logo)
- Government ID of signatory
- Notarized Secretary Certificate

**Dragonpay Lite** (simplified for startups):

- Basic company details via online form
- Processed in 1-2 business days
- Can upgrade to Standard Merchant later

- Sign up at [dragonpay.ph/lite](https://www.dragonpay.ph/lite)
- Sandbox available at `test.dragonpay.ph`

### Common Requirement

Both gateways require at minimum a **DTI-registered sole proprietorship** for full GCash access:

1. **DTI Business Name Registration** — online at [bnrs.dti.gov.ph](https://bnrs.dti.gov.ph), ~P200-P1,000
2. **BIR Form 2303** (Certificate of Registration)
3. **Government-issued ID**

## Recommendation

**Start with PayMongo** for faster development, then evaluate Dragonpay if transaction volume and event prices justify the switch.

- PayMongo has the best developer experience — clean REST API, excellent docs, hosted checkout, and immediate sandbox access
- If most events are P2,000+, Dragonpay's fee structure saves money at scale
- Both support the same core payment methods (GCash, Maya, cards)
- Both have sandbox/test modes for development before going live

## Technical Implementation (Future)

- API route at `/api/payments/checkout` to create payment sessions
- Webhook endpoint at `/api/webhooks/[gateway]` for payment confirmations
- Booking status flow: `pending` → `confirmed` (on payment) or `cancelled` (on expiry/failure)
- Refund handling via gateway's refund API
- Environment variables: gateway secret key (server-side) + public key (client-side)

## Resources

### PayMongo

- [API Docs](https://developers.paymongo.com/)
- [Pricing](https://www.paymongo.com/pricing)
- [Checkout API](https://developers.paymongo.com/docs/checkout-api)
- [Next.js Integration Guide](https://dev.to/xunylpay/integrating-paymongo-api-in-nextjs-part-1-1ee5)
- [GCash Deep Links](https://developers.paymongo.com/docs/handle-gcash-deep-links)
- [Entity Requirements](https://developers.paymongo.com/docs/philippine-entities)

### Dragonpay

- [Pricing](https://www.dragonpay.ph/pricing/)
- [Dragonpay Lite](https://www.dragonpay.ph/lite)
- [Developer Docs](https://dragonpay.readthedocs.io/)
- [Merchant Requirements](https://www.dragonpay.ph/requirements/)
- [Node.js/NestJS Integration Guide](https://medium.com/@choudharynishantplawat/how-to-set-up-dragonpay-payment-gateway-in-node-js-nestjs-with-full-refund-support-46317a36eddd)
