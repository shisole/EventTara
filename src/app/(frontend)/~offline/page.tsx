import { type Metadata } from "next";

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
