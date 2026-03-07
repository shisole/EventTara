"use client";

import dynamic from "next/dynamic";

const ThreeHeroScene = dynamic(() => import("./ThreeHeroScene"), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-gradient-to-b from-sky-400 to-sky-200 dark:from-sky-900 dark:to-slate-800" />
  ),
});

export default function ThreeHeroSceneLoader() {
  return <ThreeHeroScene />;
}
