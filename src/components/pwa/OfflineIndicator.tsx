"use client";

import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    globalThis.addEventListener("offline", goOffline);
    globalThis.addEventListener("online", goOnline);

    return () => {
      globalThis.removeEventListener("offline", goOffline);
      globalThis.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-white text-center text-sm py-1.5 px-4 font-medium">
      You&apos;re offline — showing cached data
    </div>
  );
}
