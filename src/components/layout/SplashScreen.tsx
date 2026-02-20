"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem("splash_shown");
  });
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible) return;

    sessionStorage.setItem("splash_shown", "1");

    // Start fade immediately — just enough for a branded flash
    const timer = setTimeout(() => setFadeOut(true), 150);
    const removeTimer = setTimeout(() => setVisible(false), 400);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex items-center justify-center transition-opacity duration-250 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/favicon-192x192.png"
          alt="EventTara"
          width={80}
          height={80}
        />
        <span className="text-4xl font-heading font-bold text-lime-500">
          EventTara
        </span>
        <span className="text-sm text-gray-400">Tara na!</span>
      </div>
    </div>
  );
}
