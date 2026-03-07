"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { type Group } from "three";

interface RunnerProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function Runner({
  position = [1, 0.9, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RunnerProps) {
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF("/models/runner.glb");
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
// useGLTF.preload("/models/runner.glb");
