"use client";

import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { CatmullRomCurve3, Vector3 } from "three";

import { getTerrainHeight } from "./environment/MountainTerrain";

gsap.registerPlugin(ScrollTrigger);

// Climber surface height for camera targeting
const climberY = getTerrainHeight(1.5, 2) + 0.5;

// 12 waypoints for smooth camera path across three scenes
const cameraPositions = new CatmullRomCurve3(
  [
    // Scene 1: Mountain & Climber (0–33%)
    new Vector3(8, 14, 20), // Wide scenic establishing shot — zoomed out for taller mountain
    new Vector3(12, 15, 10), // Orbit right, rising to reveal the peak
    new Vector3(8, 14, 5), // Continue orbit to face the mountain wall
    new Vector3(4, climberY + 2, 6), // Close approach to the climber on the face

    // Scene 2: Trail & Mountain Biker (33–66%)
    new Vector3(-2, 4, -2), // Transition — descend away from mountain
    new Vector3(-6, 2, -5), // Arrive at trail level, approaching the biker
    new Vector3(-8, 1.5, -8), // Alongside the cyclist on the dirt trail
    new Vector3(-5, 1.8, -12), // Pull back slightly, following the trail

    // Scene 3: Road & Runner (66–100%)
    new Vector3(-1, 1.5, -18), // Transition — glide toward the road
    new Vector3(3, 1.2, -23), // Approaching runner from the side
    new Vector3(5, 1, -26), // Eye-level alongside the runner
    new Vector3(6, 1.2, -29), // Final pullback for CTA framing
  ],
  false,
  "catmullrom",
  0.25,
);

// lookAt targets keep each character centered during their scene
const lookAtPositions = new CatmullRomCurve3(
  [
    // Scene 1: Focus on mountain peak then climber
    new Vector3(0, 12, 0), // Mountain peak area
    new Vector3(1, climberY + 1, 1), // Transition toward climber area
    new Vector3(1.5, climberY, 2), // Climber on the face
    new Vector3(1.5, climberY, 2), // Hold on climber

    // Scene 2: Focus on the cyclist (smaller, at y≈0.3)
    new Vector3(-4, 1, -5), // Transition toward trail
    new Vector3(-6, 0.5, -8), // Cyclist on trail
    new Vector3(-6, 0.4, -8), // Hold on cyclist
    new Vector3(-5, 0.5, -10), // Following cyclist along trail

    // Scene 3: Focus on the runner (smaller, at y≈0.35)
    new Vector3(2, 0.5, -22), // Transition toward road
    new Vector3(5, 0.5, -26), // Runner on road
    new Vector3(5, 0.4, -26), // Hold on runner
    new Vector3(5, 0.5, -27), // Slight drift for CTA
  ],
  false,
  "catmullrom",
  0.25,
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
