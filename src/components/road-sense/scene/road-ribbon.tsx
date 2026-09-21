"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { buildRoadGeometry } from "@/lib/road-sense/build-road-geometry";
import { getAsphaltTexture } from "@/lib/road-sense/asphalt-texture";
import type { RoadPoint } from "@/lib/road-sense/terrain-config";
import type { RoadDefect } from "@/lib/road-sense/types";

export function RoadRibbon({
  path,
  width,
  defects,
  aiOverlay,
  xray = false,
  onClick,
}: {
  path: RoadPoint[];
  width: number;
  defects: RoadDefect[];
  aiOverlay: boolean;
  xray?: boolean;
  onClick?: () => void;
}) {
  const geometry = useMemo(() => buildRoadGeometry(path, width, defects), [path, width, defects]);
  const texture = useMemo(() => (typeof window !== "undefined" ? getAsphaltTexture() : null), []);

  return (
    <>
      <mesh geometry={geometry} receiveShadow onClick={onClick}>
        {xray ? (
          <meshStandardMaterial color="#a9c4d6" transparent opacity={0.32} roughness={0.4} depthWrite={false} side={THREE.DoubleSide} />
        ) : aiOverlay ? (
          <meshStandardMaterial vertexColors roughness={0.55} metalness={0.05} />
        ) : (
          <meshStandardMaterial map={texture ?? undefined} color={texture ? undefined : "#2a2c30"} roughness={0.88} side={THREE.DoubleSide} />
        )}
      </mesh>
      {xray && (
        <mesh geometry={geometry} position={[0, -0.55, 0]} receiveShadow={false}>
          <meshStandardMaterial color="#2fb8d8" transparent opacity={0.42} roughness={0.25} depthWrite={false} />
        </mesh>
      )}
    </>
  );
}
