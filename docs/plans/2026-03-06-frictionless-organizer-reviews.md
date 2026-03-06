# Frictionless Organizer Reviews Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make leaving an organizer review frictionless for any visitor — add inline auth modal, QR code sharing for organizers, and post-event review request emails.

**Architecture:** Adapt the existing `AuthBookingModal` pattern into an `AuthReviewModal` for inline sign-in on the review page. Add a `ReviewQRCode` client component to organizer dashboard settings. Hook review request emails into the existing `onEventCompleted()` flow.

**Tech Stack:** Next.js 15 (App Router), React 19, Supabase Auth (password + OTP), Resend email, `qrcode.react` for QR generation

---

### Task 1: Create AuthReviewModal component

**Files:**

- Create: `src/components/reviews/AuthReviewModal.tsx`

**Step 1: Create the AuthReviewModal component**

Adapt from `src/components/booking/AuthBookingModal.tsx`. Key differences:

- Props: `organizerName: string` and `onAuthenticated: (user: { id: string; fullName: string }) => void` and `onClose: () => void`
- Header copy: "Sign in to leave your review" with `organizerName` subtitle
- Close button calls `onClose` (not router.push)
- On success: fetch the user profile from Supabase to get `id` and `full_name`, then call `onAuthenticated({ id, fullName })`
- Use teal color scheme instead of lime to match review page styling
- No confetti on success — just close and show the form

```tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { CheckCircleIcon, CloseIcon, EnvelopeIcon } from "@/components/icons";
import { Button, OtpCodeInput } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { generateUsername } from "@/lib/utils/generate-username";

type ModalState = "form" | "verify-code" | "success";
type AuthMethod = "password" | "otp";

const CODE_LENGTH = 6;
const emptyCode = () => Array.from<string>({ length: CODE_LENGTH }).fill("");

interface AuthReviewModalProps {
  organizerName: string;
  onAuthenticated: (user: { id: string; fullName: string }) => void;
  onClose: () => void;
}

export default function AuthReviewModal({
  organizerName,
  onAuthenticated,
  onClose,
}: AuthReviewModalProps) {
  const [state, setState] = useState<ModalState>("form");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState<string[]>(emptyCode());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [userDisplay, setUserDisplay] = useState("");

  // Animate in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Success: auto-close after brief delay
  useEffect(() => {
    if (state !== "success") return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        // Fetch user profile to get id + fullName
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase
              .from("users")
              .select("full_name")
              .eq("id", user.id)
              .single()
              .then(({ data }) => {
                onAuthenticated({
                  id: user.id,
                  fullName: data?.full_name || userDisplay,
                });
              });
          }
        });
      }, 200);
    }, 1500);
    return () => clearTimeout(timer);
  }, [state, userDisplay, onAuthenticated]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (signInError) {
        setError("Invalid email or password.");
        return;
      }
      const displayName = data.user?.user_metadata?.full_name || data.user?.email || trimmed;
      setUserDisplay(displayName);
      setState("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
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
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: trimmed });
      if (otpError) {
        setError(
          otpError.message?.includes("rate")
            ? "Too many attempts. Try again in a few minutes."
            : otpError.message || "Something went wrong. Please try again.",
        );
        return;
      }
      setUserDisplay(trimmed);
      setState("verify-code");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = code.join("");
    if (token.length !== CODE_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: userDisplay,
        token,
        type: "email",
      });
      if (verifyError) {
        setError(verifyError.message || "Invalid code. Please try again.");
        setCode(emptyCode());
        return;
      }
      if (data.user) {
        await generateUsername(supabase, data.user.id, userDisplay);
      }
      const displayName = data.user?.user_metadata?.full_name || data.user?.email || userDisplay;
      setUserDisplay(displayName);
      setState("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: userDisplay });
      if (otpError) {
        setError(
          otpError.message?.includes("rate")
            ? "Too many attempts. Try again in a few minutes."
            : otpError.message || "Something went wrong. Please try again.",
        );
      } else {
        setCode(emptyCode());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-colors";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? "opacity-100 bg-black/60" : "opacity-0 bg-black/0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-review-modal-title"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 transition-all duration-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {state !== "success" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}

        {state === "form" && (
          <form
            onSubmit={authMethod === "password" ? handlePasswordLogin : handleOtpSubmit}
            className="space-y-5"
          >
            <div className="text-center">
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
              </div>
              <h2
                id="auth-review-modal-title"
                className="text-xl font-heading font-bold text-gray-900 dark:text-white"
              >
                Sign in to leave your review
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{organizerName}</p>
            </div>

            <div>
              <label
                htmlFor="review-auth-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="review-auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className={inputClassName}
              />
            </div>

            {authMethod === "password" && (
              <div>
                <label
                  htmlFor="review-auth-password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="review-auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={inputClassName}
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading
                ? authMethod === "password"
                  ? "Signing in..."
                  : "Sending code..."
                : authMethod === "password"
                  ? "Sign In"
                  : "Send Code"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod(authMethod === "password" ? "otp" : "password");
                  setError("");
                }}
                className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium"
              >
                {authMethod === "password"
                  ? "Use a one-time code instead"
                  : "Sign in with password instead"}
              </button>
            </div>

            {authMethod === "otp" && (
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                We&apos;ll send a 6-digit code to your email. Works for new and existing accounts.
              </p>
            )}
          </form>
        )}

        {state === "verify-code" && (
          <OtpCodeInput
            email={userDisplay}
            code={code}
            onCodeChange={(newCode) => {
              setCode(newCode);
              setError("");
            }}
            onSubmit={handleVerifyCode}
            onResend={handleResend}
            onChangeEmail={() => {
              setError("");
              setCode(emptyCode());
              setState("form");
            }}
            loading={loading}
            error={error}
          />
        )}

        {state === "success" && (
          <div className="text-center space-y-3">
            <div className="w-14 h-14 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircleIcon className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            </div>
            <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
              You&apos;re all set!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome,{" "}
              <span className="font-medium text-gray-900 dark:text-white">{userDisplay}</span>!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Verify the component compiles**

Run: `pnpm typecheck`
Expected: No type errors related to `AuthReviewModal`

**Step 3: Commit**

```bash
git add src/components/reviews/AuthReviewModal.tsx
git commit -m "feat: add AuthReviewModal for inline sign-in on review page"
```

---

### Task 2: Update OrganizerReviewSection to show CTA for all visitors

**Files:**

- Modify: `src/components/reviews/OrganizerReviewSection.tsx`

**Step 1: Update the component to support unauthenticated visitors**

Changes:

- Add `organizerName` prop (needed for the auth modal)
- Replace the `canReview` guard: always show the "Write a Review" button unless `isOwnProfile`
- Add `showAuthModal` state for unauthenticated visitors
- Add `currentUser` state that can be updated after auth
- Dynamically import `AuthReviewModal` (heavy modal, behind user interaction)
- After auth success: update local `currentUser` state, show the form, and trigger `router.refresh()` so the server re-renders with the new session

Updated component (key changes only — the full form/list rendering stays the same):

```tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { OrganizerReviewsResponse } from "@/lib/types/organizer-reviews";

import OrganizerReviewForm from "./OrganizerReviewForm";
import OrganizerReviewList from "./OrganizerReviewList";

const AuthReviewModal = dynamic(() => import("./AuthReviewModal"), { ssr: false });

interface OrganizerReviewSectionProps {
  organizerId: string;
  organizerName: string;
  initialData: OrganizerReviewsResponse;
  currentUser: { id: string; fullName: string } | null;
  isOwnProfile: boolean;
  existingReviewId: string | null;
  reviewsPageUrl?: string;
}
```

In the component body, add:

```tsx
const router = useRouter();
const [activeUser, setActiveUser] = useState(currentUser);
const [showAuthModal, setShowAuthModal] = useState(false);

// Update canReview: show button unless it's own profile
const canReview = !isOwnProfile;
const isLoggedIn = !!activeUser;
```

Update the button click handler:

```tsx
{
  canReview && (
    <div className="mb-6">
      {showForm ? (
        // ... existing form code, but use activeUser instead of currentUser ...
        <OrganizerReviewForm
          key={formKey}
          organizerId={organizerId}
          existingReview={existingReview ?? undefined}
          userName={activeUser!.fullName}
          onSuccess={handleSuccess}
        />
      ) : (
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              if (isLoggedIn) {
                setShowForm(true);
              } else {
                setShowAuthModal(true);
              }
            }}
            className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
          >
            {hasReviewed ? "Edit Your Review" : "Write a Review"}
          </button>
        </div>
      )}
    </div>
  );
}

{
  showAuthModal && (
    <AuthReviewModal
      organizerName={organizerName}
      onAuthenticated={(user) => {
        setActiveUser(user);
        setShowAuthModal(false);
        setShowForm(true);
        router.refresh();
      }}
      onClose={() => setShowAuthModal(false)}
    />
  );
}
```

Also update the `refresh` callback to use `activeUser` instead of `currentUser`:

```tsx
if (activeUser) {
  const mine =
    fresh.reviews.find((r) => r.user_id === activeUser.id) ??
    fresh.reviews.find((r) => r.id === myReviewId);
  if (mine) setMyReviewId(mine.id);
}
```

**Step 2: Update callers to pass `organizerName`**

In `src/app/(frontend)/(participant)/organizers/[id]/reviews/page.tsx` (line 187-193), add `organizerName={profile.org_name}`:

```tsx
<OrganizerReviewSection
  organizerId={orgId}
  organizerName={profile.org_name}
  initialData={orgReviewsData}
  currentUser={currentUserInfo}
  isOwnProfile={isOwnProfile}
  existingReviewId={existingOrgReviewId}
/>
```

In `src/app/(frontend)/(participant)/organizers/[id]/page.tsx`, find the `OrganizerReviewSection` usage and add `organizerName={profile.org_name}` there too. The profile variable is already available on that page.

**Step 3: Verify**

Run: `pnpm typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/reviews/OrganizerReviewSection.tsx \
  src/app/\(frontend\)/\(participant\)/organizers/\[id\]/reviews/page.tsx \
  src/app/\(frontend\)/\(participant\)/organizers/\[id\]/page.tsx
git commit -m "feat: show review CTA to all visitors with inline auth modal"
```

---

### Task 3: Create review request email template

**Files:**

- Create: `src/lib/email/templates/review-request.ts`

**Step 1: Create the email template**

Follow the pattern from `src/lib/email/templates/booking-confirmation.ts`. Same table-based HTML, same color scheme.

```tsx
interface ReviewRequestProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  organizerName: string;
  reviewUrl: string;
}

export function reviewRequestHtml({
  userName,
  eventTitle,
  eventDate,
  organizerName,
  reviewUrl,
}: ReviewRequestProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Leave a Review</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0891b2, #0e7490);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">EventTara</h1>
              <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Adventure Awaits</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#2D5A3D;margin:0 0 8px;font-size:20px;">How was your adventure?</h2>
              <p style="color:#555;margin:0 0 24px;font-size:15px;line-height:1.5;">
                Hey ${userName}, thanks for joining <strong>${eventTitle}</strong>!
                Your feedback helps ${organizerName} improve and helps other adventurers decide.
              </p>
              <!-- Event details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f4ef;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#333;font-size:16px;font-weight:600;">${eventTitle}</p>
                    <p style="margin:0;color:#666;font-size:14px;">
                      <span style="color:#0891b2;font-weight:600;">Date:</span> ${eventDate}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 16px;">
                    <a href="${reviewUrl}" style="display:inline-block;background-color:#0891b2;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
                      Leave a Review
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#888;font-size:13px;text-align:center;margin:0;">
                It only takes a minute — rate your experience and optionally add tags or photos.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f4ef;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="color:#999;font-size:12px;margin:0;">
                You received this email because you attended an event on EventTara.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
```

**Step 2: Verify**

Run: `pnpm typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/email/templates/review-request.ts
git commit -m "feat: add review request email template"
```

---

### Task 4: Hook review request emails into onEventCompleted

**Files:**

- Modify: `src/lib/badges/award-event-badge.ts`

**Step 1: Add the sendReviewRequestEmails function and hook it in**

Add a new `sendReviewRequestEmails` function at the bottom of the file. Hook it into `onEventCompleted` after `reEvaluateSystemBadges` — fire-and-forget, same pattern as badge emails.

Add import at the top:

```tsx
import { reviewRequestHtml } from "@/lib/email/templates/review-request";
```

Add call in `onEventCompleted` after line 35 (`reEvaluateSystemBadges`):

```tsx
// Fire-and-forget: review request emails
sendReviewRequestEmails(eventId, checkedInUserIds, supabase).catch(() => null);
```

Add the function at the bottom of the file:

```tsx
/**
 * Fire-and-forget: send review request emails to checked-in participants.
 */
async function sendReviewRequestEmails(
  eventId: string,
  userIds: string[],
  supabase: SupabaseClient<Database>,
) {
  if (userIds.length === 0) return;

  // Get event details + organizer info
  const { data: event } = await supabase
    .from("events")
    .select("title, date, organizer_id, organizer_profiles!inner(id, org_name)")
    .eq("id", eventId)
    .single();

  if (!event) return;

  const orgProfile = (event as any).organizer_profiles;
  const organizerName = orgProfile?.org_name || "this organizer";
  const organizerId = orgProfile?.id || event.organizer_id;
  const reviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com"}/organizers/${organizerId}/reviews`;

  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Date TBD";

  // Get user emails
  const { data: users } = await supabase
    .from("users")
    .select("email, full_name, is_guest")
    .in("id", userIds);

  if (!users) return;

  for (const u of users) {
    if (u.email && !u.is_guest) {
      sendEmail({
        to: u.email,
        subject: `How was ${event.title}? Leave a review for ${organizerName}`,
        html: reviewRequestHtml({
          userName: u.full_name || "Adventurer",
          eventTitle: event.title,
          eventDate,
          organizerName,
          reviewUrl,
        }),
      }).catch((error_) => {
        console.error("[sendReviewRequestEmails] email failed:", error_);
      });
    }
  }
}
```

**Step 2: Verify**

Run: `pnpm typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/badges/award-event-badge.ts
git commit -m "feat: send review request emails on event completion"
```

---

### Task 5: Add ReviewQRCode component to organizer dashboard settings

**Files:**

- Create: `src/components/dashboard/ReviewQRCode.tsx`
- Modify: `src/app/(frontend)/(organizer)/dashboard/settings/page.tsx`

**Step 1: Install qrcode.react**

Run: `pnpm add qrcode.react`

**Step 2: Create ReviewQRCode client component**

```tsx
"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface ReviewQRCodeProps {
  organizerId: string;
  organizerName: string;
}

export default function ReviewQRCode({ organizerId, organizerName }: ReviewQRCodeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://eventtara.com";
  const reviewUrl = `${siteUrl}/organizers/${organizerId}/reviews`;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${organizerName.replace(/\s+/g, "-").toLowerCase()}-review-qr.png`;
    link.href = url;
    link.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the input
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Share this QR code at your events so participants can easily leave reviews.
      </p>

      {/* QR Code */}
      <div className="flex justify-center" ref={canvasRef}>
        <div className="rounded-xl border-2 border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <QRCodeCanvas
            value={reviewUrl}
            size={200}
            level="M"
            includeMargin
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600"
        >
          Download as PNG
        </button>
      </div>

      {/* Shareable URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Shareable Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={reviewUrl}
            className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Add ReviewQRCode section to dashboard settings page**

In `src/app/(frontend)/(organizer)/dashboard/settings/page.tsx`, add after the Strava section (after line 64, before the closing `</div>` of the `space-y-10` wrapper):

```tsx
import ReviewQRCode from "@/components/dashboard/ReviewQRCode";
```

And the section JSX (conditionally rendered when `profile` exists):

```tsx
{
  profile && (
    <section>
      <h2 className="text-xl font-heading font-bold mb-4 dark:text-white">Review QR Code</h2>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md dark:shadow-gray-950/30 p-6">
        <ReviewQRCode organizerId={profile.id} organizerName={profile.org_name} />
      </div>
    </section>
  );
}
```

**Step 4: Verify**

Run: `pnpm typecheck`
Expected: No type errors

**Step 5: Commit**

```bash
git add src/components/dashboard/ReviewQRCode.tsx \
  src/app/\(frontend\)/\(organizer\)/dashboard/settings/page.tsx
git commit -m "feat: add review QR code to organizer dashboard settings"
```

---

### Task 6: Final verification

**Step 1: Run full CI checks**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

Expected: All pass

**Step 2: Fix any issues found**

Address lint/type/format errors.

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address lint and type errors"
```
