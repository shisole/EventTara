"use client";

import { useMemo } from "react";

import { seededRandom } from "./seeded-random";

interface VegetationProps {
  position?: [number, number, number];
  density?: number;
}

interface PineTreeConfig {
  pos: [number, number, number];
  layers: number;
  trunkHeight: number;
  trunkRadius: number;
  baseRadius: number;
  colors: string[];
  rotationY: number;
}

interface BushConfig {
  pos: [number, number, number];
  clusters: { offset: [number, number, number]; scale: number }[];
  color: string;
}

const PINE_PALETTES = [
  ["#2D5A27", "#1E4620", "#3A6B34"],
  ["#3B6B35", "#2A5429", "#4A7D42"],
  ["#2B4F27", "#1D3D1A", "#3C6233"],
  ["#3D6B3A", "#2C5628", "#4E7F45"],
];

function generatePineTree(index: number): PineTreeConfig {
  const r = (offset: number) => seededRandom(index * 13 + offset);

  // Trees are 3-6 world units tall — much larger than characters (~0.4 units)
  const treeScale = 1.2 + r(1) * 1.8; // 1.2 - 3.0
  const layers = 4 + Math.floor(r(2) * 3); // 4-6 layers
  const trunkHeight = 0.8 * treeScale;
  const trunkRadius = 0.06 * treeScale;
  const baseRadius = 0.6 * treeScale;

  const spreadX = (r(6) - 0.5) * 20;
  const spreadZ = (r(7) - 0.5) * 16;

  const paletteIdx = Math.floor(r(8) * PINE_PALETTES.length);

  return {
    pos: [spreadX, 0, spreadZ],
    layers,
    trunkHeight,
    trunkRadius,
    baseRadius,
    colors: PINE_PALETTES[paletteIdx],
    rotationY: r(9) * Math.PI * 2,
  };
}

function generateBush(index: number): BushConfig {
  const r = (offset: number) => seededRandom(index * 11 + offset + 500);

  const spreadX = (r(1) - 0.5) * 22;
  const spreadZ = (r(2) - 0.5) * 18;

  const clusterCount = 2 + Math.floor(r(3) * 3);
  const clusters: { offset: [number, number, number]; scale: number }[] = [];
  for (let c = 0; c < clusterCount; c++) {
    const cr = (o: number) => seededRandom(index * 11 + c * 7 + o + 600);
    clusters.push({
      offset: [(cr(1) - 0.5) * 0.5, cr(2) * 0.15, (cr(3) - 0.5) * 0.5],
      scale: 0.2 + cr(4) * 0.25,
    });
  }

  const bushColors = ["#2D5A27", "#3B6B35", "#4A7D42", "#3D6B3A"];
  const colorIdx = Math.floor(r(5) * bushColors.length);

  return {
    pos: [spreadX, 0, spreadZ],
    clusters,
    color: bushColors[colorIdx],
  };
}

function PineTree({ config }: { config: PineTreeConfig }) {
  const { trunkHeight, trunkRadius, baseRadius, layers, colors, rotationY } = config;

  const layerElements = [];
  for (let l = 0; l < layers; l++) {
    const t = l / (layers - 1);
    const layerRadius = baseRadius * (1 - t * 0.6);
    const layerHeight = baseRadius * (0.8 - t * 0.25);
    const yPos = trunkHeight + l * (baseRadius * 0.4);
    const colorIdx = l % colors.length;

    layerElements.push(
      <mesh key={l} position={[0, yPos, 0]}>
        <coneGeometry args={[layerRadius, layerHeight, 7]} />
        <meshStandardMaterial color={colors[colorIdx]} roughness={0.9} flatShading />
      </mesh>,
    );
  }

  return (
    <group position={config.pos} rotation={[0, rotationY, 0]}>
      <mesh position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[trunkRadius * 0.7, trunkRadius * 1.4, trunkHeight, 5]} />
        <meshStandardMaterial color="#5C3A1E" roughness={0.95} />
      </mesh>
      {layerElements}
    </group>
  );
}

function Bush({ config }: { config: BushConfig }) {
  return (
    <group position={config.pos}>
      {config.clusters.map((cluster, i) => (
        <mesh key={i} position={cluster.offset} scale={cluster.scale}>
          <dodecahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={config.color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export default function Vegetation({ position = [0, 0, 0], density = 12 }: VegetationProps) {
  const trees = useMemo(
    () => Array.from({ length: density }, (_, i) => generatePineTree(i)),
    [density],
  );

  const bushes = useMemo(() => {
    const bushCount = Math.floor(density * 0.5);
    return Array.from({ length: bushCount }, (_, i) => generateBush(i));
  }, [density]);

  return (
    <group position={position}>
      {trees.map((config, i) => (
        <PineTree key={`tree-${i}`} config={config} />
      ))}
      {bushes.map((config, i) => (
        <Bush key={`bush-${i}`} config={config} />
      ))}
    </group>
  );
}
