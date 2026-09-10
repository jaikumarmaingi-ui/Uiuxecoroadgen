"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Billboard, Circle, Ring } from "@react-three/drei";
import { pointOnRoad } from "@/lib/road-sense/build-road-geometry";
import { SEVERITY_COLOR } from "@/lib/road-sense/defects-data";
import type { RoadPoint } from "@/lib/road-sense/terrain-config";
import type { RoadDefect } from "@/lib/road-sense/types";

function DefectMarker({
  defect,
  path,
  roadWidth,
  selected,
  onSelect,
}: {
  defect: RoadDefect;
  path: RoadPoint[];
  roadWidth: number;
  selected: boolean;
  onSelect: (d: RoadDefect) => void;
}) {
  const pos = useMemo(() => {
    const p = pointOnRoad(path, defect.t);
    const tangent = new THREE.Vector3(p.dx, 0, p.dz).normalize();
    const perp = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
    const lateral = defect.offset * (roadWidth / 2) * 0.85;
    return new THREE.Vector3(p.x + perp.x * lateral, p.y + 0.55, p.z + perp.z * lateral);
  }, [path, defect, roadWidth]);

  const color = SEVERITY_COLOR[defect.severity];
  const scale = selected ? 1.5 : defect.severity === "critical" ? 1.25 : defect.severity === "high" ? 1.05 : 0.85;

  return (
    <group position={pos}>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.01, 0.05, 1, 5]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <Billboard>
        <Circle
          args={[0.22 * scale, 20]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(defect);
          }}
        >
          <meshBasicMaterial color={color} toneMapped={false} />
        </Circle>
        <Ring args={[0.24 * scale, 0.3 * scale, 24]}>
          <meshBasicMaterial color={color} transparent opacity={selected ? 1 : 0.55} toneMapped={false} />
        </Ring>
        {selected && (
          <Ring args={[0.36 * scale, 0.4 * scale, 24]}>
            <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
          </Ring>
        )}
      </Billboard>
    </group>
  );
}

export function DefectMarkers({
  defects,
  path,
  roadWidth,
  selectedId,
  onSelect,
}: {
  defects: RoadDefect[];
  path: RoadPoint[];
  roadWidth: number;
  selectedId: string | null;
  onSelect: (d: RoadDefect) => void;
}) {
  return (
    <group>
      {defects.map((d) => (
        <DefectMarker key={d.id} defect={d} path={path} roadWidth={roadWidth} selected={d.id === selectedId} onSelect={onSelect} />
      ))}
    </group>
  );
}
