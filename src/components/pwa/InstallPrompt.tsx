"use client";

import Image from "next/image";
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
    if (globalThis.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Visit counter — only show after MIN_VISITS
    const visits = Number.parseInt(localStorage.getItem(VISIT_COUNT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(visits));
    if (visits < MIN_VISITS) return;

    // iOS detection
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in globalThis);
    setIsIOS(isIOSDevice);
    if (isIOSDevice) {
      setShowPrompt(true);
      return;
    }

    // Chrome/Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- beforeinstallprompt event has no built-in type
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    globalThis.addEventListener("beforeinstallprompt", handler);
    return () => globalThis.removeEventListener("beforeinstallprompt", handler);
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
    <div className="fixed bottom-[8.5rem] left-0 right-0 z-[61] mx-4 md:bottom-8 md:mx-auto md:max-w-md">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start gap-3">
          <Image src="/favicon-48x48.png" alt="" width={40} height={40} className="rounded-lg" />
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
