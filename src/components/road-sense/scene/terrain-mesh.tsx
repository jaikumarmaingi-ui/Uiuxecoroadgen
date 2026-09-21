"use client";

import { useMemo } from "react";
import { buildTerrainGeometry } from "@/lib/road-sense/build-terrain-geometry";
import type { TerrainConfig } from "@/lib/road-sense/types";

export function TerrainMesh({ config }: { config: TerrainConfig }) {
  const { geometry } = useMemo(() => buildTerrainGeometry(config), [config]);

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.96} metalness={0.02} />
    </mesh>
  );
}
