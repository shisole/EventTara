"use client";

import { useMemo } from "react";

interface RoadProps {
  position?: [number, number, number];
  variant: "trail" | "road";
}

interface TrailRockConfig {
  pos: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number];
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function Trail({ position }: { position: [number, number, number] }) {
  const sideRocks: TrailRockConfig[] = useMemo(() => {
    const rocks: TrailRockConfig[] = [];
    for (let i = 0; i < 20; i++) {
      const r1 = seededRandom(i * 5 + 200);
      const r2 = seededRandom(i * 5 + 201);
      const r3 = seededRandom(i * 5 + 202);
      const side = i % 2 === 0 ? 1 : -1;
      const xOffset = 5 + r1 * 2;

      rocks.push({
        pos: [side * xOffset, 0.08 + r2 * 0.1, (r3 - 0.5) * 18],
        scale: [0.2 + r1 * 0.3, 0.1 + r2 * 0.15, 0.2 + r3 * 0.25],
        rotation: [r1 * 0.5, r2 * Math.PI, r3 * 0.3],
      });
    }
    return rocks;
  }, []);

  return (
    <group position={position}>
      {/* Main dirt trail - wider with variation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[14, 22]} />
        <meshStandardMaterial color="#8B7355" roughness={1} />
      </mesh>

      {/* Lighter center path worn by foot traffic */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[4, 20]} />
        <meshStandardMaterial color="#A0896C" roughness={1} />
      </mesh>

      {/* Darker edges of the trail */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.5, 0.012, 0]}>
        <planeGeometry args={[3, 22]} />
        <meshStandardMaterial color="#7A6548" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.5, 0.012, 0]}>
        <planeGeometry args={[3, 22]} />
        <meshStandardMaterial color="#7A6548" roughness={1} />
      </mesh>

      {/* Small rocks on the sides of the trail */}
      {sideRocks.map((rock, i) => (
        <mesh
          key={`trail-rock-${i}`}
          position={rock.pos}
          scale={rock.scale}
          rotation={rock.rotation}
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#9CA3AF" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function AsphaltRoad({ position }: { position: [number, number, number] }) {
  const dashPositions: number[] = useMemo(() => {
    const dashes: number[] = [];
    const dashLength = 1.2;
    const gapLength = 0.8;
    const totalLength = 18;
    let z = -totalLength / 2;
    while (z < totalLength / 2) {
      dashes.push(z + dashLength / 2);
      z += dashLength + gapLength;
    }
    return dashes;
  }, []);

  return (
    <group position={position}>
      {/* Main asphalt surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[10, 22]} />
        <meshStandardMaterial color="#374151" roughness={0.85} />
      </mesh>

      {/* Slightly lighter road surface variation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[8, 20]} />
        <meshStandardMaterial color="#4B5563" roughness={0.8} />
      </mesh>

      {/* Dashed yellow center line */}
      {dashPositions.map((z, i) => (
        <mesh key={`dash-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, z]}>
          <planeGeometry args={[0.15, 1.2]} />
          <meshStandardMaterial color="#FCD34D" />
        </mesh>
      ))}

      {/* White edge lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.8, 0.02, 0]}>
        <planeGeometry args={[0.12, 20]} />
        <meshStandardMaterial color="#E5E7EB" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.8, 0.02, 0]}>
        <planeGeometry args={[0.12, 20]} />
        <meshStandardMaterial color="#E5E7EB" />
      </mesh>

      {/* Road shoulder / gravel edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.5, 0.008, 0]}>
        <planeGeometry args={[1.2, 22]} />
        <meshStandardMaterial color="#6B7280" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.5, 0.008, 0]}>
        <planeGeometry args={[1.2, 22]} />
        <meshStandardMaterial color="#6B7280" roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function Road({ position = [0, 0, 0], variant }: RoadProps) {
  if (variant === "trail") {
    return <Trail position={position} />;
  }
  return <AsphaltRoad position={position} />;
}
