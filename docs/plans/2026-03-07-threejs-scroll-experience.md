# Three.js Scroll-Driven Landing Experience — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a full-viewport 3D scroll experience to the homepage with three connected scenes (mountain climber → mountain biker → road runner), gated behind a CMS feature flag.

**Architecture:** A fixed `<Canvas>` renders the 3D world while a 300vh scroll spacer drives camera movement along a CatmullRomCurve3 spline via GSAP ScrollTrigger. Text overlays fade in/out per scene. After the 3D section, existing landing page sections render normally. Dynamically imported with `ssr: false`.

**Tech Stack:** React Three Fiber 9, Drei 10, Three.js 0.183, GSAP 3 (ScrollTrigger), Mixamo/Sketchfab GLB models.

---

### Task 1: Install dependencies and configure Next.js

**Files:**

- Modify: `package.json`
- Modify: `next.config.mjs`

**Step 1: Install packages**

Run:

```bash
pnpm add three @react-three/fiber @react-three/drei gsap
pnpm add -D @types/three
```

**Step 2: Add `transpilePackages` to Next.js config**

In `next.config.mjs`, add `transpilePackages: ["three"]` to the `nextConfig` object:

```js
const nextConfig = {
  transpilePackages: ["three"],
  eslint: { ... },
  experimental: { ... },
  // ...rest
};
```

**Step 3: Verify build works**

Run: `pnpm build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.mjs
git commit -m "chore: add three.js, react-three-fiber, drei, gsap dependencies"
```

---

### Task 2: Add feature flag `threejs_hero`

**Files:**

- Modify: `src/lib/cms/types.ts` (add `threejs_hero` to `CmsFeatureFlags`)
- Modify: `src/lib/cms/cached.ts` (add `isThreeJsHeroEnabled()` helper)

**Step 1: Add flag to type**

In `src/lib/cms/types.ts`, add to `CmsFeatureFlags`:

```ts
export interface CmsFeatureFlags {
  // ...existing flags
  threejs_hero: boolean;
}
```

**Step 2: Add cached helper**

In `src/lib/cms/cached.ts`, add a helper function following the existing pattern (e.g., `isActivityFeedEnabled`):

```ts
export async function isThreeJsHeroEnabled(): Promise<boolean> {
  try {
    const flags = await getCachedFeatureFlags();
    return flags?.threejs_hero ?? false;
  } catch {
    return false;
  }
}
```

**Step 3: Add the column in Supabase dashboard**

Tell the user to add `threejs_hero boolean DEFAULT false` to `cms_feature_flags` table via Supabase dashboard.

**Step 4: Commit**

```bash
git add src/lib/cms/types.ts src/lib/cms/cached.ts
git commit -m "feat: add threejs_hero feature flag"
```

---

### Task 3: Create the CameraRig component (scroll-driven camera)

**Files:**

- Create: `src/components/landing/three/CameraRig.tsx`

**Step 1: Create the file**

This is the core component that bridges GSAP ScrollTrigger to the R3F camera. It reads scroll progress and moves the camera along a CatmullRomCurve3 spline.

```tsx
"use client";

import { useLayoutEffect, useRef } from "react";

import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CatmullRomCurve3, Vector3 } from "three";

gsap.registerPlugin(ScrollTrigger);

// Camera position path — flies through the connected world
const cameraPositions = new CatmullRomCurve3(
  [
    // Scene 1: Mountain climber — close up on mountain face
    new Vector3(2, 8, 12),
    new Vector3(0, 10, 8),
    // Transition: pan out and descend
    new Vector3(-4, 6, 2),
    // Scene 2: Mountain biker — trail level
    new Vector3(-8, 3, -4),
    new Vector3(-6, 3, -10),
    // Transition: pull back to road
    new Vector3(-2, 2, -16),
    // Scene 3: Road runner — street level
    new Vector3(4, 2, -22),
    new Vector3(6, 2.5, -28),
  ],
  false,
  "catmullrom",
  0.3,
);

// Camera lookAt target path — keeps focal point on the active character
const lookAtPositions = new CatmullRomCurve3(
  [
    new Vector3(0, 7, 0),
    new Vector3(0, 8, 0),
    new Vector3(-3, 4, -2),
    new Vector3(-6, 1.5, -6),
    new Vector3(-4, 1.5, -12),
    new Vector3(0, 1, -18),
    new Vector3(3, 1, -24),
    new Vector3(5, 1.5, -30),
  ],
  false,
  "catmullrom",
  0.3,
);

interface CameraRigProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onProgressChange?: (progress: number) => void;
}

export default function CameraRig({ scrollContainerRef, onProgressChange }: CameraRigProps) {
  const { camera } = useThree();
  const progressRef = useRef({ value: 0 });

  useLayoutEffect(() => {
    if (!scrollContainerRef.current) return;

    const tween = gsap.to(progressRef.current, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: scrollContainerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          onProgressChange?.(self.progress);
        },
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [scrollContainerRef, onProgressChange]);

  useFrame(() => {
    const t = progressRef.current.value;
    const pos = cameraPositions.getPointAt(t);
    const lookAt = lookAtPositions.getPointAt(t);
    camera.position.copy(pos);
    camera.lookAt(lookAt);
  });

  return null;
}
```

**Step 2: Commit**

```bash
git add src/components/landing/three/CameraRig.tsx
git commit -m "feat: add CameraRig scroll-driven camera component"
```

---

### Task 4: Create the AdventureWorld scene

**Files:**

- Create: `src/components/landing/three/AdventureWorld.tsx`

This assembles the full 3D scene with placeholder geometry. Models will be swapped in later.

**Step 1: Create the file**

```tsx
"use client";

import { Environment } from "@react-three/drei";

import CameraRig from "./CameraRig";

interface AdventureWorldProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onProgressChange?: (progress: number) => void;
}

export default function AdventureWorld({
  scrollContainerRef,
  onProgressChange,
}: AdventureWorldProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />

      {/* Environment map for realistic reflections */}
      <Environment preset="forest" />

      {/* Camera controller */}
      <CameraRig scrollContainerRef={scrollContainerRef} onProgressChange={onProgressChange} />

      {/* === Scene 1: Mountain & Climber === */}
      <group position={[0, 0, 0]}>
        {/* Mountain placeholder — tall cone */}
        <mesh position={[0, 5, 0]}>
          <coneGeometry args={[6, 12, 8]} />
          <meshStandardMaterial color="#6B7280" roughness={0.9} />
        </mesh>
        {/* Climber placeholder — capsule on mountain face */}
        <mesh position={[1.5, 7, 2]}>
          <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
          <meshStandardMaterial color="#EF4444" />
        </mesh>
      </group>

      {/* === Scene 2: Trail & Mountain Biker === */}
      <group position={[-6, 0, -8]}>
        {/* Trail ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[12, 20]} />
          <meshStandardMaterial color="#8B7355" roughness={1} />
        </mesh>
        {/* Biker placeholder */}
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.25, 0.7, 8, 16]} />
          <meshStandardMaterial color="#3B82F6" />
        </mesh>
        {/* Bike wheels placeholder */}
        <mesh position={[0, 0.4, 0.4]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.35, 0.04, 8, 24]} />
          <meshStandardMaterial color="#1F2937" />
        </mesh>
        <mesh position={[0, 0.4, -0.4]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.35, 0.04, 8, 24]} />
          <meshStandardMaterial color="#1F2937" />
        </mesh>
      </group>

      {/* === Scene 3: Road & Runner === */}
      <group position={[4, 0, -26]}>
        {/* Road */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <planeGeometry args={[8, 20]} />
          <meshStandardMaterial color="#4B5563" roughness={0.8} />
        </mesh>
        {/* Road line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[0.15, 18]} />
          <meshStandardMaterial color="#FCD34D" />
        </mesh>
        {/* Runner placeholder */}
        <mesh position={[1, 0.9, 0]}>
          <capsuleGeometry args={[0.2, 0.8, 8, 16]} />
          <meshStandardMaterial color="#10B981" />
        </mesh>
      </group>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -14]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#4ADE80" roughness={1} />
      </mesh>

      {/* Fog for depth */}
      <fog attach="fog" args={["#87CEEB", 20, 60]} />
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/three/AdventureWorld.tsx
git commit -m "feat: add AdventureWorld 3D scene with placeholder geometry"
```

---

### Task 5: Create the ThreeHeroScene wrapper with text overlays

**Files:**

- Create: `src/components/landing/three/ThreeHeroScene.tsx`

This is the main component that composes the Canvas, scroll spacer, and HTML text overlays.

**Step 1: Create the file**

```tsx
"use client";

import { Suspense, useCallback, useRef, useState } from "react";

import { Canvas } from "@react-three/fiber";
import Link from "next/link";

import AdventureWorld from "./AdventureWorld";

const SCENES = [
  { label: "Conquer New Heights", subtitle: "Hiking adventures that take you to the summit" },
  { label: "Ride the Trails", subtitle: "Mountain biking through rugged terrain" },
  { label: "Find Your Pace", subtitle: "Running routes for every level" },
];

function getActiveScene(progress: number): number {
  if (progress < 0.33) return 0;
  if (progress < 0.66) return 1;
  return 2;
}

function getSceneOpacity(progress: number, sceneIndex: number): number {
  const sceneStart = sceneIndex * 0.33;
  const sceneMid = sceneStart + 0.165;
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

  const activeScene = getActiveScene(progress);
  const showCTA = progress > 0.9;

  return (
    <div className="relative">
      {/* Fixed 3D Canvas */}
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

      {/* Scroll spacer — drives the camera animation */}
      <div ref={scrollRef} className="relative z-10" style={{ height: "300vh" }}>
        {/* Text overlays for each scene */}
        {SCENES.map((scene, i) => (
          <div
            key={scene.label}
            className="pointer-events-none sticky top-0 flex h-screen items-center justify-center"
            style={{ opacity: getSceneOpacity(progress, i) }}
          >
            <div className="text-center px-4">
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold text-white drop-shadow-lg mb-4">
                {scene.label}
              </h2>
              <p className="text-lg sm:text-xl text-white/80 drop-shadow max-w-xl mx-auto">
                {scene.subtitle}
              </p>
            </div>
          </div>
        ))}

        {/* CTA at end of scroll */}
        <div
          className="pointer-events-auto sticky top-0 flex h-screen items-center justify-center"
          style={{ opacity: showCTA ? 1 : 0, transition: "opacity 0.5s" }}
        >
          <div className="text-center px-4">
            <h2 className="text-4xl sm:text-6xl font-heading font-bold text-white drop-shadow-lg mb-4">
              Tara na!
            </h2>
            <p className="text-xl text-white/80 drop-shadow mb-8 max-w-lg mx-auto">
              Book your next outdoor adventure across the Philippines.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/events"
                className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 bg-lime-500 hover:bg-lime-400 text-slate-900 transition-colors"
              >
                Explore Events
              </Link>
              <Link
                href="/signup?role=organizer"
                className="inline-flex items-center justify-center font-semibold rounded-xl text-lg py-4 px-8 border-2 border-white/60 text-white hover:border-white hover:bg-white/10 transition-colors"
              >
                Host Your Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Gradient transition to next section */}
      <div className="relative z-10 h-32 -mt-32 bg-gradient-to-b from-transparent to-white dark:to-slate-800" />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/landing/three/ThreeHeroScene.tsx
git commit -m "feat: add ThreeHeroScene wrapper with scroll spacer and text overlays"
```

---

### Task 6: Integrate into homepage with feature flag

**Files:**

- Modify: `src/app/(frontend)/page.tsx`

**Step 1: Add feature flag check and conditional rendering**

At the top of the file, add the dynamic import and feature flag import:

```tsx
import dynamic from "next/dynamic";

import { isThreeJsHeroEnabled } from "@/lib/cms/cached";
```

Add the dynamic import (below regular imports, above metadata):

```tsx
const ThreeHeroScene = dynamic(() => import("@/components/landing/three/ThreeHeroScene"), {
  ssr: false,
  loading: () => (
    <div className="h-screen bg-gradient-to-b from-sky-400 to-sky-200 dark:from-sky-900 dark:to-slate-800" />
  ),
});
```

In the `Home()` function, add the flag check alongside existing data fetches:

```tsx
const [heroData, settings, sectionsData, threejsEnabled] = await Promise.all([
  getCachedHeroCarousel(),
  getCachedSiteSettings(),
  getCachedHomepageSections(),
  isThreeJsHeroEnabled(),
]);
```

In the JSX return, render `ThreeHeroScene` before the sections when enabled:

```tsx
return (
  <main>
    <EntryBanner />

    {threejsEnabled && <ThreeHeroScene />}

    {enabledSections.map((section) => (
      <div key={section.key}>
        {renderSection(section.key, parallaxImageUrl, transformedHeroData)}
      </div>
    ))}

    <OrganizerWaitlistModal />
  </main>
);
```

When `threejsEnabled` is true, the "hero" section in `renderSection` still renders but appears below the 3D experience. This keeps the CMS section ordering working. The 3D scene replaces the visual hero position.

**Step 2: Verify dev server works**

Run: `pnpm dev`
Expected: Homepage loads. If `threejs_hero` flag is false in DB (or column doesn't exist yet), existing hero renders normally. If true, the 3D scene renders.

**Step 3: Commit**

```bash
git add src/app/(frontend)/page.tsx
git commit -m "feat: integrate ThreeHeroScene into homepage behind feature flag"
```

---

### Task 7: Source and add 3D models

**Files:**

- Create: `public/models/` directory
- Add GLB files for climber, cyclist, runner

**Step 1: Source models**

Download from Mixamo/Sketchfab:

- **Climber:** Go to [Mixamo](https://www.mixamo.com/) → pick a character → search "climbing" animation → download as FBX → convert to GLB via Blender or [gltf.report](https://gltf.report)
- **Cyclist:** Search [Sketchfab](https://sketchfab.com/search?q=cyclist&type=models&licenses=7c23a1ba438d4306920229c12afcb5f9) for free cyclist models (CC license) → download GLB
- **Runner:** Mixamo → same character as climber → "running" animation → FBX → GLB

**Step 2: Optimize models**

Use [gltf.report](https://gltf.report) or `gltf-transform` CLI to:

- Apply Draco compression
- Remove unused materials/textures
- Target < 1.5 MB per model

Place files at:

```
public/models/climber.glb
public/models/cyclist.glb
public/models/runner.glb
```

**Step 3: Commit**

```bash
git add public/models/
git commit -m "feat: add 3D character models (climber, cyclist, runner)"
```

---

### Task 8: Create character components with GLTF loading

**Files:**

- Create: `src/components/landing/three/characters/Climber.tsx`
- Create: `src/components/landing/three/characters/Cyclist.tsx`
- Create: `src/components/landing/three/characters/Runner.tsx`

**Step 1: Create character components**

Each character follows the same pattern. Example for Climber:

```tsx
"use client";

import { useEffect, useRef } from "react";

import { useAnimations, useGLTF } from "@react-three/drei";
import { type Group } from "three";

interface ClimberProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function Climber({
  position = [1.5, 7, 2],
  rotation = [0, 0, 0],
  scale = 1,
}: ClimberProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/climber.glb");
  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]!.reset().fadeIn(0.5).play();
    }
  }, [actions, names]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/climber.glb");
```

Repeat the same pattern for `Cyclist.tsx` (using `/models/cyclist.glb`) and `Runner.tsx` (using `/models/runner.glb`), adjusting default positions to match scene layout.

**Step 2: Update AdventureWorld to use character components**

Replace the placeholder capsule meshes in `AdventureWorld.tsx` with the real character components:

```tsx
import Climber from "./characters/Climber";
import Cyclist from "./characters/Cyclist";
import Runner from "./characters/Runner";

// Replace placeholder capsules with:
<Climber position={[1.5, 7, 2]} scale={0.01} />
<Cyclist position={[-6, 0.8, -8]} scale={0.01} />
<Runner position={[5, 0.9, -26]} scale={0.01} />
```

Note: `scale` will need to be tuned based on actual model sizes.

**Step 3: Commit**

```bash
git add src/components/landing/three/characters/
git add src/components/landing/three/AdventureWorld.tsx
git commit -m "feat: add character components with GLTF loading and animations"
```

---

### Task 9: Add environment models (mountain, terrain, vegetation)

**Files:**

- Create: `src/components/landing/three/environment/MountainTerrain.tsx`
- Create: `src/components/landing/three/environment/Vegetation.tsx`
- Modify: `src/components/landing/three/AdventureWorld.tsx`

**Step 1: Source or create environment assets**

Options:

- Download free mountain/terrain models from Sketchfab
- Use procedural terrain generation with Three.js `PlaneGeometry` + displacement map
- Use simple rock meshes with `meshStandardMaterial` roughness

**Step 2: Create environment components**

Follow the same `useGLTF` pattern as character components, or build procedural geometry using Three.js primitives.

**Step 3: Integrate into AdventureWorld**

Replace remaining placeholder geometry with environment components.

**Step 4: Commit**

```bash
git add src/components/landing/three/environment/
git add src/components/landing/three/AdventureWorld.tsx
git commit -m "feat: add environment models and terrain"
```

---

### Task 10: Performance tuning and loading state

**Files:**

- Modify: `src/components/landing/three/ThreeHeroScene.tsx`

**Step 1: Add loading progress indicator**

Use `useProgress` from drei to show a loading bar while models download:

```tsx
import { useProgress } from "@react-three/drei";

function LoadingScreen() {
  const { progress } = useProgress();
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-sky-400">
      <p className="text-white text-lg font-medium mb-4">Loading adventure...</p>
      <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

**Step 2: Set `frameloop="demand"` once scroll interaction is confirmed working**

Change the Canvas prop from `frameloop="always"` to `frameloop="demand"` and use `invalidate()` inside `useFrame` to only re-render when needed. This saves GPU on idle.

**Step 3: Test on mobile**

Verify on a real mobile device:

- Scroll feels smooth
- Models load within reasonable time (< 3s on 4G)
- No excessive battery drain
- Text overlays are readable

**Step 4: Commit**

```bash
git add src/components/landing/three/ThreeHeroScene.tsx
git commit -m "perf: add loading screen and optimize Three.js rendering"
```

---

### Task 11: Final polish and camera path tuning

**Files:**

- Modify: `src/components/landing/three/CameraRig.tsx` (tune spline points)
- Modify: `src/components/landing/three/AdventureWorld.tsx` (adjust positions/lighting)
- Modify: `src/components/landing/three/ThreeHeroScene.tsx` (overlay text timing)

**Step 1: Tune camera spline**

With real models in place, adjust the `CatmullRomCurve3` control points in `CameraRig.tsx` so the camera:

- Starts close to the climber's face/body
- Smoothly transitions between scenes
- Ends at a comfortable distance from the runner

This is an iterative process — tweak points, save, check in browser.

**Step 2: Adjust model positions and scales**

Align character and environment positions so the camera path feels natural.

**Step 3: Fine-tune text overlay timing**

Adjust `getSceneOpacity()` thresholds so text appears at the right moments during scroll.

**Step 4: Final commit**

```bash
git add src/components/landing/three/
git commit -m "feat: finalize camera path, model positions, and overlay timing"
```
