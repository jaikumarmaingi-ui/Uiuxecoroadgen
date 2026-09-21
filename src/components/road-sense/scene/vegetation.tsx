"use client";

import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { scatterPoints } from "@/lib/road-sense/scatter";
import type { RoadPoint } from "@/lib/road-sense/terrain-config";
import type { TerrainConfig } from "@/lib/road-sense/types";

export function Vegetation({ config, path }: { config: TerrainConfig; path: RoadPoint[] }) {
  const count = Math.round(config.treeDensity * 340);
  const points = useMemo(
    () => scatterPoints(config, path, count, { minRoadDist: 5.5, seedOffset: 100, scaleRange: [0.6, 1.4] }),
    [config, path, count],
  );

  if (config.treeType === "none" || count === 0) return null;

  const foliageColor = config.treeType === "conifer" ? "#1e4a2a" : config.treeType === "palm" ? "#2f6b34" : "#2c5c2a";
  const trunkColor = "#4a3826";

  return (
    <group>
      <Instances limit={points.length} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 1, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
        {points.map((p, i) => (
          <Instance
            key={i}
            position={[p.x, p.y + (0.5 * p.scale) / 2, p.z]}
            scale={[1, p.scale * (config.treeType === "palm" ? 2.4 : 1.6), 1]}
          />
        ))}
      </Instances>

      <Instances limit={points.length} castShadow>
        {config.treeType === "conifer" ? <coneGeometry args={[0.55, 1.6, 6]} /> : <sphereGeometry args={[0.55, 7, 6]} />}
        <meshStandardMaterial color={foliageColor} roughness={0.85} />
        {points.map((p, i) => {
          const trunkH = p.scale * (config.treeType === "palm" ? 2.4 : 1.6);
          return (
            <Instance
              key={i}
              position={[p.x, p.y + trunkH + p.scale * 0.35, p.z]}
              scale={p.scale}
              rotation={[0, p.rotation, 0]}
            />
          );
        })}
      </Instances>
    </group>
  );
}
