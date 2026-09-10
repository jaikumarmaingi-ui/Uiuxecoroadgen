"use client";

import { TERRAIN_SIZE } from "@/lib/road-sense/terrain-config";
import type { TerrainConfig } from "@/lib/road-sense/types";

export function WaterPlane({ config }: { config: TerrainConfig }) {
  if (!config.hasWater) return null;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, config.waterLevel, 0]}>
      <planeGeometry args={[TERRAIN_SIZE, TERRAIN_SIZE, 1, 1]} />
      <meshStandardMaterial color="#173a4d" transparent opacity={0.78} roughness={0.12} metalness={0.35} />
    </mesh>
  );
}
