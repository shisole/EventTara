"use client";

import { useMemo } from "react";

interface VegetationProps {
  position?: [number, number, number];
  density?: number;
}

interface TreeConfig {
  pos: [number, number, number];
  trunkHeight: number;
  trunkRadius: number;
  canopyRadius: number;
  canopyHeight: number;
  canopyType: "cone" | "sphere";
  canopyColor: string;
}

interface BushConfig {
  pos: [number, number, number];
  scale: number;
  color: string;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export default function Vegetation({ position = [0, 0, 0], density = 12 }: VegetationProps) {
  const trees: TreeConfig[] = useMemo(() => {
    const result: TreeConfig[] = [];
    for (let i = 0; i < density; i++) {
      const r1 = seededRandom(i * 3 + 1);
      const r2 = seededRandom(i * 3 + 2);
      const r3 = seededRandom(i * 3 + 3);
      const r4 = seededRandom(i * 3 + 4);
      const r5 = seededRandom(i * 3 + 5);

      const spreadX = (r1 - 0.5) * 20;
      const spreadZ = (r2 - 0.5) * 16;
      const trunkHeight = 0.6 + r3 * 0.8;
      const canopyScale = 0.5 + r4 * 0.6;

      const canopyColors = ["#22C55E", "#16A34A", "#15803D", "#166534"];
      const colorIndex = Math.floor(r5 * canopyColors.length);

      result.push({
        pos: [spreadX, trunkHeight / 2, spreadZ],
        trunkHeight,
        trunkRadius: 0.06 + r3 * 0.04,
        canopyRadius: canopyScale,
        canopyHeight: canopyScale * 1.8,
        canopyType: r5 > 0.4 ? "cone" : "sphere",
        canopyColor: canopyColors[colorIndex],
      });
    }
    return result;
  }, [density]);

  const bushes: BushConfig[] = useMemo(() => {
    const result: BushConfig[] = [];
    const bushCount = Math.floor(density * 0.6);
    for (let i = 0; i < bushCount; i++) {
      const r1 = seededRandom(i * 7 + 100);
      const r2 = seededRandom(i * 7 + 101);
      const r3 = seededRandom(i * 7 + 102);

      const bushColors = ["#22C55E", "#16A34A", "#15803D", "#4ADE80"];
      const colorIndex = Math.floor(r3 * bushColors.length);

      result.push({
        pos: [(r1 - 0.5) * 22, 0.12 + r3 * 0.08, (r2 - 0.5) * 18],
        scale: 0.15 + r3 * 0.2,
        color: bushColors[colorIndex],
      });
    }
    return result;
  }, [density]);

  return (
    <group position={position}>
      {/* Trees */}
      {trees.map((tree, i) => (
        <group key={`tree-${i}`} position={tree.pos}>
          {/* Trunk */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry
              args={[tree.trunkRadius, tree.trunkRadius * 1.3, tree.trunkHeight, 6]}
            />
            <meshStandardMaterial color="#92400E" roughness={0.95} />
          </mesh>
          {/* Canopy */}
          <mesh position={[0, tree.trunkHeight / 2 + tree.canopyHeight / 2 - 0.1, 0]}>
            {tree.canopyType === "cone" ? (
              <coneGeometry args={[tree.canopyRadius, tree.canopyHeight, 6]} />
            ) : (
              <sphereGeometry args={[tree.canopyRadius, 6, 6]} />
            )}
            <meshStandardMaterial color={tree.canopyColor} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}

      {/* Bushes */}
      {bushes.map((bush, i) => (
        <mesh key={`bush-${i}`} position={bush.pos} scale={bush.scale}>
          <sphereGeometry args={[1, 6, 5]} />
          <meshStandardMaterial color={bush.color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}
