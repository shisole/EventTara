"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ThreeHeroScene = dynamic(() => import("./ThreeHeroScene"), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-gradient-to-b from-sky-400 to-sky-200 dark:from-sky-900 dark:to-slate-800" />
  ),
});

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      globalThis.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export default function ThreeHeroSceneLoader() {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(isWebGLAvailable());
  }, []);

  if (!supported) return null;

  return <ThreeHeroScene />;
}
