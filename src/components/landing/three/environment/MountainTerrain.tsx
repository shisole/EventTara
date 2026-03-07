"use client";

import { useMemo } from "react";
import { type BufferGeometry, Color, Float32BufferAttribute, PlaneGeometry, Vector3 } from "three";

import { simplex2 } from "./simplex-noise";

interface MountainTerrainProps {
  position?: [number, number, number];
}

/** Multi-octave fBM for surface detail */
function fbm(x: number, y: number, octaves: number, ox: number, oy: number): number {
  let value = 0;
  let amp = 1;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * simplex2((x + ox) * freq, (y + oy) * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return value;
}

export const TERRAIN_SIZE = 24;
const SEGMENTS = 128;
export const TERRAIN_PEAK_HEIGHT = 14;
const HALF = TERRAIN_SIZE / 2;

// Mountain shape is primarily Gaussian peaks with noise for surface detail.
// This ensures a clear, recognizable mountain silhouette.

interface Peak {
  x: number;
  z: number;
  height: number;
  sharpness: number; // Higher = narrower peak
}

const PEAKS: Peak[] = [
  { x: 0, z: 0, height: 1, sharpness: 4 }, // dominant central peak
  { x: -4, z: -2, height: 0.6, sharpness: 5 }, // secondary
  { x: 3.5, z: -1.5, height: 0.5, sharpness: 5.5 }, // tertiary
  { x: -1.5, z: 3, height: 0.4, sharpness: 6 }, // shoulder
  { x: 2, z: 3, height: 0.35, sharpness: 6 }, // foothills
];

/** Compute terrain height at world XZ. Gaussian peaks + noise detail. */
function computeHeight(x: number, z: number): number {
  // --- Primary shape: sum of Gaussian peaks ---
  let h = 0;
  for (const peak of PEAKS) {
    const dx = x - peak.x;
    const dz = z - peak.z;
    h += peak.height * Math.exp(-(dx * dx + dz * dz) / (2 * (HALF / peak.sharpness) ** 2));
  }

  // --- Ridge connections between peaks for natural look ---
  // Ridge from main peak toward secondary
  const ridgeT1 = Math.max(0, 1 - Math.abs(x * 0.5 + z * 0.25 + 1) * 0.4);
  h += ridgeT1 * 0.15 * Math.exp(-(x * x + z * z) / 50);

  // --- Surface noise (small relative to shape) ---
  const detail = fbm(x * 0.2, z * 0.2, 4, 5.3, 8.1);
  h += detail * 0.08;

  // Fine texture
  h += fbm(x * 0.5, z * 0.5, 2, 20, 15) * 0.02;

  // --- Radial falloff so edges taper to ground ---
  const nx = x / HALF;
  const nz = z / HALF;
  const dist = Math.hypot(nx, nz);
  const falloff = Math.max(0, 1 - Math.pow(dist, 2) * 0.85);

  h = Math.max(0, h) * falloff;

  return h;
}

// Pre-compute normalization by scanning a grid
let normMin = Infinity;
let normRange = 1;

{
  let maxH = -Infinity;
  const step = TERRAIN_SIZE / 48;
  for (let gx = -HALF; gx <= HALF; gx += step) {
    for (let gz = -HALF; gz <= HALF; gz += step) {
      const h = computeHeight(gx, gz);
      if (h < normMin) normMin = h;
      if (h > maxH) maxH = h;
    }
  }
  normRange = maxH - normMin || 1;
}

/** Sample terrain height at any world XZ position. Returns world Y. */
export function getTerrainHeight(x: number, z: number): number {
  const raw = computeHeight(x, z);
  return ((raw - normMin) / normRange) * TERRAIN_PEAK_HEIGHT;
}

// Mountain colors — natural, muted tones
const SNOW = new Color("#E8ECF0");
const SNOW_SHADOW = new Color("#C5CCD6");
const ROCK_LIGHT = new Color("#9CA3AF");
const ROCK_MID = new Color("#78716C");
const ROCK_DARK = new Color("#57534E");
const ALPINE_GREEN = new Color("#5D7A4A");
const GRASS_MID = new Color("#4A7D42");
const GRASS_BASE = new Color("#5DAA5D");
const DIRT = new Color("#8B7355");

function buildTerrain(): BufferGeometry {
  const geo = new PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);

  // Set vertex heights
  for (let i = 0; i < count; i++) {
    pos.setY(i, getTerrainHeight(pos.getX(i), pos.getZ(i)));
  }

  // Compute slopes via central differences
  const cols = SEGMENTS + 1;
  const slopes = new Float32Array(count);
  const cellSize = TERRAIN_SIZE / SEGMENTS;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const hL = col > 0 ? pos.getY(i - 1) : pos.getY(i);
    const hR = col < cols - 1 ? pos.getY(i + 1) : pos.getY(i);
    const hU = row > 0 ? pos.getY(i - cols) : pos.getY(i);
    const hD = row < SEGMENTS ? pos.getY(i + cols) : pos.getY(i);
    const dx = (hR - hL) / (2 * cellSize);
    const dz = (hD - hU) / (2 * cellSize);
    slopes[i] = new Vector3(-dx, 1, -dz).normalize().y;
  }

  // Vertex coloring
  for (let i = 0; i < count; i++) {
    const y = pos.getY(i);
    const t = y / TERRAIN_PEAK_HEIGHT; // 0 = base, 1 = peak
    const slope = slopes[i];
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Noise jitter to break up banding
    const jitter = simplex2(x * 0.7 + 100, z * 0.7 + 200) * 0.04;
    const tj = t + jitter;
    const micro = simplex2(x * 3 + 50, z * 3 + 70) * 0.5 + 0.5;

    const color = new Color();
    const isCliff = slope < 0.75;

    if (tj > 0.8 && !isCliff) {
      // Snow cap — only on gentle slopes
      color.copy(SNOW).lerp(SNOW_SHADOW, micro * 0.3);
    } else if (tj > 0.6) {
      // Upper rock band
      const blend = (tj - 0.6) / 0.2;
      color.copy(ROCK_MID).lerp(ROCK_LIGHT, blend * micro);
      if (!isCliff && tj < 0.7) {
        color.lerp(ALPINE_GREEN, 0.15);
      }
    } else if (tj > 0.35) {
      // Mid-altitude: rock with some alpine vegetation on gentler slopes
      if (isCliff) {
        color.copy(ROCK_DARK).lerp(ROCK_MID, micro * 0.5);
      } else {
        color.copy(ROCK_DARK).lerp(ALPINE_GREEN, ((0.6 - tj) / 0.25) * 0.5);
      }
    } else if (tj > 0.12) {
      // Lower slopes: grass and dirt
      const grassBlend = (0.35 - tj) / 0.23;
      color.copy(DIRT).lerp(GRASS_MID, grassBlend * 0.8);
      color.lerp(ALPINE_GREEN, micro * 0.15);
    } else {
      // Base: green grass
      color.copy(GRASS_BASE).lerp(GRASS_MID, micro * 0.4);
      if (micro > 0.7) color.lerp(DIRT, 0.2);
    }

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  pos.needsUpdate = true;
  geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  return geo;
}

export default function MountainTerrain({ position = [0, 0, 0] }: MountainTerrainProps) {
  const geometry = useMemo(() => buildTerrain(), []);

  return (
    <group position={position}>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.85} />
      </mesh>
    </group>
  );
}
