# Friend Booking QR Code Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When booking for friends, only show companion QR codes (not the booker's), and label companion bookings on the profile page.

**Architecture:** Minimal changes to 4 files. The API already handles friend-mode logic correctly — we add `mode` to the response, update BookingConfirmation to conditionally hide the user's QR, pass mode through BookingForm, and add companion labels in UpcomingBookings.

**Tech Stack:** Next.js App Router, React, TypeScript, qrcode.react

---

### Task 1: Add `mode` to API response

**Files:**
- Modify: `src/app/(frontend)/api/bookings/route.ts:252-255`

**Step 1: Add mode to the response JSON**

At line 252, change the return statement from:

```typescript
return NextResponse.json({
    booking: bookingRecord,
    companions: insertedCompanions,
  });
```

to:

```typescript
return NextResponse.json({
    booking: bookingRecord,
    companions: insertedCompanions,
    mode,
  });
```

**Step 2: Verify manually**

No automated tests in this project. Verify via dev tools Network tab when booking in friend mode — response should include `"mode": "friend"`.

**Step 3: Commit**

```bash
git add src/app/(frontend)/api/bookings/route.ts
git commit -m "feat: include mode in booking API response"
```

---

### Task 2: Update BookingConfirmation to hide user QR in friend mode

**Files:**
- Modify: `src/components/booking/BookingConfirmation.tsx`

**Step 1: Add `mode` prop to the interface**

At line 12, change:

```typescript
interface BookingConfirmationProps {
  bookingId: string;
  eventTitle: string;
  eventDate: string;
  qrCode: string | null;
  paymentStatus?: string;
  paymentMethod?: string;
  companions?: CompanionConfirmation[];
}
```

to:

```typescript
interface BookingConfirmationProps {
  bookingId: string;
  eventTitle: string;
  eventDate: string;
  qrCode: string | null;
  paymentStatus?: string;
  paymentMethod?: string;
  companions?: CompanionConfirmation[];
  mode?: "self" | "friend";
}
```

**Step 2: Destructure mode in the component**

At line 22-24, change:

```typescript
export default function BookingConfirmation({
  bookingId, eventTitle, eventDate, qrCode, paymentStatus, paymentMethod,
  companions = [],
}: BookingConfirmationProps) {
```

to:

```typescript
export default function BookingConfirmation({
  bookingId, eventTitle, eventDate, qrCode, paymentStatus, paymentMethod,
  companions = [], mode = "self",
}: BookingConfirmationProps) {
```

**Step 3: Add isFriendMode flag**

After line 27 (`const isPendingCash = ...`), add:

```typescript
const isFriendMode = mode === "friend";
```

**Step 4: Update the e-wallet pending section (lines 52-78)**

Change the heading and description for friend mode. Replace lines 54-58:

```typescript
          <div className="text-5xl">✉️</div>
          <h2 className="text-2xl font-heading font-bold">Proof Submitted!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your payment proof for <span className="font-semibold">{eventTitle}</span> has been submitted.
            The organizer will verify it shortly.
          </p>
```

with:

```typescript
          <div className="text-5xl">{isFriendMode ? "👥" : "✉️"}</div>
          <h2 className="text-2xl font-heading font-bold">
            {isFriendMode ? "Friends Registered!" : "Proof Submitted!"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isFriendMode
              ? <>Payment proof for your companions at <span className="font-semibold">{eventTitle}</span> has been submitted. The organizer will verify it shortly.</>
              : <>Your payment proof for <span className="font-semibold">{eventTitle}</span> has been submitted. The organizer will verify it shortly.</>}
          </p>
```

**Step 5: Update the cash pending section (lines 79-99)**

Replace lines 81-89:

```typescript
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-heading font-bold">Spot Reserved!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your spot for <span className="font-semibold">{eventTitle}</span> is reserved.
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💵 Remember to bring cash on the event day to complete your payment.
            </p>
          </div>
```

with:

```typescript
          <div className="text-5xl">{isFriendMode ? "👥" : "🎉"}</div>
          <h2 className="text-2xl font-heading font-bold">
            {isFriendMode ? "Friends Registered!" : "Spot Reserved!"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isFriendMode
              ? <>Spots for your companions at <span className="font-semibold">{eventTitle}</span> are reserved.</>
              : <>Your spot for <span className="font-semibold">{eventTitle}</span> is reserved.</>}
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💵 Remember to bring cash on the event day to complete payment.
            </p>
          </div>
```

Then conditionally show user QR. Replace lines 91-97 (the user QR block):

```typescript
          {qrCode && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 inline-block">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Your QR Code</p>
              <QRCodeSVG value={qrCode} size={200} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Show this QR code at check-in</p>
            </div>
          )}
```

with:

```typescript
          {!isFriendMode && qrCode && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 inline-block">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Your QR Code</p>
              <QRCodeSVG value={qrCode} size={200} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Show this QR code at check-in</p>
            </div>
          )}
```

**Step 6: Update the confirmed/free section (lines 100-115)**

Replace lines 102-105:

```typescript
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-heading font-bold">You&apos;re In!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your spot for <span className="font-semibold">{eventTitle}</span> is confirmed.
          </p>
```

with:

```typescript
          <div className="text-5xl">{isFriendMode ? "👥" : "🎉"}</div>
          <h2 className="text-2xl font-heading font-bold">
            {isFriendMode ? "Friends Registered!" : "You\u0027re In!"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isFriendMode
              ? <>Spots for your companions at <span className="font-semibold">{eventTitle}</span> are confirmed.</>
              : <>Your spot for <span className="font-semibold">{eventTitle}</span> is confirmed.</>}
          </p>
```

Then conditionally show user QR. Replace lines 107-113 (the user QR block):

```typescript
          {qrCode && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 inline-block">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Your QR Code</p>
              <QRCodeSVG value={qrCode} size={200} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Show this QR code at check-in</p>
            </div>
          )}
```

with:

```typescript
          {!isFriendMode && qrCode && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6 inline-block">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Your QR Code</p>
              <QRCodeSVG value={qrCode} size={200} />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Show this QR code at check-in</p>
            </div>
          )}
```

**Step 7: Commit**

```bash
git add src/components/booking/BookingConfirmation.tsx
git commit -m "feat: hide user QR and update messaging in friend booking mode"
```

---

### Task 3: Pass mode from BookingForm to BookingConfirmation

**Files:**
- Modify: `src/components/booking/BookingForm.tsx:123-134`

**Step 1: Pass mode to BookingConfirmation**

At line 123-134, change the confirmation rendering from:

```typescript
  if (booking) {
    return (
      <BookingConfirmation
        bookingId={booking.id}
        eventTitle={eventTitle}
        eventDate={eventDate}
        qrCode={booking.qr_code}
        paymentStatus={booking.payment_status}
        paymentMethod={booking.payment_method}
        companions={booking.companions}
      />
    );
  }
```

to:

```typescript
  if (booking) {
    return (
      <BookingConfirmation
        bookingId={booking.id}
        eventTitle={eventTitle}
        eventDate={eventDate}
        qrCode={booking.qr_code}
        paymentStatus={booking.payment_status}
        paymentMethod={booking.payment_method}
        companions={booking.companions}
        mode={mode}
      />
    );
  }
```

**Step 2: Commit**

```bash
git add src/components/booking/BookingForm.tsx
git commit -m "feat: pass booking mode to BookingConfirmation"
```

---

### Task 4: Add companion labels in UpcomingBookings

**Files:**
- Modify: `src/components/participant/UpcomingBookings.tsx:142-159`

**Step 1: Add "For a friend" label to companion QR cards**

Replace the companion section (lines 142-159):

```typescript
              {b.companions && b.companions.length > 0 && (
                <div className="space-y-2">
                  {b.companions.map((comp, i) => (
                    <div key={i} className="flex justify-center">
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">{comp.full_name}</p>
                        {comp.qr_code ? (
                          <>
                            <QRCodeSVG value={comp.qr_code} size={140} />
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Show at check-in</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 text-center">QR code pending verification</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
```

with:

```typescript
              {b.companions && b.companions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">Companions (booked for friends)</p>
                  {b.companions.map((comp, i) => (
                    <div key={i} className="flex justify-center">
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-medium">👤 {comp.full_name}</p>
                        {comp.qr_code ? (
                          <>
                            <QRCodeSVG value={comp.qr_code} size={140} />
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">Show at check-in</p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 text-center">QR code pending verification</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
```

**Step 2: Add companion count in the booking card header area**

After the price line (line 109), add a companion count indicator. After:

```typescript
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {b.eventPrice > 0 ? `₱${b.eventPrice.toLocaleString()}` : "Free"}
              </p>
```

add:

```typescript
              {b.companions && b.companions.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  👥 {b.companions.length} companion{b.companions.length > 1 ? "s" : ""} booked
                </p>
              )}
```

**Step 3: Commit**

```bash
git add src/components/participant/UpcomingBookings.tsx
git commit -m "feat: add companion labels in upcoming bookings display"
```

---

### Task 5: Manual verification

**Step 1: Run build to check for type errors**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

**Step 2: Manual test — self booking**

1. Go to an event page, book for yourself (self mode)
2. Confirm your QR code is shown on the confirmation page
3. Check profile — booking shows normally

**Step 3: Manual test — friend booking**

1. Go to the same event, visit `/events/{id}/book?for=friend`
2. Add a companion, submit
3. Confirm: only companion QR codes shown, NOT the user's QR
4. Confirm: heading says "Friends Registered!" not "You're In!"
5. Check profile — companions listed under original booking with "booked for friends" label and companion count

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during manual verification"
```
