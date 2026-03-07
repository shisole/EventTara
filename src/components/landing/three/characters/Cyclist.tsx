"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { type Group } from "three";

interface CyclistProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function Cyclist({
  position = [0, 0.8, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: CyclistProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/cyclist.glb");
  const { actions, names } = useAnimations(animations, groupRef);

  useEffect(() => {
    const firstAction = names.length > 0 ? actions[names[0]] : null;
    if (firstAction) {
      firstAction.reset().fadeIn(0.5).play();
    }
    return () => {
      firstAction?.fadeOut(0.5).stop();
    };
  }, [actions, names]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

// Preload disabled until model files are added to public/models/
// useGLTF.preload("/models/cyclist.glb");
