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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data: { title?: string; body?: string; icon?: string; href?: string } = event.data.json();

  const options: NotificationOptions & { vibrate?: number[] } = {
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const href: string = String(event.notification.data?.href) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        // Focus existing window if possible
        for (const client of clientList) {
          if ("focus" in client) {
            await client.focus();
            await client.navigate(href);
            return;
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(href);
      }),
  );
});

serwist.addEventListeners();
