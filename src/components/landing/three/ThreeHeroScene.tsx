"use client";

import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Link from "next/link";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  Suspense,
  useCallback,
  useRef,
  useState,
} from "react";

import AdventureWorld from "./AdventureWorld";

const SCENES = [
  { label: "Conquer New Heights", subtitle: "Hiking adventures that take you to the summit" },
  { label: "Ride the Trails", subtitle: "Mountain biking through rugged terrain" },
  { label: "Find Your Pace", subtitle: "Running routes for every level" },
];

function getSceneOpacity(progress: number, sceneIndex: number): number {
  const sceneStart = sceneIndex * 0.33;
  const sceneEnd = sceneStart + 0.33;
  // Slight delay before text appears after camera reaches the scene
  const delay = 0.03;
  const fadeIn = 0.08;
  const fadeOut = 0.06;

  const delayedStart = sceneStart + delay;

  if (progress < delayedStart) {
    return 0;
  }
  if (progress < delayedStart + fadeIn) {
    return Math.max(0, (progress - delayedStart) / fadeIn);
  }
  if (progress > sceneEnd - fadeOut) {
    return Math.max(0, (sceneEnd - progress) / fadeOut);
  }
  if (progress >= delayedStart + fadeIn && progress <= sceneEnd - fadeOut) {
    return 1;
  }
  return 0;
}

function getCtaOpacity(progress: number): number {
  // CTA fades in from 0.85 to 1.0 for a gradual reveal
  if (progress < 0.85) return 0;
  return Math.min(1, (progress - 0.85) / 0.15);
}

function LoadingScreen() {
  const { progress, active } = useProgress();

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 to-sky-200 dark:from-sky-900 dark:to-slate-800">
      <p className="mb-4 text-lg font-medium text-white">Loading adventure...</p>
      <div className="h-2 w-64 overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-white/60">{Math.round(progress)}%</p>
    </div>
  );
}

interface CanvasErrorBoundaryProps {
  children: ReactNode;
}

interface CanvasErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  constructor(props: CanvasErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ThreeHeroScene WebGL error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-sky-400 to-sky-200 dark:from-sky-900 dark:to-slate-800" />
      );
    }
    return this.props.children;
  }
}

export default function ThreeHeroScene() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const handleProgress = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const ctaOpacity = getCtaOpacity(progress);
  const scrollIndicatorOpacity = progress < 0.05 ? 1 : Math.max(0, 1 - (progress - 0.05) / 0.05);

  return (
    <div className="relative">
      <LoadingScreen />

      <div className="fixed inset-0 z-0">
        <CanvasErrorBoundary>
          <Canvas
            camera={{ fov: 50, near: 0.1, far: 200 }}
            dpr={[1, 2]}
            frameloop="always"
            gl={{ antialias: true, alpha: false }}
            performance={{ min: 0.5 }}
          >
            <color attach="background" args={["#87CEEB"]} />
            <Suspense fallback={null}>
              <AdventureWorld scrollContainerRef={scrollRef} onProgressChange={handleProgress} />
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>
      </div>

      <div
        ref={scrollRef}
        className="relative z-10"
        style={{ height: "300vh", willChange: "transform" }}
      >
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
          style={{ opacity: ctaOpacity }}
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

      {/* Scroll-down indicator — animated chevron that fades out on scroll */}
      <div
        className="pointer-events-none fixed bottom-8 left-1/2 z-10 -translate-x-1/2"
        style={{ opacity: scrollIndicatorOpacity }}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium tracking-wider text-white/70">SCROLL</span>
          <svg
            className="h-6 w-6 animate-bounce text-white/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Gradient blend into the next section */}
      <div className="relative z-10 -mt-48 h-48 bg-gradient-to-b from-transparent via-white/40 to-white dark:via-slate-800/40 dark:to-slate-800" />
    </div>
  );
}
