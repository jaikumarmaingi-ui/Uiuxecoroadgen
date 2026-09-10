import { heightAt, TERRAIN_SIZE } from "./terrain-config";
import type { RoadPoint } from "./terrain-config";
import type { TerrainConfig } from "./types";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export interface ScatterPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
}

function distToRoad(x: number, z: number, path: RoadPoint[]) {
  let min = Infinity;
  for (let i = 0; i < path.length; i += 4) {
    const d = Math.hypot(path[i].x - x, path[i].z - z);
    if (d < min) min = d;
  }
  return min;
}

export function scatterPoints(
  config: TerrainConfig,
  path: RoadPoint[],
  count: number,
  opts: { minRoadDist?: number; heightRange?: [number, number]; seedOffset?: number; scaleRange?: [number, number] } = {},
): ScatterPoint[] {
  const rand = seededRandom(config.seed + (opts.seedOffset ?? 0) + 11);
  const half = TERRAIN_SIZE / 2 - 6;
  const minRoadDist = opts.minRoadDist ?? 4.5;
  const [scaleMin, scaleMax] = opts.scaleRange ?? [0.7, 1.3];
  const points: ScatterPoint[] = [];
  let attempts = 0;

  while (points.length < count && attempts < count * 12) {
    attempts++;
    const x = (rand() - 0.5) * 2 * half;
    const z = (rand() - 0.5) * 2 * half;
    if (distToRoad(x, z, path) < minRoadDist) continue;
    const y = heightAt(config, x, z);
    if (opts.heightRange) {
      const range = opts.heightRange;
      if (y < range[0] || y > range[1]) continue;
    }
    if (config.hasWater && y < config.waterLevel + 0.3) continue;
    points.push({ x, y, z, scale: scaleMin + rand() * (scaleMax - scaleMin), rotation: rand() * Math.PI * 2 });
  }
  return points;
}
