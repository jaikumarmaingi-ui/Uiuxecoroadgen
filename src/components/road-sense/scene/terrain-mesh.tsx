"use client";

import { useMemo } from "react";
import { buildTerrainGeometry } from "@/lib/road-sense/build-terrain-geometry";
import type { RoadPoint } from "@/lib/road-sense/terrain-config";
import type { TerrainConfig } from "@/lib/road-sense/types";

export function TerrainMesh({ config, path }: { config: TerrainConfig; path?: RoadPoint[] }) {
  const { geometry } = useMemo(() => buildTerrainGeometry(config, { path }), [config, path]);

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0.02} />
    </mesh>
  );
}
