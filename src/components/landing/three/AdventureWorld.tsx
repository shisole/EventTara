"use client";

import { Environment } from "@react-three/drei";
import { Component, type ErrorInfo, type ReactNode, Suspense } from "react";

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

/** Error boundary that silently falls back to children's Suspense fallback (placeholder geometry). */
class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Expected when GLB files are missing — silently show placeholder
    console.warn("[AdventureWorld] Model load failed, using placeholder:", error.message, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function AdventureWorld({
  scrollContainerRef,
  onProgressChange,
}: AdventureWorldProps) {
  return (
    <>
      {/* Global lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[10, 20, 10]} intensity={1.1} castShadow />
      <Environment preset="forest" />
      <CameraRig scrollContainerRef={scrollContainerRef} onProgressChange={onProgressChange} />

      {/* Scene 1: Mountain & Climber */}
      <group position={[0, 0, 0]}>
        {/* Warm uplight for dramatic mountain lighting */}
        <pointLight position={[0, -2, 4]} intensity={0.6} color="#FFA54F" distance={20} />
        <MountainTerrain position={[0, 0, 0]} />
        <ModelErrorBoundary
          fallback={
            <mesh position={[1.5, 7, 2]}>
              <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
              <meshStandardMaterial color="#EF4444" />
            </mesh>
          }
        >
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
        </ModelErrorBoundary>
      </group>

      {/* Vegetation between Scene 1 and Scene 2 */}
      <Vegetation position={[6, 0, -4]} density={10} />
      <Vegetation position={[-8, 0, -6]} density={8} />
      <Vegetation position={[-3, 0, -3]} density={5} />

      {/* Scene 2: Trail & Mountain Biker */}
      <group position={[-6, 0, -8]}>
        {/* Dappled light for trail scene — scattered point lights mimicking canopy gaps */}
        <pointLight position={[-2, 4, -1]} intensity={0.5} color="#F5E6CC" distance={12} />
        <pointLight position={[3, 3.5, 2]} intensity={0.35} color="#F5E6CC" distance={10} />
        <pointLight position={[0, 5, -3]} intensity={0.4} color="#FFFBE6" distance={14} />
        <Road variant="trail" position={[0, 0, 0]} />
        <ModelErrorBoundary
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
        </ModelErrorBoundary>
      </group>

      {/* Dense vegetation flanking the trail */}
      <Vegetation position={[-12, 0, -6]} density={10} />
      <Vegetation position={[0, 0, -10]} density={8} />

      {/* Vegetation between Scene 2 and Scene 3 */}
      <Vegetation position={[2, 0, -18]} density={14} />
      <Vegetation position={[-4, 0, -22]} density={6} />

      {/* Scene 3: Road & Runner */}
      <group position={[4, 0, -26]}>
        <Road variant="road" position={[0, 0, 0]} />
        <ModelErrorBoundary
          fallback={
            <mesh position={[1, 0.9, 0]}>
              <capsuleGeometry args={[0.2, 0.8, 8, 16]} />
              <meshStandardMaterial color="#10B981" />
            </mesh>
          }
        >
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
        </ModelErrorBoundary>
      </group>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -14]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#4ADE80" roughness={1} />
      </mesh>

      {/* Fog — closer near, farther far for better depth layering */}
      <fog attach="fog" args={["#87CEEB", 15, 55]} />
    </>
  );
}
