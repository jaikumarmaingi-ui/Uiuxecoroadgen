"use client";

import { useMemo } from "react";
import { scatterPoints } from "@/lib/road-sense/scatter";
import type { RoadPoint } from "@/lib/road-sense/terrain-config";
import type { TerrainConfig } from "@/lib/road-sense/types";

const PALETTE = ["#3a3f47", "#454b54", "#2f343b", "#4d5460"];

export function Buildings({ config, path }: { config: TerrainConfig; path: RoadPoint[] }) {
  const count = Math.round(config.buildingDensity * 90);
  const points = useMemo(
    () => scatterPoints(config, path, count, { minRoadDist: 6.5, seedOffset: 500, scaleRange: [1, 3.2] }),
    [config, path, count],
  );

  if (count === 0) return null;

  return (
    <group>
      {points.map((p, i) => {
        const height = 2 + p.scale * 3.2;
        const color = PALETTE[i % PALETTE.length];
        return (
          <mesh key={i} position={[p.x, p.y + height / 2, p.z]} rotation={[0, p.rotation, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6 + p.scale * 0.4, height, 1.6 + p.scale * 0.4]} />
            <meshStandardMaterial color={color} roughness={0.75} />
          </mesh>
        );
      })}
    </group>
  );
}
