# Payment System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add manual payment verification to EventTara — participants pay via GCash, Maya, or cash, upload proof screenshots, and organizers verify from their dashboard.

**Architecture:** Extend the existing bookings table with payment proof fields. Paid e-wallet bookings stay "pending" until organizer approves. Cash bookings get immediate QR codes. New API routes handle verification. Supabase Storage holds proof screenshots.

**Tech Stack:** Next.js 14 App Router, Supabase (DB + Storage + RLS), TypeScript, Tailwind CSS, Resend (email)

**Design doc:** `docs/plans/2026-02-20-payment-system-design.md`

**Note:** This project has no automated tests (per CLAUDE.md). Skip TDD steps — verify manually with `npm run build` after each task.

---

## Task 1: Database Migration — Add Payment Fields

**Files:**
- Create: `supabase/migrations/003_payment_proof.sql`
- Modify: `src/lib/supabase/types.ts:150-182` (bookings type)

**Step 1: Write the migration**

Create `supabase/migrations/003_payment_proof.sql`:

```sql
-- Add payment proof fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN payment_proof_url TEXT,
  ADD COLUMN payment_verified_at TIMESTAMPTZ,
  ADD COLUMN payment_verified_by UUID REFERENCES public.users(id);

-- Update payment_method constraint to allow 'cash'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_method_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('gcash', 'maya', 'cash'));

-- Update payment_status constraint to allow 'rejected'
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'rejected', 'refunded'));

-- Add RLS policy: organizers can update bookings for their events (for verify/reject)
CREATE POLICY "Organizers can update event bookings" ON public.bookings
  FOR UPDATE USING (event_id IN (
    SELECT id FROM public.events WHERE organizer_id IN (
      SELECT id FROM public.organizer_profiles WHERE user_id = auth.uid()
    )
  ));

-- Index for filtering by payment status
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
```

**Step 2: Update TypeScript types**

Update `src/lib/supabase/types.ts` bookings section (lines 150-182). All three sub-types (Row, Insert, Update) need the new fields:

- Row: add `payment_proof_url: string | null`, `payment_verified_at: string | null`, `payment_verified_by: string | null`
- Row: update `payment_status` to `'pending' | 'paid' | 'rejected' | 'refunded'`
- Row: update `payment_method` to `'gcash' | 'maya' | 'cash' | null`
- Insert/Update: same additions as optional fields

**Step 3: Run the migration**

```bash
# Apply migration via Supabase CLI or dashboard
# If using CLI:
npx supabase db push
# If using dashboard: paste the SQL into the SQL editor and run
```

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add supabase/migrations/003_payment_proof.sql src/lib/supabase/types.ts
git commit -m "feat: add payment proof fields and update constraints"
```

---

## Task 2: PaymentStatusBadge Component

This reusable badge is used across multiple components, so build it first.

**Files:**
- Create: `src/components/ui/PaymentStatusBadge.tsx`

**Step 1: Create the component**

```tsx
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  },
  paid: {
    label: "Paid",
    className: "bg-forest-100 text-forest-700 dark:bg-forest-900/50 dark:text-forest-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
  refunded: {
    label: "Refunded",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
};

export default function PaymentStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-medium", config.className)}>
      {config.label}
    </span>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/ui/PaymentStatusBadge.tsx
git commit -m "feat: add PaymentStatusBadge component"
```

---

## Task 3: Update PaymentMethodPicker — Add Cash Option

**Files:**
- Modify: `src/components/booking/PaymentMethodPicker.tsx:10-13`

**Step 1: Add "cash" to the PAYMENT_METHODS array**

At line 10-13, add cash as the third option. Change `grid-cols-2` to `grid-cols-3` at line 19:

```typescript
const PAYMENT_METHODS = [
  { id: "gcash", name: "GCash", color: "bg-blue-500", icon: "\u{1F499}" },
  { id: "maya", name: "Maya", color: "bg-green-500", icon: "\u{1F49A}" },
  { id: "cash", name: "Cash", color: "bg-yellow-500", icon: "\u{1F4B5}" },
];
```

Also update the grid from `grid-cols-2` to `grid-cols-3` at line 19.

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/booking/PaymentMethodPicker.tsx
git commit -m "feat: add cash payment method option"
```

---

## Task 4: PaymentInstructions Component

Shows organizer's GCash/Maya number and payment instructions to participants.

**Files:**
- Create: `src/components/booking/PaymentInstructions.tsx`

**Step 1: Create the component**

```tsx
"use client";

interface PaymentInstructionsProps {
  paymentMethod: "gcash" | "maya";
  amount: number;
  paymentInfo: {
    gcash_number?: string;
    maya_number?: string;
  };
}

const methodConfig = {
  gcash: { name: "GCash", numberKey: "gcash_number" as const, color: "text-blue-600 dark:text-blue-400" },
  maya: { name: "Maya", numberKey: "maya_number" as const, color: "text-green-600 dark:text-green-400" },
};

export default function PaymentInstructions({ paymentMethod, amount, paymentInfo }: PaymentInstructionsProps) {
  const config = methodConfig[paymentMethod];
  const number = paymentInfo[config.numberKey];

  if (!number) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          The organizer has not set up their {config.name} number yet. Please contact them directly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
      <h4 className="font-medium text-sm">Payment Instructions</h4>
      <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
        <li>
          Open your <span className={`font-semibold ${config.color}`}>{config.name}</span> app
        </li>
        <li>
          Send <span className="font-bold text-gray-900 dark:text-gray-100">{"\u20B1"}{amount.toLocaleString()}</span> to{" "}
          <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{number}</span>
        </li>
        <li>Take a screenshot of your payment confirmation</li>
        <li>Upload the screenshot below</li>
      </ol>
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/booking/PaymentInstructions.tsx
git commit -m "feat: add PaymentInstructions component"
```

---

## Task 5: PaymentProofUpload Component

File upload with image preview for payment proof screenshots.

**Files:**
- Create: `src/components/booking/PaymentProofUpload.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useRef } from "react";

interface PaymentProofUploadProps {
  onFileSelect: (file: File | null) => void;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function PaymentProofUpload({ onFileSelect }: PaymentProofUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Payment Screenshot
      </label>
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Payment proof" className="w-full rounded-xl border dark:border-gray-700 max-h-64 object-contain bg-gray-50 dark:bg-gray-800" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600"
          >
            x
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-lime-500 bg-lime-50 dark:bg-lime-950"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
        >
          <p className="text-3xl mb-2">{"\u{1F4F8}"}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drag and drop your screenshot here, or <span className="text-lime-600 dark:text-lime-400 font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG or WebP, max 5MB</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="hidden" />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/booking/PaymentProofUpload.tsx
git commit -m "feat: add PaymentProofUpload component"
```

---

## Task 6: Update Booking Page — Fetch Organizer Payment Info

The booking page server component needs to fetch the organizer's GCash/Maya numbers so they can be shown in the booking form.

**Files:**
- Modify: `src/app/(participant)/events/[id]/book/page.tsx:9-14` (query)
- Modify: `src/components/booking/BookingForm.tsx` (full rewrite)

**Step 1: Update the booking page to fetch organizer payment info**

Update the Supabase query at line 9-14 to also fetch the organizer's payment_info:

```typescript
const { data: event } = await supabase
  .from("events")
  .select("id, title, date, price, organizer_profiles:organizer_id(payment_info)")
  .eq("id", id)
  .eq("status", "published")
  .single();
```

Pass the payment info to BookingForm:

```tsx
<BookingForm
  eventId={event.id}
  eventTitle={event.title}
  eventDate={event.date}
  price={Number(event.price)}
  organizerPaymentInfo={(event.organizer_profiles as any)?.payment_info || {}}
/>
```

**Step 2: Rewrite BookingForm to support the full payment flow**

Modify `src/components/booking/BookingForm.tsx` to:

- Add `organizerPaymentInfo` to props interface
- Add `proofFile` state (`File | null`)
- Show `PaymentInstructions` when gcash/maya selected and price > 0
- Show `PaymentProofUpload` when gcash/maya selected and price > 0
- Show cash notice when cash selected
- Change submit to use `FormData` (for file upload) instead of JSON
- Show different confirmation states (pending vs confirmed)
- Import and use `PaymentInstructions`, `PaymentProofUpload`

Updated props interface:

```typescript
interface BookingFormProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  price: number;
  organizerPaymentInfo: {
    gcash_number?: string;
    maya_number?: string;
  };
}
```

Submit handler changes:
- For e-wallet (gcash/maya) with price > 0: send as `FormData` with file
- For cash or free: send as JSON (no file)
- After successful booking: if `payment_status === "pending"` and method is gcash/maya, show pending message instead of QR code

The BookingConfirmation component receives a new `paymentStatus` prop. If pending (e-wallet), show "Waiting for organizer verification" message. If paid/cash, show QR code as before.

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/(participant)/events/[id]/book/page.tsx src/components/booking/BookingForm.tsx
git commit -m "feat: update booking flow with payment instructions and proof upload"
```

---

## Task 7: Update BookingConfirmation — Pending vs Confirmed States

**Files:**
- Modify: `src/components/booking/BookingConfirmation.tsx`

**Step 1: Add paymentStatus and paymentMethod props**

Update the component to show different content based on payment state:

```typescript
interface BookingConfirmationProps {
  bookingId: string;
  eventTitle: string;
  eventDate: string;
  qrCode: string | null; // null when pending e-wallet
  paymentStatus: string;
  paymentMethod: string;
}
```

- If `paymentStatus === "pending"` and method is gcash/maya: show a "Submitted!" message with "Waiting for the organizer to verify your payment" text. No QR code. Show "View My Events" button.
- If `paymentStatus === "pending"` and method is cash: show "You're In!" with QR code and a note "Remember to pay cash on event day."
- If `paymentStatus === "paid"`: current behavior (QR code, confirmed message).

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/booking/BookingConfirmation.tsx
git commit -m "feat: update BookingConfirmation for pending payment states"
```

---

## Task 8: Update Bookings API — Handle Payment Proof Upload

**Files:**
- Modify: `src/app/api/bookings/route.ts` (full update)

**Step 1: Rewrite the POST handler**

Key changes to `src/app/api/bookings/route.ts`:

1. **Parse FormData or JSON** depending on content type:
   - Check `request.headers.get("content-type")` — if it includes `multipart/form-data`, parse as FormData; otherwise parse as JSON

2. **Handle file upload** for e-wallet payments:
   - Extract `payment_proof` file from FormData
   - Upload to Supabase Storage bucket `payment-proofs` at path `{event_id}/{booking_id}.{ext}`
   - Store the public URL in `payment_proof_url`

3. **Determine booking status based on payment method and price**:
   - Free events (price === 0): `status: "confirmed"`, `payment_status: "paid"`, generate QR code
   - Cash: `status: "pending"`, `payment_status: "pending"`, generate QR code (needed for check-in)
   - GCash/Maya: `status: "pending"`, `payment_status: "pending"`, no QR code yet

4. **Only send confirmation email for free events** (e-wallet and cash get emails after verification)

5. **Two-step insert for e-wallet** (need booking ID for storage path):
   - Insert booking first (without proof URL)
   - Upload file to storage using booking ID
   - Update booking with `payment_proof_url`

Key logic:

```typescript
const isFree = event.price === 0 || event.price === null;
const isEwallet = payment_method === "gcash" || payment_method === "maya";
const isCash = payment_method === "cash";

let bookingStatus: string;
let paymentStatus: string;
let qrCode: string | null;

if (isFree) {
  bookingStatus = "confirmed";
  paymentStatus = "paid";
  qrCode = `eventtara:checkin:${event_id}:${user.id}`;
} else if (isCash) {
  bookingStatus = "pending";
  paymentStatus = "pending";
  qrCode = `eventtara:checkin:${event_id}:${user.id}`;
} else {
  // e-wallet — pending until organizer verifies
  bookingStatus = "pending";
  paymentStatus = "pending";
  qrCode = null;
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/api/bookings/route.ts
git commit -m "feat: update bookings API with payment proof upload and pending status"
```

---

## Task 9: Payment Verification API — Organizer Approves/Rejects

**Files:**
- Create: `src/app/api/bookings/[id]/verify/route.ts`

**Step 1: Create the verify endpoint**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmationHtml } from "@/lib/email/templates/booking-confirmation";
import { paymentRejectedHtml } from "@/lib/email/templates/payment-rejected";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json();
  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get booking with event and user info
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, events:event_id(title, date, location, organizer_id, organizer_profiles:organizer_id(user_id)), users:user_id(full_name, email)")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Verify the current user is the organizer
  const organizerUserId = (booking.events as any)?.organizer_profiles?.user_id;
  if (organizerUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "approve") {
    const qrCode = `eventtara:checkin:${booking.event_id}:${booking.user_id}`;

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid",
        payment_verified_at: new Date().toISOString(),
        payment_verified_by: user.id,
        qr_code: qrCode,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send confirmation email with QR code
    const email = (booking.users as any)?.email;
    if (email) {
      const eventDate = new Date((booking.events as any).date).toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
      });
      sendEmail({
        to: email,
        subject: `Booking Confirmed: ${(booking.events as any).title}`,
        html: bookingConfirmationHtml({
          userName: (booking.users as any)?.full_name ?? "",
          eventTitle: (booking.events as any).title,
          eventDate,
          eventLocation: (booking.events as any).location,
          bookingId: booking.id,
          qrCode,
        }),
      }).catch((err) => console.error("[Email] Confirmation failed:", err));
    }

    return NextResponse.json({ message: "Payment approved", qrCode });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: "rejected" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send rejection email
    const email = (booking.users as any)?.email;
    if (email) {
      sendEmail({
        to: email,
        subject: `Payment Issue: ${(booking.events as any).title}`,
        html: paymentRejectedHtml({
          userName: (booking.users as any)?.full_name ?? "",
          eventTitle: (booking.events as any).title,
        }),
      }).catch((err) => console.error("[Email] Rejection email failed:", err));
    }

    return NextResponse.json({ message: "Payment rejected" });
  }
}
```

**Step 2: Create payment-rejected email template**

Create `src/lib/email/templates/payment-rejected.ts` following the same HTML email pattern as `booking-confirmation.ts`:
- Same header with teal gradient
- Body: "Payment could not be verified for {eventTitle}. Please check your payment or re-upload your proof screenshot from My Events."
- Same footer

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/api/bookings/[id]/verify/route.ts src/lib/email/templates/payment-rejected.ts
git commit -m "feat: add payment verification API and rejection email template"
```

---

## Task 10: Payment Proof Re-upload API

**Files:**
- Create: `src/app/api/bookings/[id]/proof/route.ts`

**Step 1: Create the proof re-upload endpoint**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get booking — must belong to user and be pending/rejected
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, event_id, payment_status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!["pending", "rejected"].includes(booking.payment_status)) {
    return NextResponse.json({ error: "Cannot re-upload proof for this booking" }, { status: 400 });
  }

  // Parse FormData
  const formData = await request.formData();
  const file = formData.get("payment_proof") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${booking.event_id}/${booking.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from("payment-proofs").getPublicUrl(path);

  // Update booking
  const { error } = await supabase
    .from("bookings")
    .update({
      payment_proof_url: publicUrl.publicUrl,
      payment_status: "pending",
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Proof uploaded", payment_proof_url: publicUrl.publicUrl });
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/api/bookings/[id]/proof/route.ts
git commit -m "feat: add payment proof re-upload API"
```

---

## Task 11: Payments Summary API for Organizer Dashboard

**Files:**
- Create: `src/app/api/events/[id]/payments/route.ts`

**Step 1: Create the payments endpoint**

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify organizer owns this event
  const { data: event } = await supabase
    .from("events")
    .select("id, price, organizer_id, organizer_profiles:organizer_id(user_id)")
    .eq("id", id)
    .single();

  if (!event || (event.organizer_profiles as any)?.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get bookings with user info
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, payment_status, payment_method, payment_proof_url, booked_at, users:user_id(full_name, email, avatar_url)")
    .eq("event_id", id)
    .in("status", ["pending", "confirmed"])
    .order("booked_at", { ascending: false });

  const allBookings = bookings || [];
  const paidCount = allBookings.filter((b) => b.payment_status === "paid").length;
  const pendingCount = allBookings.filter((b) => b.payment_status === "pending").length;
  const rejectedCount = allBookings.filter((b) => b.payment_status === "rejected").length;
  const cashCount = allBookings.filter((b) => b.payment_method === "cash").length;

  return NextResponse.json({
    bookings: allBookings,
    stats: {
      total: allBookings.length,
      paid: paidCount,
      pending: pendingCount,
      rejected: rejectedCount,
      cash: cashCount,
      revenue: paidCount * Number(event.price),
    },
  });
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/api/events/[id]/payments/route.ts
git commit -m "feat: add payments summary API for organizer dashboard"
```

---

## Task 12: PaymentVerificationPanel — Organizer Dashboard Component

**Files:**
- Create: `src/components/dashboard/PaymentVerificationPanel.tsx`

**Step 1: Create the component**

This is a client component that:
- Fetches from `/api/events/{id}/payments`
- Shows stat cards (Revenue, Pending, Cash)
- Lists bookings with payment status filter (All / Pending / Paid / Rejected)
- Each row shows: participant name, payment method, payment status badge, date, and action button
- "View Proof" button opens the proof image in a modal
- "Approve" / "Reject" buttons call `/api/bookings/{id}/verify`
- "Mark as Paid" button for cash bookings calls the same verify endpoint with `action: "approve"`

Props: `{ eventId: string; eventPrice: number }`

Use existing UI components: `Button`, `Card`, `UIBadge`, and the new `PaymentStatusBadge`.

The component should:
1. Fetch data on mount with `useEffect`
2. Show loading skeleton while fetching
3. Support filter tabs: All | Pending | Paid | Rejected
4. Show proof screenshot in a simple modal/dialog (can be a fixed overlay `div`)
5. After approve/reject, refetch the list
6. Show confirmation toast/message after action

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/components/dashboard/PaymentVerificationPanel.tsx
git commit -m "feat: add PaymentVerificationPanel for organizer dashboard"
```

---

## Task 13: Update Organizer Event Dashboard — Add Payments Tab

**Files:**
- Modify: `src/app/(organizer)/dashboard/events/[id]/page.tsx`

**Step 1: Add a tab system and Payments tab**

Currently this page is a single-view server component (115 lines). Add a simple client-side tab system:

1. Extract the existing participants table into its own section
2. Add a tab bar with "Overview" and "Payments" tabs
3. "Overview" tab: current stats + participant list
4. "Payments" tab: render `PaymentVerificationPanel` component

Since the page is currently a server component, you have two options:
- **Option A:** Make the tab switching a client component wrapper that conditionally renders server-fetched data vs the client `PaymentVerificationPanel`. Create a small `EventDashboardTabs` client component.
- **Option B:** Keep it simple — add a link/button that navigates to a sub-route.

**Recommended: Option A** — Create `src/components/dashboard/EventDashboardTabs.tsx` as a client component that receives the server-rendered overview content as children and switches between Overview and Payments tabs.

The server page passes:
- `eventId` and `eventPrice` (for PaymentVerificationPanel)
- The existing stats and participant list as the "overview" children

Also update the Revenue stat card (line 72-74) to note it only counts verified payments.

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add src/app/(organizer)/dashboard/events/[id]/page.tsx src/components/dashboard/EventDashboardTabs.tsx
git commit -m "feat: add payments tab to organizer event dashboard"
```

---

## Task 14: Update My Events — Show Payment Status and Re-upload

**Files:**
- Modify: `src/app/(participant)/my-events/page.tsx:20-37` (fetch payment fields)
- Modify: `src/components/participant/UpcomingBookings.tsx` (show payment status, re-upload)

**Step 1: Update the query to include payment fields**

At line 22 of `my-events/page.tsx`, update the select to include `payment_status, payment_method, payment_proof_url`:

```typescript
.select("id, qr_code, payment_status, payment_method, payment_proof_url, events(id, title, type, date, location)")
```

At lines 27-37, add the new fields to the mapped booking objects:

```typescript
.map((b: any) => ({
  id: b.id,
  qrCode: b.qr_code || "",
  eventTitle: b.events.title,
  eventType: b.events.type,
  eventDate: b.events.date,
  eventLocation: b.events.location,
  eventId: b.events.id,
  paymentStatus: b.payment_status,
  paymentMethod: b.payment_method,
  paymentProofUrl: b.payment_proof_url,
}));
```

**Step 2: Update UpcomingBookings interface and display**

Add `paymentStatus`, `paymentMethod`, `paymentProofUrl` to the `Booking` interface.

For each booking card:
- Show `PaymentStatusBadge` next to the event type badge
- If `paymentStatus === "pending"` and method is gcash/maya: show "Waiting for verification"
- If `paymentStatus === "rejected"`: show "Payment rejected" + "Re-upload Proof" button
- If `paymentStatus === "pending"` and method is cash: show "Pay cash on event day"
- If `paymentStatus === "paid"`: show "Payment confirmed"
- Only show QR code toggle if `qrCode` exists (not for pending e-wallet)

For the re-upload button: open a file input, submit to `PATCH /api/bookings/{id}/proof` via FormData.

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add src/app/(participant)/my-events/page.tsx src/components/participant/UpcomingBookings.tsx
git commit -m "feat: show payment status and re-upload option in My Events"
```

---

## Task 15: Create Supabase Storage Bucket

**Files:** None (Supabase dashboard or CLI)

**Step 1: Create the `payment-proofs` storage bucket**

Via Supabase Dashboard:
1. Go to Storage in the Supabase dashboard
2. Create a new bucket called `payment-proofs`
3. Set it as **public** (so images can be viewed by organizers)
4. Set file size limit: 5MB
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

Or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS policies for the bucket
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Users can update their own proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs');
```

**Step 2: Commit (if using SQL migration)**

```bash
# Add to existing migration or create new one
git add supabase/migrations/003_payment_proof.sql
git commit --amend --no-edit
```

---

## Task 16: Final Integration Verification

**Step 1: Run full build**

```bash
npm run build
```

Fix any type errors or build failures.

**Step 2: Manual smoke test**

Start dev server and verify these flows:

```bash
npm run dev
```

1. **Free event booking**: Should work as before (instant confirmation + QR)
2. **E-wallet booking**: Select GCash/Maya, see payment instructions, upload screenshot, see pending message
3. **Cash booking**: Select Cash, see cash notice, get QR code immediately
4. **Organizer dashboard**: See Payments tab, view proof, approve/reject
5. **My Events**: See payment status badges, re-upload if rejected

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete payment system integration"
```

---

## Summary of All Files

### New files (10):
- `supabase/migrations/003_payment_proof.sql`
- `src/components/ui/PaymentStatusBadge.tsx`
- `src/components/booking/PaymentInstructions.tsx`
- `src/components/booking/PaymentProofUpload.tsx`
- `src/components/dashboard/PaymentVerificationPanel.tsx`
- `src/components/dashboard/EventDashboardTabs.tsx`
- `src/app/api/bookings/[id]/verify/route.ts`
- `src/app/api/bookings/[id]/proof/route.ts`
- `src/app/api/events/[id]/payments/route.ts`
- `src/lib/email/templates/payment-rejected.ts`

### Modified files (7):
- `src/lib/supabase/types.ts` — add payment proof fields to bookings type
- `src/components/booking/PaymentMethodPicker.tsx` — add Cash option
- `src/components/booking/BookingForm.tsx` — payment instructions, proof upload, FormData submit
- `src/components/booking/BookingConfirmation.tsx` — pending vs confirmed states
- `src/app/(participant)/events/[id]/book/page.tsx` — fetch organizer payment info
- `src/app/api/bookings/route.ts` — handle proof upload, pending status
- `src/app/(participant)/my-events/page.tsx` — fetch payment fields
- `src/components/participant/UpcomingBookings.tsx` — show payment status, re-upload
- `src/app/(organizer)/dashboard/events/[id]/page.tsx` — add Payments tab
