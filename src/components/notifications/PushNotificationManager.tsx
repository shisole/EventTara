"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.codePointAt(i) ?? 0;
  }
  return outputArray;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (VAPID_PUBLIC_KEY && "serviceWorker" in navigator && "PushManager" in globalThis) {
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
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const serialized = sub.toJSON();

      await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: serialized.endpoint,
          keys: serialized.keys,
        }),
      });

      setSubscription(sub);
    } catch (error) {
      console.error("Push subscription failed:", error);
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
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
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
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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
