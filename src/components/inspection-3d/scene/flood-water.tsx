"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BENCH_HALF,
  ROAD_END_Z,
  ROAD_START_Z,
  ROAD_WIDTH_M,
  roadSurfaceY,
} from "@/lib/inspection-3d/terrain";

/**
 * Standing water along the corridor.
 *
 * Water does not lie evenly over a cambered road — it runs off the crown and
 * collects at the edges, in the channel between the carriageway and the
 * shoulder, which is exactly where the edge-break and washout mechanisms do
 * their damage. So this is drawn as two strips down the verges rather than one
 * sheet over everything, and its level is tied to the road's own surface
 * height so it sits in the camber rather than floating across it.
 *
 * At full depth a thin sheet also covers the carriageway itself, which is what
 * makes the condition read as flooding rather than as rain that has stopped.
 */
export function FloodWater({ depth }: { depth: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const geom = useMemo(() => {
    const length = ROAD_START_Z - ROAD_END_Z;
    return { length, midZ: (ROAD_START_Z + ROAD_END_Z) / 2 };
  }, []);

  // A slow drift on the normal map stand-in: still water still moves.
  useFrame((_, rawDelta) => {
    const m = matRef.current;
    if (!m) return;
    const delta = Math.min(rawDelta, 0.1);
    m.opacity = 0.62 + Math.sin(performance.now() * 0.0007) * 0.05;
    void delta;
  });

  if (depth <= 0.01) return null;

  const half = ROAD_WIDTH_M / 2;
  const vergeWidth = BENCH_HALF - half;
  const vergeCentre = half + vergeWidth / 2;
  // The verge channel is the low point of the section, so it floods first and
  // deepest; the crown only goes under once the whole section is submerged.
  const vergeY = roadSurfaceY(half) + 0.02 + depth * 0.1;
  const crownY = roadSurfaceY(0) + 0.015 + depth * 0.05;

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * vergeCentre, vergeY, geom.midZ]}
        >
          <planeGeometry args={[vergeWidth, geom.length]} />
          <meshStandardMaterial
            ref={side === -1 ? matRef : undefined}
            color="#2e3c42"
            transparent
            opacity={0.66}
            roughness={0.06}
            metalness={0.12}
            envMapIntensity={2.4}
            depthWrite={false}
          />
        </mesh>
      ))}

      {depth > 0.6 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, crownY, geom.midZ]}>
          <planeGeometry args={[ROAD_WIDTH_M, geom.length]} />
          <meshStandardMaterial
            color="#33424a"
            transparent
            opacity={0.34 * depth}
            roughness={0.08}
            metalness={0.1}
            envMapIntensity={2}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
