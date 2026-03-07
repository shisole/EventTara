# Google OAuth Login Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Continue with Google" login/signup using Supabase's built-in Google OAuth provider.

**Architecture:** Use `supabase.auth.signInWithOAuth({ provider: 'google' })` on login and signup pages. Supabase handles the full OAuth flow (redirect to Google → consent → token exchange → redirect back). The existing `/auth/callback` route is extended to sync Google profile data (name, avatar) into the `users` table.

**Tech Stack:** Supabase Auth (Google provider), Next.js App Router, React 19

---

### Task 1: Create GoogleIcon Component

**Files:**

- Create: `src/components/icons/GoogleIcon.tsx`
- Modify: `src/components/icons/index.ts`

**Step 1: Create the GoogleIcon component**

```tsx
// src/components/icons/GoogleIcon.tsx
export default function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
```

**Step 2: Add to barrel export**

In `src/components/icons/index.ts`, add this line after the `FeedIcon` export (alphabetical order):

```ts
export { default as GoogleIcon } from "./GoogleIcon";
```

**Step 3: Commit**

```bash
git add src/components/icons/GoogleIcon.tsx src/components/icons/index.ts
git commit -m "feat: add GoogleIcon component"
```

---

### Task 2: Add Google Login Button to Login Page

**Files:**

- Modify: `src/app/(frontend)/(auth)/login/page.tsx`

**Step 1: Add GoogleIcon to imports**

In `src/app/(frontend)/(auth)/login/page.tsx:7`, update the import:

```ts
import { CheckCircleIcon, GoogleIcon, StravaIcon } from "@/components/icons";
```

**Step 2: Add `googleLoading` state**

After the `showComingSoon` state declaration (line 31), add:

```ts
const [googleLoading, setGoogleLoading] = useState(false);
```

**Step 3: Add `handleGoogleLogin` handler**

After the `handleGuestContinue` function (after line 206), add:

```ts
const handleGoogleLogin = async () => {
  setGoogleLoading(true);
  setError("");
  const { error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${globalThis.location.origin}/auth/callback`,
    },
  });
  if (oauthError) {
    setError(oauthError.message || "Something went wrong. Please try again.");
    setGoogleLoading(false);
  }
};
```

**Step 4: Add Google button to the JSX**

In the non-`showComingSoon` branch (line 269-290), add the Google button BEFORE the Strava button. Replace the block between `)}` and the divider. The section should become:

```tsx
) : (
  <div className="space-y-3">
    <Button
      className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
      size="lg"
      onClick={handleGoogleLogin}
      disabled={googleLoading}
    >
      <GoogleIcon className="w-5 h-5 mr-2" />
      {googleLoading ? "Redirecting..." : "Continue with Google"}
    </Button>
    <Button
      className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white"
      size="lg"
      onClick={() => {
        const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
        if (!clientId) return;
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: `${globalThis.location.origin}/auth/strava/callback`,
          response_type: "code",
          scope: STRAVA_SCOPES.join(","),
          state: JSON.stringify({ flow: "login", returnUrl: "/events" }),
          approval_prompt: "auto",
        });
        globalThis.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
      }}
    >
      <StravaIcon className="w-5 h-5 mr-2" />
      Continue with Strava
    </Button>
  </div>
)}
```

In the `showComingSoon` branch (lines 252-268), add a disabled Google button before the Facebook button:

```tsx
{showComingSoon ? (
  <>
    <Button disabled className="w-full bg-white/60 cursor-not-allowed border border-gray-300" size="lg">
      <GoogleIcon className="w-5 h-5 mr-2" />
      Continue with Google
      <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium">
        Coming Soon
      </span>
    </Button>

    <Button disabled className="w-full bg-[#1877F2]/60 cursor-not-allowed" size="lg">
      Continue with Facebook
      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
        Coming Soon
      </span>
    </Button>

    <Button disabled className="w-full bg-[#FC4C02]/60 cursor-not-allowed" size="lg">
      <StravaIcon className="w-5 h-5 mr-2" />
      Continue with Strava
      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
        Coming Soon
      </span>
    </Button>
  </>
```

**Step 5: Verify no lint/type errors**

Run: `pnpm typecheck && pnpm lint`

**Step 6: Commit**

```bash
git add src/app/\(frontend\)/\(auth\)/login/page.tsx
git commit -m "feat: add Continue with Google button to login page"
```

---

### Task 3: Add Google Login Button to Signup Page

**Files:**

- Modify: `src/app/(frontend)/(auth)/signup/page.tsx`

**Step 1: Add GoogleIcon to imports**

In `src/app/(frontend)/(auth)/signup/page.tsx:7`, update the import:

```ts
import { CheckCircleIcon, GoogleIcon, StravaIcon } from "@/components/icons";
```

**Step 2: Add `googleLoading` state**

After the `showComingSoon` state declaration (line 94), add:

```ts
const [googleLoading, setGoogleLoading] = useState(false);
```

**Step 3: Add `handleGoogleSignup` handler**

After the `buildMetadata` function (after line 106), add:

```ts
const handleGoogleSignup = async () => {
  setGoogleLoading(true);
  setError("");
  const { error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${globalThis.location.origin}/auth/callback`,
    },
  });
  if (oauthError) {
    setError(oauthError.message || "Something went wrong. Please try again.");
    setGoogleLoading(false);
  }
};
```

**Step 4: Add Google button to JSX**

Same pattern as login page. In the non-`showComingSoon` branch (lines 403-424), wrap both buttons in a `<div className="space-y-3">` and add Google button before Strava:

```tsx
) : (
  <div className="space-y-3">
    <Button
      className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
      size="lg"
      onClick={handleGoogleSignup}
      disabled={googleLoading}
    >
      <GoogleIcon className="w-5 h-5 mr-2" />
      {googleLoading ? "Redirecting..." : "Continue with Google"}
    </Button>
    <Button
      className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white"
      size="lg"
      onClick={() => {
        const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
        if (!clientId) return;
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: `${globalThis.location.origin}/auth/strava/callback`,
          response_type: "code",
          scope: STRAVA_SCOPES.join(","),
          state: JSON.stringify({ flow: "login", returnUrl: "/events" }),
          approval_prompt: "auto",
        });
        globalThis.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`;
      }}
    >
      <StravaIcon className="w-5 h-5 mr-2" />
      Continue with Strava
    </Button>
  </div>
)}
```

In the `showComingSoon` branch, add disabled Google button same as login page.

**Step 5: Verify no lint/type errors**

Run: `pnpm typecheck && pnpm lint`

**Step 6: Commit**

```bash
git add src/app/\(frontend\)/\(auth\)/signup/page.tsx
git commit -m "feat: add Continue with Google button to signup page"
```

---

### Task 4: Extend Auth Callback for Google Profile Data

**Files:**

- Modify: `src/app/(frontend)/auth/callback/route.ts`

**Step 1: Update the callback to handle Google sign-ins**

Replace the entire file with:

```ts
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { generateUsername } from "@/lib/utils/generate-username";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/events";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const provider = user.app_metadata?.provider;

        // Sync Google profile data to users table
        if (provider === "google") {
          const meta = user.user_metadata;
          const updates: Record<string, string | null> = {};

          if (meta?.full_name) updates.full_name = meta.full_name;
          if (meta?.avatar_url) updates.avatar_url = meta.avatar_url;

          if (Object.keys(updates).length > 0) {
            await supabase.from("users").update(updates).eq("id", user.id);
          }

          // Generate username if not set
          await generateUsername(supabase, user.id, user.email ?? "");
        }

        // Handle organizer signup metadata
        if (user.user_metadata?.role === "organizer") {
          const meta = user.user_metadata;

          await supabase.from("organizer_profiles").upsert(
            {
              user_id: user.id,
              org_name: meta.org_name,
              description: meta.org_description || null,
              logo_url: meta.org_logo_url || null,
            },
            { onConflict: "user_id" },
          );

          await supabase.from("users").update({ role: "organizer" }).eq("id", user.id);

          return NextResponse.redirect(`${origin}/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
```

**Step 2: Verify no lint/type errors**

Run: `pnpm typecheck && pnpm lint`

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/auth/callback/route.ts
git commit -m "feat: sync Google profile data in auth callback"
```

---

### Task 5: Configure Supabase + GCP (Manual Steps)

This task is done manually by the developer, not by code.

**Step 1: Create Google OAuth credentials**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client IDs**
5. Application type: **Web application**
6. Add authorized redirect URI: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
7. For local development, also add: `http://localhost:54321/auth/v1/callback` (if using Supabase locally)
8. Copy the **Client ID** and **Client Secret**

**Step 2: Configure Supabase**

1. Go to Supabase Dashboard → **Authentication > Providers**
2. Find **Google** and enable it
3. Paste Client ID and Client Secret
4. Save

**Step 3: Test the flow**

1. Run `pnpm dev`
2. Go to `/login` and click "Continue with Google"
3. Verify: redirects to Google consent screen → after consent, redirects back → user is logged in
4. Check `users` table: `full_name` and `avatar_url` should be populated from Google profile
5. Test `/signup` page similarly

---

### Task 6: Final Verification

**Step 1: Run full CI checks**

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

**Step 2: Manual E2E verification**

- Login page: Google button visible and functional
- Signup page: Google button visible and functional
- New Google user: `users` row created with name, avatar, username
- Returning Google user: logged in, profile data synced
- Organizer flow still works (email/password signup with organizer toggle)
- Strava login still works
- Guest login still works
