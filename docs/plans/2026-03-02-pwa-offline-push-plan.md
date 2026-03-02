# PWA + Offline-First + Push Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make EventTara installable as a PWA with offline shell caching, cached event/booking data, and Web Push notifications for bookings, reminders, and badges.

**Architecture:** Serwist wraps the Next.js build to generate a service worker with precaching + runtime caching strategies. Push notifications use VAPID-based Web Push with subscriptions stored in Supabase. A Supabase Edge Function (triggered by DB webhook on `notifications` INSERT) sends push messages.

**Tech Stack:** Serwist (service worker), web-push (VAPID), Supabase Edge Functions (Deno), Next.js App Router

---

### Task 1: Install Dependencies & Configure Serwist

**Files:**

- Modify: `package.json`
- Modify: `next.config.mjs`
- Modify: `tsconfig.json`
- Modify: `.gitignore`

**Step 1: Install Serwist packages**

Run:

```bash
pnpm add @serwist/next && pnpm add -D serwist
```

**Step 2: Update `.gitignore` to exclude generated SW files**

Add after the existing `# worktrees` section (after line 44):

```
# serwist (generated service worker)
public/sw*
public/swe-worker*
```

**Step 3: Wrap `next.config.mjs` with Serwist**

Replace the entire `next.config.mjs` with:

```javascript
import { spawnSync } from "node:child_process";

import withSerwistInit from "@serwist/next";
import { withPayload } from "@payloadcms/next/withPayload";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ??
  crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  disable: process.env.NODE_ENV === "development",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "**.supabase.co";
const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // CI runs lint separately; skip during build to avoid Payload-generated file errors
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true,
  },
  images: {
    deviceSizes: [640, 828, 1200, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Cloudflare R2 public bucket
      ...(r2PublicUrl
        ? [{ protocol: "https", hostname: new URL(r2PublicUrl).hostname }]
        : [{ protocol: "https", hostname: "pub-*.r2.dev" }]),
    ],
  },
  async rewrites() {
    /** @type {import('next').Rewrite[]} */
    const rules = [
      {
        source: "/api/media/file/:path*",
        destination: "/media/:path*",
      },
    ];
    if (supabaseUrl) {
      rules.push({
        source: "/storage/:path*",
        destination: `${supabaseUrl}/storage/v1/object/public/:path*`,
      });
    }
    return rules;
  },
  async headers() {
    return [
      {
        source: "/storage/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/media/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
    ];
  },
};

export default withSerwist(withPayload(nextConfig));
```

Key changes: `withSerwist` wraps the outermost layer. SW disabled in dev mode. SW.js gets no-cache headers.

**Step 4: Update `tsconfig.json`**

Update `compilerOptions.lib` to add `"webworker"`:

```json
"lib": ["dom", "dom.iterable", "esnext", "webworker"],
```

Add `"types"` field:

```json
"types": ["@serwist/next/typings"],
```

Update `"exclude"` to add `"public/sw.js"`:

```json
"exclude": ["node_modules", "scripts", "public/sw.js"]
```

**Step 5: Verify build still works**

Run:

```bash
pnpm typecheck
```

Expected: PASS (no type errors)

**Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.mjs tsconfig.json .gitignore
git commit -m "chore: install serwist and configure next.config for PWA"
```

---

### Task 2: Create Service Worker

**Files:**

- Create: `src/app/sw.ts`

**Step 1: Create the service worker file**

Create `src/app/sw.ts`:

```typescript
import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// ─── Push notification handler ───────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data: { title?: string; body?: string; icon?: string; href?: string } = event.data.json();

  const options: NotificationOptions = {
    body: data.body ?? "",
    icon: data.icon ?? "/favicon-192x192.png",
    badge: "/favicon-48x48.png",
    vibrate: [100, 50, 100],
    data: { href: data.href ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title ?? "EventTara", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href: string = (event.notification.data?.href as string) ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if possible
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate(href);
          return;
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(href);
    }),
  );
});

serwist.addEventListeners();
```

**Step 2: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/sw.ts
git commit -m "feat: add service worker with offline fallback and push handler"
```

---

### Task 3: Create Offline Fallback Page

**Files:**

- Create: `src/app/(frontend)/~offline/page.tsx`

**Step 1: Create the offline page**

Create `src/app/(frontend)/~offline/page.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 text-6xl">📡</div>
      <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
        You&apos;re offline
      </h1>
      <p className="mt-3 max-w-md text-gray-600 dark:text-gray-400">
        It looks like you&apos;ve lost your internet connection. Previously visited pages may still
        be available from cache.
      </p>
      <button
        onClick="window.location.reload()"
        className="mt-6 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
      >
        Try again
      </button>
    </main>
  );
}
```

Wait — the `onClick` with a string won't work in React. We need a client component for the button. Let's keep the page as a server component and extract a tiny client button:

```tsx
import type { Metadata } from "next";

import OfflineRetryButton from "@/components/pwa/OfflineRetryButton";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-6 text-6xl">📡</div>
      <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
        You&apos;re offline
      </h1>
      <p className="mt-3 max-w-md text-gray-600 dark:text-gray-400">
        It looks like you&apos;ve lost your internet connection. Previously visited pages may still
        be available from cache.
      </p>
      <OfflineRetryButton />
    </main>
  );
}
```

Create `src/components/pwa/OfflineRetryButton.tsx`:

```tsx
"use client";

export default function OfflineRetryButton() {
  return (
    <button
      onClick={() => globalThis.location.reload()}
      className="mt-6 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
    >
      Try again
    </button>
  );
}
```

**Step 2: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/~offline/page.tsx src/components/pwa/OfflineRetryButton.tsx
git commit -m "feat: add offline fallback page"
```

---

### Task 4: Update Web Manifest

**Files:**

- Modify: `public/site.webmanifest`

**Step 1: Update the manifest**

Replace `public/site.webmanifest` with:

```json
{
  "name": "EventTara",
  "short_name": "EventTara",
  "description": "Outdoor adventure event booking platform for hiking, mountain biking, road biking, running, and trail running.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#84cc16",
  "categories": ["sports", "lifestyle", "travel"],
  "icons": [
    {
      "src": "/favicon-48x48.png",
      "sizes": "48x48",
      "type": "image/png"
    },
    {
      "src": "/favicon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/favicon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Changes: added `scope`, `categories`, maskable icon entry.

**Step 2: Commit**

```bash
git add public/site.webmanifest
git commit -m "feat: update web manifest with maskable icon and categories"
```

---

### Task 5: Create Offline Indicator Component

**Files:**

- Create: `src/components/pwa/OfflineIndicator.tsx`
- Modify: `src/components/layout/ClientShell.tsx`

**Step 1: Create the OfflineIndicator component**

Create `src/components/pwa/OfflineIndicator.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-white text-center text-sm py-1.5 px-4 font-medium">
      You&apos;re offline — showing cached data
    </div>
  );
}
```

**Step 2: Add OfflineIndicator to ClientShell**

In `src/components/layout/ClientShell.tsx`, add the import (alphabetical, after MobileNav import):

```typescript
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
```

Add `<OfflineIndicator />` as the first child inside the outer `<>` fragment, before the `<div className="transition-all ...">`:

```tsx
return (
    <>
      <OfflineIndicator />
      <div
        className={`transition-all duration-300 origin-top min-h-screen flex flex-col ${
```

**Step 3: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/components/pwa/OfflineIndicator.tsx src/components/layout/ClientShell.tsx
git commit -m "feat: add offline connectivity indicator banner"
```

---

### Task 6: Create Install Prompt Component

**Files:**

- Create: `src/components/pwa/InstallPrompt.tsx`
- Modify: `src/components/layout/ClientShell.tsx`

**Step 1: Create the InstallPrompt component**

Create `src/components/pwa/InstallPrompt.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const VISIT_COUNT_KEY = "pwa-visit-count";
const MIN_VISITS = 2;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Visit counter — only show after MIN_VISITS
    const visits = Number.parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visits));
    if (visits < MIN_VISITS) return;

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    setIsIOS(isIOSDevice);
    if (isIOSDevice) {
      setShowPrompt(true);
      return;
    }

    // Chrome/Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-50 mx-4 mb-2 md:bottom-0 md:mb-4 md:mx-auto md:max-w-md">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <img src="/favicon-48x48.png" alt="" className="h-10 w-10 rounded-lg" />
          <div className="flex-1">
            <p className="font-heading text-sm font-semibold text-gray-900 dark:text-white">
              Install EventTara
            </p>
            {isIOS ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tap the share button, then &quot;Add to Home Screen&quot; for the best experience.
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add to your home screen for quick access and offline support.
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2 justify-end">
          <button
            onClick={handleDismiss}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Not now
          </button>
          {!isIOS && (
            <button
              onClick={() => void handleInstall()}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add InstallPrompt to ClientShell**

In `src/components/layout/ClientShell.tsx`, add the dynamic import (after other dynamic imports, line ~15):

```typescript
const InstallPrompt = dynamic(() => import("@/components/pwa/InstallPrompt"));
```

Add `<InstallPrompt />` after `<ChatBubble />` (just before the closing `</>`):

```tsx
      <ChatBubble />
      <InstallPrompt />
    </>
```

**Step 3: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/components/pwa/InstallPrompt.tsx src/components/layout/ClientShell.tsx
git commit -m "feat: add PWA install prompt with iOS and Android support"
```

---

### Task 7: Add Push Subscription Types to Supabase Types

**Files:**

- Modify: `src/lib/supabase/types.ts`

**Step 1: Add `push_subscriptions` table type**

Find the `notifications` table definition in `src/lib/supabase/types.ts` and add the `push_subscriptions` table right before it (maintaining alphabetical order). The exact location depends on where tables are defined — add alongside the other table definitions:

```typescript
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          keys_p256dh: string;
          keys_auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          keys_p256dh?: string;
          keys_auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
```

**Step 2: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: add push_subscriptions table type"
```

---

### Task 8: Create Push Subscriptions API Route

**Files:**

- Create: `src/app/(frontend)/api/push-subscriptions/route.ts`

**Step 1: Create the API route**

Create `src/app/(frontend)/api/push-subscriptions/route.ts`:

```typescript
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } =
    await request.json();

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: body.endpoint,
      keys_p256dh: body.keys.p256dh,
      keys_auth: body.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: { endpoint?: string } = await request.json();

  if (!body.endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", body.endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

**Step 2: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/api/push-subscriptions/route.ts
git commit -m "feat: add push subscriptions API route (POST/DELETE)"
```

---

### Task 9: Create PushNotificationManager Component

**Files:**

- Create: `src/components/notifications/PushNotificationManager.tsx`

**Step 1: Create the component**

Create `src/components/notifications/PushNotificationManager.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      void navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
      });
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""),
      });

      const serialized: { endpoint: string; keys: { p256dh: string; auth: string } } = JSON.parse(
        JSON.stringify(sub),
      );

      await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serialized),
      });

      setSubscription(sub);
    } catch (err) {
      console.error("Push subscription failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch("/api/push-subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      setSubscription(null);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Push notifications</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {subscription
            ? "You'll receive push notifications for bookings, reminders, and badges."
            : "Get notified about bookings, event reminders, and badge awards."}
        </p>
      </div>
      <button
        onClick={() => void (subscription ? unsubscribe() : subscribe())}
        disabled={loading}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          subscription
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            : "bg-teal-600 text-white hover:bg-teal-700"
        } disabled:opacity-50`}
      >
        {loading ? "..." : subscription ? "Disable" : "Enable"}
      </button>
    </div>
  );
}
```

**Step 2: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/components/notifications/PushNotificationManager.tsx
git commit -m "feat: add push notification subscribe/unsubscribe component"
```

---

### Task 10: Integrate PushNotificationManager into Notification Settings

**Files:**

- Modify: `src/app/(frontend)/(participant)/notifications/page.tsx` (add PushNotificationManager at the top of the notifications page)

**Step 1: Add PushNotificationManager to the notifications page**

Read the current `src/app/(frontend)/(participant)/notifications/page.tsx` file first to understand its structure, then add a dynamic import for `PushNotificationManager` and render it at the top of the page content, above the notification list.

Add the dynamic import:

```typescript
import dynamic from "next/dynamic";

const PushNotificationManager = dynamic(
  () => import("@/components/notifications/PushNotificationManager"),
);
```

Render it at the top of the page content (exact placement depends on current structure — place it above the notification list but below the page heading).

**Step 2: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/app/\(frontend\)/\(participant\)/notifications/page.tsx
git commit -m "feat: integrate push notification toggle on notifications page"
```

---

### Task 11: Add Environment Variables

**Files:**

- Modify: `.env.local.example`
- Modify: `.env.local` (user does manually)

**Step 1: Update `.env.local.example`**

Add after the existing env vars:

```
# Push notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

**Step 2: Generate VAPID keys (user action)**

Run:

```bash
npx web-push generate-vapid-keys
```

Copy the output and paste into `.env.local`.

**Step 3: Commit**

```bash
git add .env.local.example
git commit -m "chore: add VAPID env var placeholders"
```

---

### Task 12: Create Supabase Edge Function for Push Delivery

**Files:**

- Create: `supabase/functions/send-push/index.ts`

**Step 1: Create the Edge Function**

Create `supabase/functions/send-push/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PUSH_TYPES = new Set([
  "booking_confirmed",
  "event_reminder",
  "badge_earned",
  "border_earned",
]);

// Web Push VAPID signing utilities for Deno
async function generateVapidAuth(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  sub: string,
): Promise<{ authorization: string; cryptoKey: string }> {
  const audience = new URL(endpoint).origin;
  const expiry = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12 hours

  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: expiry, sub };

  const encoder = new TextEncoder();

  const toBase64Url = (data: Uint8Array): string =>
    btoa(String.fromCharCode(...data))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const headerB64 = toBase64Url(encoder.encode(JSON.stringify(header)));
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import VAPID private key
  const privateKeyBytes = Uint8Array.from(
    atob(vapidPrivateKey.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      encoder.encode(unsignedToken),
    ),
  );

  const jwt = `${unsignedToken}.${toBase64Url(signature)}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

Deno.serve(async (req) => {
  // Verify webhook secret
  const authHeader = req.headers.get("authorization");
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { record } = await req.json();

  // Only send push for specific notification types
  if (!record?.type || !PUSH_TYPES.has(record.type)) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch user's push subscriptions
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, keys_p256dh, keys_auth")
    .eq("user_id", record.user_id);

  if (!subscriptions?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = JSON.stringify({
    title: record.title,
    body: record.body,
    icon: "/favicon-192x192.png",
    href: record.href ?? "/",
  });

  const expiredIds: string[] = [];
  let sent = 0;

  for (const sub of subscriptions) {
    try {
      const { authorization, cryptoKey } = await generateVapidAuth(
        sub.endpoint,
        vapidPublicKey,
        vapidPrivateKey,
        "mailto:noreply@eventtara.com",
      );

      const res = await fetch(sub.endpoint, {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Crypto-Key": cryptoKey,
          "Content-Type": "application/octet-stream",
          TTL: "86400",
        },
        body: encoder.encode(payload),
      });

      if (res.status === 410 || res.status === 404) {
        expiredIds.push(sub.id);
      } else if (res.ok) {
        sent++;
      }
    } catch (err) {
      console.error(`Push to ${sub.endpoint} failed:`, err);
    }
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return new Response(JSON.stringify({ sent, expired: expiredIds.length }), {
    headers: { "Content-Type": "application/json" },
  });
});

const encoder = new TextEncoder();
```

**Important note:** This Edge Function uses raw VAPID JWT signing which is complex. In practice, you may need the `web-push` npm package ported for Deno, or use a simpler approach. The VAPID signing above is a starting point — the actual Web Push encryption (payload encryption using p256dh and auth keys) is significantly more complex and requires the `ece` (Encrypted Content-Encoding) standard.

**A simpler alternative:** Call a Next.js API route from the Edge Function that uses the Node.js `web-push` package for actual push delivery. This avoids reimplementing Web Push encryption in Deno.

**Recommended approach — hybrid:**

Create `src/app/(frontend)/api/push-subscriptions/send/route.ts` that accepts `{ user_id, title, body, href }`, fetches subscriptions, and sends via `web-push`. The Edge Function simply calls this API route.

This will be adjusted during implementation based on which approach works best.

**Step 2: Commit**

```bash
git add supabase/functions/send-push/index.ts
git commit -m "feat: add Supabase Edge Function for push notification delivery"
```

---

### Task 13: Add web-push Server-Side Sending Route (Hybrid Approach)

**Files:**

- Create: `src/app/(frontend)/api/push-subscriptions/send/route.ts`

**Step 1: Install web-push**

Run:

```bash
pnpm add web-push && pnpm add -D @types/web-push
```

**Step 2: Create the send route**

Create `src/app/(frontend)/api/push-subscriptions/send/route.ts`:

```typescript
import { NextResponse } from "next/server";
import webpush from "web-push";

import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  "mailto:noreply@eventtara.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(request: Request) {
  // Verify internal call via secret header
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: {
    user_id?: string;
    title?: string;
    body?: string;
    href?: string;
  } = await request.json();

  if (!body.user_id || !body.title) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, keys_p256dh, keys_auth")
    .eq("user_id", body.user_id);

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const payload = JSON.stringify({
    title: body.title,
    body: body.body ?? "",
    icon: "/favicon-192x192.png",
    href: body.href ?? "/",
  });

  const expiredIds: string[] = [];
  let sent = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
        },
        payload,
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        expiredIds.push(sub.id);
      } else {
        console.error(`Push failed for ${sub.endpoint}:`, err);
      }
    }
  }

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return NextResponse.json({ sent, expired: expiredIds.length });
}
```

**Step 3: Simplify Edge Function to call this route**

Update `supabase/functions/send-push/index.ts` to be a thin proxy:

```typescript
const PUSH_TYPES = new Set([
  "booking_confirmed",
  "event_reminder",
  "badge_earned",
  "border_earned",
]);

Deno.serve(async (req) => {
  const { record } = await req.json();

  if (!record?.type || !PUSH_TYPES.has(record.type)) {
    return new Response(JSON.stringify({ skipped: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const appUrl = Deno.env.get("APP_URL")!; // e.g. https://eventtara.com
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET")!;

  const res = await fetch(`${appUrl}/api/push-subscriptions/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": webhookSecret,
    },
    body: JSON.stringify({
      user_id: record.user_id,
      title: record.title,
      body: record.body,
      href: record.href,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Step 4: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/app/\(frontend\)/api/push-subscriptions/send/route.ts supabase/functions/send-push/index.ts
git commit -m "feat: add web-push send route and simplify edge function"
```

---

### Task 14: Update Middleware to Exclude Service Worker

**Files:**

- Modify: `src/middleware.ts`

**Step 1: Update the middleware matcher**

The current matcher already excludes static assets by extension. The `sw.js` file ends with `.js` which is NOT excluded by the current pattern (it only excludes image extensions). Update the matcher to also exclude `sw.js`:

```typescript
export const config = {
  matcher: [
    // eslint-disable-next-line unicorn/prefer-string-raw -- Next.js config.matcher requires plain string literals for static analysis
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|admin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Step 2: Verify typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "fix: exclude service worker from Supabase session middleware"
```

---

### Task 15: Build Verification & Smoke Test

**Files:** None (verification only)

**Step 1: Run full CI checks**

Run:

```bash
pnpm format:check && pnpm lint && pnpm typecheck
```

Expected: all PASS

**Step 2: Run production build**

Run:

```bash
pnpm build
```

Expected: Build succeeds. Check output for:

- `public/sw.js` generated
- No build errors related to Serwist

**Step 3: Verify sw.js was generated**

Run:

```bash
ls -la public/sw.js
```

Expected: File exists

**Step 4: Final commit (if any format fixes needed)**

```bash
git add -A && git commit -m "chore: format fixes from PWA integration"
```

---

## User Setup Checklist (Post-Implementation)

These steps must be done by the user manually:

1. **Generate VAPID keys**: `npx web-push generate-vapid-keys` → paste into `.env.local`
2. **Create Supabase migration** for `push_subscriptions` table with RLS policies
3. **Create Supabase DB webhook**: `notifications` INSERT → call `send-push` Edge Function
4. **Set Edge Function secrets**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL`, `WEBHOOK_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
5. **Deploy Edge Function**: `supabase functions deploy send-push`
6. **Set `WEBHOOK_SECRET`** in both `.env.local` and Supabase Edge Function secrets
