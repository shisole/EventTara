# Three.js Scroll-Driven Landing Experience

## Overview

A full-viewport 3D scene replaces the hero section, featuring three outdoor adventure scenes connected in a single world. The camera flies through the world as the user scrolls: mountain climber → mountain biker → road runner. Gated behind a CMS feature flag.

## Stack

- **React Three Fiber** (`@react-three/fiber`) — React renderer for Three.js
- **Drei** (`@react-three/drei`) — Helpers: useGLTF, Environment, useProgress
- **GSAP** (`gsap`) — ScrollTrigger for scroll-driven camera animation
- **3D Assets** — Mixamo (animated characters) + Sketchfab (environments), GLB format

## Architecture

```
Fixed <Canvas> (100vw × 100vh, z-index: 0)
  ↓ scroll progress (0–1)
Scroll spacer div (300vh)
  ↓
Existing landing sections (relative position, normal flow)
```

The canvas stays fixed in the viewport. A 300vh spacer div provides scroll distance. GSAP ScrollTrigger maps scroll position to camera movement along a CatmullRomCurve3 spline.

## Component Structure

```
src/components/landing/three/
├── ThreeHeroScene.tsx        — Main wrapper: Canvas + scroll spacer + overlay text
├── AdventureWorld.tsx        — The 3D scene: terrain, characters, lighting
├── CameraRig.tsx             — GSAP ScrollTrigger → camera spline path
├── characters/
│   ├── Climber.tsx           — GLTF model + Mixamo climbing animation
│   ├── Cyclist.tsx           — GLTF model + Mixamo cycling animation
│   └── Runner.tsx            — GLTF model + Mixamo running animation
└── environment/
    ├── MountainTerrain.tsx   — Rocky mountain geometry/model
    ├── Road.tsx              — Road/path geometry
    └── Vegetation.tsx        — Trees, grass, environmental details
```

## Camera Path

| Scroll % | Camera Position            | Scene                    |
| -------- | -------------------------- | ------------------------ |
| 0–10%    | Close-up on mountain face  | Climber ascending        |
| 10–33%   | Pan out, reveal mountain   | Full climbing scene      |
| 33–50%   | Fly down slope             | Transition to bike trail |
| 50–66%   | Follow alongside cyclist   | Mountain biker on trail  |
| 66–80%   | Pull back, descend to road | Transition to road       |
| 80–100%  | Running alongside runner   | Runner on road           |

Camera position and lookAt target each follow separate splines for smooth motion.

## Text Overlays

HTML elements positioned over the canvas (not 3D text) for crisp rendering:

| Scene   | Text                                      |
| ------- | ----------------------------------------- |
| Climber | "Conquer New Heights"                     |
| Cyclist | "Ride the Trails"                         |
| Runner  | "Find Your Pace"                          |
| End     | CTA: "Explore Events" / "Host Your Event" |

Opacity driven by scroll progress — fade in/out per scene.

## Feature Flag

Gated via `cms_feature_flags` table (`threejs_hero` boolean). When disabled, the existing `HeroSection` carousel renders. The Three.js component is dynamically imported with `ssr: false`.

## 3D Assets

| Asset      | Source                  | Format            |
| ---------- | ----------------------- | ----------------- |
| Climber    | Mixamo                  | GLB               |
| Cyclist    | Sketchfab (free)        | GLB               |
| Runner     | Mixamo                  | GLB               |
| Mountain   | Sketchfab or procedural | GLB/geometry      |
| Road/trail | Procedural              | Three.js geometry |
| Trees      | Sketchfab (free pack)   | GLB               |

Stored in `public/models/`. Total target: < 5 MB compressed.

## Performance

- Dynamic import with `ssr: false`
- Feature-flagged — zero cost when disabled
- GLB compressed with Draco
- `frameloop="demand"` — re-render only on scroll, not continuous 60fps
- `devicePixelRatio` capped at 2
- Gradient placeholder while models load
- WebGL fallback: if unsupported, show existing hero carousel

## Fallback

`<Suspense>` boundary with the existing hero carousel as fallback. Also used as loading state while GLB models download.
