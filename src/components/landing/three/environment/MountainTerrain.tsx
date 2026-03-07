"use client";

import { useMemo } from "react";

interface MountainTerrainProps {
  position?: [number, number, number];
}

interface PeakConfig {
  pos: [number, number, number];
  radius: number;
  height: number;
  segments: number;
  color: string;
  snowCap: boolean;
}

interface OutcroppingConfig {
  pos: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
  color: string;
}

export default function MountainTerrain({ position = [0, 0, 0] }: MountainTerrainProps) {
  const peaks: PeakConfig[] = useMemo(
    () => [
      {
        pos: [0, 6, 0],
        radius: 6,
        height: 14,
        segments: 7,
        color: "#6B7280",
        snowCap: true,
      },
      {
        pos: [-5, 3.5, -3],
        radius: 4,
        height: 9,
        segments: 6,
        color: "#78716C",
        snowCap: false,
      },
      {
        pos: [4.5, 3, -2],
        radius: 3.5,
        height: 8,
        segments: 6,
        color: "#A8A29E",
        snowCap: false,
      },
      {
        pos: [-2.5, 2, 4],
        radius: 3,
        height: 6,
        segments: 5,
        color: "#78716C",
        snowCap: false,
      },
      {
        pos: [3, 2.5, 3],
        radius: 2.5,
        height: 7,
        segments: 5,
        color: "#6B7280",
        snowCap: false,
      },
    ],
    [],
  );

  const outcroppings: OutcroppingConfig[] = useMemo(
    () => [
      {
        pos: [2.5, 3, 3.5],
        scale: [1.2, 0.8, 1],
        rotation: [0.3, 0.5, 0.2],
        color: "#78716C",
      },
      {
        pos: [-3, 2.5, 3],
        scale: [0.9, 0.6, 0.8],
        rotation: [-0.2, 0.8, 0.1],
        color: "#6B7280",
      },
      {
        pos: [4, 1.5, 1],
        scale: [0.7, 0.5, 0.9],
        rotation: [0.1, -0.4, 0.3],
        color: "#A8A29E",
      },
      {
        pos: [-4.5, 1, 2],
        scale: [1, 0.7, 0.6],
        rotation: [0.4, 0.2, -0.1],
        color: "#78716C",
      },
      {
        pos: [1, 4.5, 2],
        scale: [0.6, 0.4, 0.5],
        rotation: [-0.3, 0.6, 0.2],
        color: "#6B7280",
      },
      {
        pos: [-1.5, 5, 1.5],
        scale: [0.5, 0.35, 0.4],
        rotation: [0.2, -0.3, 0.4],
        color: "#A8A29E",
      },
    ],
    [],
  );

  return (
    <group position={position}>
      {/* Mountain peaks */}
      {peaks.map((peak, i) => (
        <group key={`peak-${i}`} position={peak.pos}>
          <mesh>
            <coneGeometry args={[peak.radius, peak.height, peak.segments]} />
            <meshStandardMaterial color={peak.color} roughness={0.95} flatShading />
          </mesh>
          {/* Snow cap on the tallest peak */}
          {peak.snowCap && (
            <mesh position={[0, peak.height * 0.35, 0]}>
              <coneGeometry args={[peak.radius * 0.35, peak.height * 0.25, peak.segments]} />
              <meshStandardMaterial color="#F0F0F0" roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}

      {/* Rocky outcroppings */}
      {outcroppings.map((rock, i) => (
        <mesh key={`rock-${i}`} position={rock.pos} scale={rock.scale} rotation={rock.rotation}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={rock.color} roughness={0.95} flatShading />
        </mesh>
      ))}

      {/* Base boulders around the mountain foot */}
      <mesh position={[5.5, 0.4, 4]} scale={[1.5, 0.8, 1.2]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#78716C" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-5, 0.3, 5]} scale={[1, 0.6, 1.3]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#A8A29E" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.2, 6]} scale={[0.8, 0.5, 0.7]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#6B7280" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}
