"use client";

import { Environment } from "@react-three/drei";
import { Suspense } from "react";

import CameraRig from "./CameraRig";
import Climber from "./characters/Climber";
import Cyclist from "./characters/Cyclist";
import Runner from "./characters/Runner";
import MountainTerrain from "./environment/MountainTerrain";
import Road from "./environment/Road";
import Vegetation from "./environment/Vegetation";

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
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
      <Environment preset="forest" />
      <CameraRig scrollContainerRef={scrollContainerRef} onProgressChange={onProgressChange} />

      {/* Scene 1: Mountain & Climber */}
      <group position={[0, 0, 0]}>
        <MountainTerrain position={[0, 0, 0]} />
        <Suspense
          fallback={
            <mesh position={[1.5, 7, 2]}>
              <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
              <meshStandardMaterial color="#EF4444" />
            </mesh>
          }
        >
          <Climber position={[1.5, 7, 2]} scale={0.01} />
        </Suspense>
      </group>

      {/* Vegetation between Scene 1 and Scene 2 */}
      <Vegetation position={[6, 0, -4]} density={10} />
      <Vegetation position={[-8, 0, -6]} density={8} />

      {/* Scene 2: Trail & Mountain Biker */}
      <group position={[-6, 0, -8]}>
        <Road variant="trail" position={[0, 0, 0]} />
        <Suspense
          fallback={
            <>
              <mesh position={[0, 0.8, 0]}>
                <capsuleGeometry args={[0.25, 0.7, 8, 16]} />
                <meshStandardMaterial color="#3B82F6" />
              </mesh>
              <mesh position={[0, 0.4, 0.4]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.35, 0.04, 8, 24]} />
                <meshStandardMaterial color="#1F2937" />
              </mesh>
              <mesh position={[0, 0.4, -0.4]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.35, 0.04, 8, 24]} />
                <meshStandardMaterial color="#1F2937" />
              </mesh>
            </>
          }
        >
          <Cyclist position={[0, 0.8, 0]} scale={0.01} />
        </Suspense>
      </group>

      {/* Vegetation between Scene 2 and Scene 3 */}
      <Vegetation position={[2, 0, -18]} density={14} />
      <Vegetation position={[-4, 0, -22]} density={6} />

      {/* Scene 3: Road & Runner */}
      <group position={[4, 0, -26]}>
        <Road variant="road" position={[0, 0, 0]} />
        <Suspense
          fallback={
            <mesh position={[1, 0.9, 0]}>
              <capsuleGeometry args={[0.2, 0.8, 8, 16]} />
              <meshStandardMaterial color="#10B981" />
            </mesh>
          }
        >
          <Runner position={[1, 0.9, 0]} scale={0.01} />
        </Suspense>
      </group>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -14]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#4ADE80" roughness={1} />
      </mesh>

      {/* Fog */}
      <fog attach="fog" args={["#87CEEB", 20, 60]} />
    </>
  );
}
