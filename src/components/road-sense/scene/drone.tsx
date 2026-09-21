"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pointOnRoad } from "@/lib/road-sense/build-road-geometry";
import type { RoadPoint } from "@/lib/road-sense/terrain-config";

const ARM_OFFSETS: [number, number][] = [
  [0.55, 0.55],
  [-0.55, 0.55],
  [0.55, -0.55],
  [-0.55, -0.55],
];

export function Drone({ path, active, progressRef }: { path: RoadPoint[]; active: boolean; progressRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const propRefs = useRef<THREE.Mesh[]>([]);
  const hoverAlt = 5.2;

  useFrame((_, delta) => {
    if (!group.current) return;
    if (active) {
      progressRef.current = (progressRef.current + delta * 0.02) % 1;
    }
    const p = pointOnRoad(path, progressRef.current);
    const heading = Math.atan2(p.dx, p.dz);
    group.current.position.set(p.x, p.y + hoverAlt, p.z);
    group.current.rotation.y = heading;
    group.current.position.y += Math.sin(Date.now() * 0.002) * 0.08;

    for (const m of propRefs.current) {
      if (m) m.rotation.y += delta * (active ? 28 : 6);
    }
  });

  return (
    <group ref={group}>
      {/* body */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.16, 0.5]} />
        <meshStandardMaterial color="#e7eef3" roughness={0.35} metalness={0.5} />
      </mesh>
      <mesh position={[0, -0.1, 0.2]}>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#111" roughness={0.2} />
      </mesh>

      {ARM_OFFSETS.map(([x, z], i) => (
        <group key={i} position={[x, 0.02, z]}>
          <mesh rotation={[0, Math.atan2(z, x), Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh
            ref={(el) => {
              if (el) propRefs.current[i] = el;
            }}
            position={[0, 0.03, 0]}
          >
            <boxGeometry args={[0.32, 0.01, 0.03]} />
            <meshStandardMaterial color="#0ea5b8" transparent opacity={0.65} />
          </mesh>
        </group>
      ))}

      {active && (
        <mesh position={[0, -2.6, 0]}>
          <coneGeometry args={[2.1, 5.2, 24, 1, true]} />
          <meshBasicMaterial color="#35e0d0" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {active && <pointLight color="#35e0d0" intensity={2.5} distance={4} />}
    </group>
  );
}
