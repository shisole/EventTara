"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after a brief moment to let auth resolve
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 400);

    // Remove from DOM after fade animation
    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 700);

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/favicon-192x192.png"
          alt="EventTara"
          width={80}
          height={80}
          priority
        />
        <span className="text-4xl font-heading font-bold text-lime-500">
          EventTara
        </span>
        <span className="text-sm text-gray-400">Tara na!</span>
      </div>
    </div>
  );
}
