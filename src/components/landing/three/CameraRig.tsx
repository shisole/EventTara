"use client";

import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { CatmullRomCurve3, Vector3 } from "three";

gsap.registerPlugin(ScrollTrigger);

// 12 waypoints for smooth camera path across three scenes
const cameraPositions = new CatmullRomCurve3(
  [
    // Scene 1: Mountain & Climber (0–33%)
    new Vector3(4, 9, 14), // Wide scenic establishing shot of the mountain
    new Vector3(6, 10, 8), // Orbit right, rising to reveal the peak
    new Vector3(4, 9, 4), // Continue orbit to face the mountain wall
    new Vector3(2, 8, 3), // Close approach to the climber on the face

    // Scene 2: Trail & Mountain Biker (33–66%)
    new Vector3(-2, 5, -2), // Transition — descend away from mountain
    new Vector3(-6, 3.5, -5), // Arrive at trail level, approaching the biker
    new Vector3(-8, 2.8, -8), // Alongside the cyclist on the dirt trail
    new Vector3(-5, 3, -12), // Pull back slightly, following the trail

    // Scene 3: Road & Runner (66–100%)
    new Vector3(-1, 2.5, -18), // Transition — glide toward the road
    new Vector3(3, 2.2, -23), // Approaching runner from the side
    new Vector3(5, 2, -26), // Eye-level alongside the runner
    new Vector3(6, 2.2, -29), // Final pullback for CTA framing
  ],
  false,
  "catmullrom",
  0.25,
);

// lookAt targets keep each character centered during their scene
const lookAtPositions = new CatmullRomCurve3(
  [
    // Scene 1: Focus on mountain peak then climber
    new Vector3(0, 7, 0), // Mountain peak
    new Vector3(1, 8, 1), // Transition toward climber area
    new Vector3(1.5, 7.5, 2), // Climber on the face
    new Vector3(1.5, 7, 2), // Hold on climber

    // Scene 2: Focus on the cyclist
    new Vector3(-4, 2, -5), // Transition toward trail
    new Vector3(-6, 1.2, -8), // Cyclist on trail
    new Vector3(-6, 1, -8), // Hold on cyclist
    new Vector3(-5, 1.2, -10), // Following cyclist along trail

    // Scene 3: Focus on the runner
    new Vector3(2, 1, -22), // Transition toward road
    new Vector3(5, 1, -26), // Runner on road
    new Vector3(5, 1, -26), // Hold on runner
    new Vector3(5, 1.2, -27), // Slight drift for CTA
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
