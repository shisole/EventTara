# Payment Integration Plan: GCash & Maya

## Overview

EventTara will accept payments via **GCash**, **Maya**, **GrabPay**, and **credit/debit cards** through **PayMongo** as the payment gateway. Direct GCash/Maya API integration is not available for small businesses — a payment gateway is required.

## Why PayMongo

| Criteria              | PayMongo             | Xendit          | Dragonpay   |
| --------------------- | -------------------- | --------------- | ----------- |
| GCash fee             | **2.23%**            | 2.5%            | P10-20 flat |
| Maya fee              | **1.96%**            | 2.5%            | P10-20 flat |
| Card fee              | 3.125% + P13.39      | 2.9% + P15      | Varies      |
| Setup fee             | None                 | None            | P36,000     |
| Monthly fee           | None                 | None            | None        |
| Developer experience  | Excellent (REST API) | Good            | Dated (XML) |
| Sandbox/test mode     | Yes                  | Yes             | Yes         |
| Next.js compatibility | Native REST API      | Native REST API | Limited     |

PayMongo is the standard choice for Philippine startups — no setup fees, lowest e-wallet rates, and a well-documented REST API with a hosted checkout option.

## Transaction Fee Breakdown

Fees are per transaction, charged by PayMongo (exclusive of VAT):

| Payment Method    | Fee             | P500 event | P1,500 event | P3,000 event |
| ----------------- | --------------- | ---------- | ------------ | ------------ |
| GCash             | 2.23%           | P11.15     | P33.45       | P66.90       |
| Maya              | 1.96%           | P9.80      | P29.40       | P58.80       |
| GrabPay           | 1.96%           | P9.80      | P29.40       | P58.80       |
| ShopeePay         | 1.70%           | P8.50      | P25.50       | P51.00       |
| QR Ph             | 1.34%           | P6.70      | P20.10       | P40.20       |
| Credit/Debit Card | 3.125% + P13.39 | P29.02     | P60.27       | P107.14      |
| Online Banking    | 0.71% or P13.39 | P13.39     | P13.39       | P21.30       |

**Note:** These fees can be absorbed by the organizer, split with the participant, or passed on as a convenience fee — configurable per event.

## Revenue Projection Example

For an organizer running 10 hiking events/month with 30 participants each at P1,500/event:

| Metric                              | Value    |
| ----------------------------------- | -------- |
| Monthly bookings                    | 300      |
| Gross revenue                       | P450,000 |
| Avg. processing fee (GCash @ 2.23%) | P10,035  |
| Net after fees                      | P439,965 |
| Fee as % of revenue                 | ~2.2%    |

## How It Works (User Flow)

1. Participant clicks "Book" on an event page
2. EventTara creates a PayMongo Checkout Session via API
3. Participant is redirected to PayMongo's hosted checkout page
4. Participant selects payment method (GCash, Maya, card, etc.)
5. For e-wallets: the GCash/Maya app opens for authorization
6. Participant is redirected back to EventTara with a success/failure status
7. PayMongo sends a webhook to confirm payment
8. EventTara updates the booking status to "confirmed" in the database

Free events skip this flow entirely and auto-confirm on booking.

## Requirements Before Launch

### Business Registration (Required for GCash)

PayMongo account types and available payment methods:

| Account Type              | Requirements                | Payment Methods                         |
| ------------------------- | --------------------------- | --------------------------------------- |
| Individual (unregistered) | None                        | QR Ph only                              |
| Individual (with website) | Website URL                 | QR Ph, Maya, GrabPay, ShopeePay         |
| **Sole Proprietorship**   | **DTI + BIR 2303 + Gov ID** | **All methods including GCash + Cards** |
| Corporation               | SEC + BIR 2303              | All methods                             |

To accept GCash (the most popular e-wallet in PH), we need at minimum a **DTI-registered sole proprietorship**:

1. **DTI Business Name Registration** — online at [bnrs.dti.gov.ph](https://bnrs.dti.gov.ph), ~P200-P1,000
2. **BIR Form 2303** (Certificate of Registration)
3. **Government-issued ID**

### Technical Implementation

- PayMongo API keys (test keys available immediately on signup)
- Webhook endpoint for payment confirmations
- Booking status flow: `pending` → `confirmed` (on payment) or `cancelled` (on expiry/failure)
- Refund handling via PayMongo Refund API

### PayMongo Signup

1. Sign up at [dashboard.paymongo.com/signup](https://dashboard.paymongo.com/signup)
2. Use **test mode** to build and test the full integration
3. Submit business documents to activate live mode

## Resources

- [PayMongo API Docs](https://developers.paymongo.com/)
- [PayMongo Pricing](https://www.paymongo.com/pricing)
- [PayMongo Checkout API](https://developers.paymongo.com/docs/checkout-api)
- [PayMongo + Next.js Guide (DEV Community)](https://dev.to/xunylpay/integrating-paymongo-api-in-nextjs-part-1-1ee5)
- [PayMongo GCash Deep Links](https://developers.paymongo.com/docs/handle-gcash-deep-links)
- [PayMongo Entity Requirements](https://developers.paymongo.com/docs/philippine-entities)
