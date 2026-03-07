"use client";

import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import { Suspense, useCallback, useRef, useState } from "react";

import AdventureWorld from "./AdventureWorld";

const SCENES = [
  { label: "Conquer New Heights", subtitle: "Hiking adventures that take you to the summit" },
  { label: "Ride the Trails", subtitle: "Mountain biking through rugged terrain" },
  { label: "Find Your Pace", subtitle: "Running routes for every level" },
];

function getSceneOpacity(progress: number, sceneIndex: number): number {
  const sceneStart = sceneIndex * 0.33;
  const sceneEnd = sceneStart + 0.33;
  const fadeIn = 0.05;
  const fadeOut = 0.05;

  if (progress < sceneStart + fadeIn) {
    return Math.max(0, (progress - sceneStart) / fadeIn);
  }
  if (progress > sceneEnd - fadeOut) {
    return Math.max(0, (sceneEnd - progress) / fadeOut);
  }
  if (progress >= sceneStart + fadeIn && progress <= sceneEnd - fadeOut) {
    return 1;
  }
  return 0;
}

export default function ThreeHeroScene() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const showCTA = progress > 0.9;

  return (
    <div className="relative">
      <div className="fixed inset-0 z-0">
        <Canvas
          camera={{ fov: 50, near: 0.1, far: 200 }}
          dpr={[1, 2]}
          frameloop="always"
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={["#87CEEB"]} />
          <Suspense fallback={null}>
            <AdventureWorld scrollContainerRef={scrollRef} onProgressChange={handleProgress} />
          </Suspense>
        </Canvas>
      </div>

      <div ref={scrollRef} className="relative z-10" style={{ height: "300vh" }}>
        {SCENES.map((scene, i) => (
          <div
            key={scene.label}
            className="pointer-events-none sticky top-0 flex h-screen items-center justify-center"
            style={{ opacity: getSceneOpacity(progress, i) }}
          >
            <div className="px-4 text-center">
              <h2 className="mb-4 font-heading text-4xl font-bold text-white drop-shadow-lg sm:text-6xl lg:text-7xl">
                {scene.label}
              </h2>
              <p className="mx-auto max-w-xl text-lg text-white/80 drop-shadow sm:text-xl">
                {scene.subtitle}
              </p>
            </div>
          </div>
        ))}

        <div
          className="pointer-events-auto sticky top-0 flex h-screen items-center justify-center"
          style={{ opacity: showCTA ? 1 : 0, transition: "opacity 0.5s" }}
        >
          <div className="px-4 text-center">
            <h2 className="mb-4 font-heading text-4xl font-bold text-white drop-shadow-lg sm:text-6xl">
              Tara na!
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-xl text-white/80 drop-shadow">
              Book your next outdoor adventure across the Philippines.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-xl bg-lime-500 px-8 py-4 text-lg font-semibold text-slate-900 transition-colors hover:bg-lime-400"
              >
                Explore Events
              </Link>
              <Link
                href="/signup?role=organizer"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white/60 px-8 py-4 text-lg font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                Host Your Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-32 h-32 bg-gradient-to-b from-transparent to-white dark:to-slate-800" />
    </div>
  );
}
