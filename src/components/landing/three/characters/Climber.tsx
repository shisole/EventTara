"use client";

import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
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
    const firstAction = names.length > 0 ? actions[names[0]] : null;
    if (firstAction) {
      firstAction.reset().fadeIn(0.5).play();
    }
  }, [actions, names]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/climber.glb");
