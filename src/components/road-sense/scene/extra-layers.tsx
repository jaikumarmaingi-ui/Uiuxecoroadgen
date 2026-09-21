"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Billboard, Circle } from "@react-three/drei";
import { buildTerrainGeometry } from "@/lib/road-sense/build-terrain-geometry";
import { pointOnRoad } from "@/lib/road-sense/build-road-geometry";
import { SEVERITY_COLOR } from "@/lib/road-sense/defects-data";
import type { RoadPoint } from "@/lib/road-sense/terrain-config";
import type { RoadDefect, TerrainConfig } from "@/lib/road-sense/types";

export function ElevationWireframe({ config }: { config: TerrainConfig }) {
  const { geometry } = useMemo(() => buildTerrainGeometry(config, 44), [config]);
  return (
    <mesh geometry={geometry} position={[0, 0.05, 0]}>
      <meshBasicMaterial color="#35e0d0" wireframe transparent opacity={0.18} />
    </mesh>
  );
}

export function RiskZoneHalos({ defects, path }: { defects: RoadDefect[]; path: RoadPoint[] }) {
  const notable = defects.filter((d) => d.severity === "high" || d.severity === "critical");
  return (
    <group>
      {notable.map((d) => {
        const p = pointOnRoad(path, d.t);
        const r = d.severity === "critical" ? 3.4 : 2.4;
        return (
          <mesh key={d.id} position={[p.x, p.y + 0.06, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r * 0.55, r, 32]} />
            <meshBasicMaterial color={SEVERITY_COLOR[d.severity]} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

export function CoverageStrip({ path, roadWidth }: { path: RoadPoint[]; roadWidth: number }) {
  const points = useMemo(() => path.filter((_, i) => i % 3 === 0), [path]);
  const positions = useMemo(() => {
    const arr = new Float32Array(points.length * 2 * 3);
    const width = roadWidth * 3.2;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const tangent = new THREE.Vector3(next.x - prev.x, 0, next.z - prev.z).normalize();
      const perp = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
      const li = i * 2;
      arr[li * 3] = p.x - perp.x * width;
      arr[li * 3 + 1] = p.y + 0.08;
      arr[li * 3 + 2] = p.z - perp.z * width;
      arr[(li + 1) * 3] = p.x + perp.x * width;
      arr[(li + 1) * 3 + 1] = p.y + 0.08;
      arr[(li + 1) * 3 + 2] = p.z + perp.z * width;
    }
    return arr;
  }, [points, roadWidth]);

  const indices = useMemo(() => {
    const idx: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      idx.push(a, c, b, b, c, d);
    }
    return idx;
  }, [points]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setIndex(indices);
    return g;
  }, [positions, indices]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#35e0d0" transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

export function TrafficDots({ path, count = 5 }: { path: RoadPoint[]; count?: number }) {
  const group = useRef<THREE.Group>(null);
  const offsets = useMemo(() => Array.from({ length: count }, (_, i) => i / count), [count]);
  const speeds = useMemo(() => Array.from({ length: count }, (_, i) => 0.006 + ((i * 37) % 10) / 1000), [count]);
  const progressRef = useRef(offsets.slice());

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      progressRef.current[i] = (progressRef.current[i] + delta * speeds[i]) % 1;
      const p = pointOnRoad(path, progressRef.current[i]);
      child.position.set(p.x, p.y + 0.25, p.z);
    });
  });

  return (
    <group ref={group}>
      {offsets.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ffb347" emissive="#ffb347" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function DrainageFlow({ config, path }: { config: TerrainConfig; path: RoadPoint[] }) {
  const arrows = useMemo(() => {
    const pts: { x: number; z: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const idx = Math.floor((i / 10) * path.length);
      pts.push({ x: path[idx].x + (i % 2 === 0 ? 8 : -8), z: path[idx].z });
    }
    return pts;
  }, [path]);

  if (!config.hasWater) return null;

  return (
    <group>
      {arrows.map((a, i) => (
        <Billboard key={i} position={[a.x, config.waterLevel + 0.1, a.z]}>
          <Circle args={[0.16, 3]}>
            <meshBasicMaterial color="#4fb3ff" transparent opacity={0.6} />
          </Circle>
        </Billboard>
      ))}
    </group>
  );
}

export function BridgeDecks({ config, path }: { config: TerrainConfig; path: RoadPoint[] }) {
  const crossing = useMemo(() => {
    for (let i = 8; i < path.length - 8; i++) {
      if (path[i].y < config.waterLevel + 1) return i;
    }
    return null;
  }, [path, config.waterLevel]);

  if (!config.hasWater || crossing === null) return null;
  const p = path[crossing];
  const next = path[Math.min(path.length - 1, crossing + 6)];
  const angle = Math.atan2(next.x - p.x, next.z - p.z);

  return (
    <group position={[p.x, config.waterLevel + 0.5, p.z]} rotation={[0, angle, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[config.roadWidth + 0.8, 0.3, 9]} />
        <meshStandardMaterial color="#6b6f76" roughness={0.7} />
      </mesh>
      <mesh position={[-config.roadWidth / 2 - 0.1, 0.35, 0]}>
        <boxGeometry args={[0.15, 0.7, 9]} />
        <meshStandardMaterial color="#4a4d52" />
      </mesh>
      <mesh position={[config.roadWidth / 2 + 0.1, 0.35, 0]}>
        <boxGeometry args={[0.15, 0.7, 9]} />
        <meshStandardMaterial color="#4a4d52" />
      </mesh>
      <mesh position={[0, -2.2, 3.8]}>
        <boxGeometry args={[1, 4, 0.8]} />
        <meshStandardMaterial color="#54575c" roughness={0.85} />
      </mesh>
      <mesh position={[0, -2.2, -3.8]}>
        <boxGeometry args={[1, 4, 0.8]} />
        <meshStandardMaterial color="#54575c" roughness={0.85} />
      </mesh>
    </group>
  );
}
