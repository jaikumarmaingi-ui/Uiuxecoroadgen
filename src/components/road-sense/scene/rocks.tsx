"use client";

import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { scatterPoints } from "@/lib/road-sense/scatter";
import type { RoadPoint } from "@/lib/road-sense/terrain-config";
import type { TerrainConfig } from "@/lib/road-sense/types";

export function Rocks({ config, path }: { config: TerrainConfig; path: RoadPoint[] }) {
  const count = Math.round(config.rockDensity * 220);
  const points = useMemo(
    () => scatterPoints(config, path, count, { minRoadDist: 3.5, seedOffset: 300, scaleRange: [0.4, 1.6] }),
    [config, path, count],
  );

  if (count === 0) return null;

  return (
    <Instances limit={points.length} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color={config.hasSand ? "#8a7150" : "#5a564f"} roughness={1} flatShading />
      {points.map((p, i) => (
        <Instance key={i} position={[p.x, p.y + p.scale * 0.2, p.z]} scale={p.scale} rotation={[p.rotation * 0.4, p.rotation, p.rotation * 0.6]} />
      ))}
    </Instances>
  );
}
