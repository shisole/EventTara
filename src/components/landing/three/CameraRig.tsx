"use client";

import { useFrame, useThree } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { CatmullRomCurve3, Vector3 } from "three";

gsap.registerPlugin(ScrollTrigger);

const cameraPositions = new CatmullRomCurve3(
  [
    new Vector3(2, 8, 12),
    new Vector3(0, 10, 8),
    new Vector3(-4, 6, 2),
    new Vector3(-8, 3, -4),
    new Vector3(-6, 3, -10),
    new Vector3(-2, 2, -16),
    new Vector3(4, 2, -22),
    new Vector3(6, 2.5, -28),
  ],
  false,
  "catmullrom",
  0.3,
);

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
