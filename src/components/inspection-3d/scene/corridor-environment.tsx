"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Instance, Instances } from "@react-three/drei";
import {
  BENCH_HALF,
  ROAD_END_Z,
  ROAD_START_Z,
  ROAD_TEXTURE_LENGTH,
  ROAD_WIDTH_M,
  buildCorridorTerrain,
  buildRoadGeometry,
  corridorHeight,
} from "@/lib/inspection-3d/terrain";
import { makeGravelMaps, makeRoadMaps, makeRockMaps, makeTerrainDetailMaps } from "@/lib/inspection-3d/textures";

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Terrain, carriageway, shoulders and roadside furniture for the corridor. */
export function CorridorEnvironment({ distress = 0.55 }: { distress?: number }) {
  const terrain = useMemo(() => buildCorridorTerrain(), []);
  const roadGeometry = useMemo(() => buildRoadGeometry(), []);

  const roadMaps = useMemo(
    () => makeRoadMaps({ widthM: ROAD_WIDTH_M, lengthM: ROAD_TEXTURE_LENGTH, distress }),
    [distress],
  );
  const gravelMaps = useMemo(() => makeGravelMaps(), []);
  const rockMaps = useMemo(() => makeRockMaps(), []);
  const terrainMaps = useMemo(() => makeTerrainDetailMaps(), []);

  // Geometry and textures are owned by the memo, and react-three-fiber
  // disposes the objects it mounted when the canvas unmounts. Disposing them
  // from an effect cleanup would free live GPU resources on StrictMode's
  // double-invoke, since the memo does not re-run to replace them.

  // Shoulder strips tile at a much tighter scale than the carriageway.
  useEffect(() => {
    gravelMaps.map.repeat.set(3, 90);
    gravelMaps.normalMap.repeat.set(3, 90);
    gravelMaps.roughnessMap.repeat.set(3, 90);
    // The terrain UVs are already in metres/12; repeating the detail slower
    // than that keeps the bedding from reading as corduroy stripes.
    for (const t of [terrainMaps.map, terrainMaps.normalMap, terrainMaps.roughnessMap]) {
      t.repeat.set(0.42, 0.42);
    }
  }, [gravelMaps, terrainMaps]);

  const shoulderWidth = BENCH_HALF - ROAD_WIDTH_M / 2;
  const shoulderCentre = ROAD_WIDTH_M / 2 + shoulderWidth / 2;
  const roadLength = ROAD_START_Z - ROAD_END_Z;
  const roadMidZ = (ROAD_START_Z + ROAD_END_Z) / 2;

  // Boulders and scree that have come off the cut face, plus a few on the
  // fill side. Placed on the real terrain height so nothing floats.
  const boulders = useMemo(() => {
    const rng = mulberry32(4171);
    const items: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < 90; i++) {
      const cliffSide = rng() > 0.32;
      // Keep them close to the toe of the slope: a boulder sitting on a 45°
      // cut face reads as floating however it is offset.
      const lateral = BENCH_HALF + 0.3 + rng() * (cliffSide ? 9 : 7);
      const x = cliffSide ? -lateral : lateral;
      const z = ROAD_START_Z - rng() * (roadLength + 60);
      const s = 0.35 + rng() * 1.6;
      items.push({
        // Sunk slightly into the ground so the contact edge is buried.
        pos: [x, corridorHeight(x, z) - s * 0.18, z],
        scale: [s, s * (0.55 + rng() * 0.5), s * (0.8 + rng() * 0.5)],
        rot: [rng() * 3, rng() * 6, rng() * 3],
      });
    }
    return items;
  }, [roadLength]);

  // Loose stones spilled onto the shoulder — the detail that sells the scale.
  const stones = useMemo(() => {
    const rng = mulberry32(917);
    return Array.from({ length: 120 }, () => {
      const x = (rng() > 0.5 ? 1 : -1) * (ROAD_WIDTH_M / 2 - 0.3 + rng() * (shoulderWidth + 0.6));
      const z = ROAD_START_Z - rng() * (roadLength + 40);
      const s = 0.06 + rng() * 0.16;
      return {
        pos: [x, 0.04 + s * 0.4, z] as [number, number, number],
        scale: [s, s * 0.7, s] as [number, number, number],
        rot: [rng() * 3, rng() * 6, rng() * 3] as [number, number, number],
      };
    });
  }, [roadLength, shoulderWidth]);

  // Crash barrier along the drop, and snow poles that mark the edge when the
  // carriageway is buried — both standard on high-altitude strategic roads.
  const barrierPosts = useMemo(() => {
    const arr: number[] = [];
    for (let z = ROAD_START_Z - 6; z > ROAD_END_Z + 20; z -= 4) arr.push(z);
    return arr;
  }, []);

  const snowPoles = useMemo(() => {
    const arr: number[] = [];
    for (let z = ROAD_START_Z - 12; z > ROAD_END_Z + 30; z -= 26) arr.push(z);
    return arr;
  }, []);

  const barrierX = ROAD_WIDTH_M / 2 + shoulderWidth * 0.62;

  return (
    <group>
      <mesh geometry={terrain.geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          map={terrainMaps.map}
          normalMap={terrainMaps.normalMap}
          roughnessMap={terrainMaps.roughnessMap}
          normalScale={new THREE.Vector2(0.85, 0.85)}
          roughness={1}
          metalness={0.015}
          envMapIntensity={0.45}
          dithering
        />
      </mesh>

      {/* Shoulders: compacted gravel either side of the carriageway. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[side * shoulderCentre, 0.035, roadMidZ]}
          receiveShadow
        >
          <planeGeometry args={[shoulderWidth, roadLength]} />
          <meshStandardMaterial
            map={gravelMaps.map}
            normalMap={gravelMaps.normalMap}
            roughnessMap={gravelMaps.roughnessMap}
            normalScale={new THREE.Vector2(1.1, 1.1)}
            roughness={1}
            metalness={0}
            dithering
          />
        </mesh>
      ))}

      {/* Carriageway. Markings, wheel-path polish and cracking are in the map. */}
      <mesh geometry={roadGeometry} receiveShadow>
        <meshStandardMaterial
          map={roadMaps.map}
          normalMap={roadMaps.normalMap}
          roughnessMap={roadMaps.roughnessMap}
          normalScale={new THREE.Vector2(1.25, 1.25)}
          roughness={1}
          metalness={0.02}
          dithering
        />
      </mesh>

      <Instances range={boulders.length} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color="#5b564d"
          roughness={0.98}
          metalness={0.02}
          normalMap={rockMaps.normalMap}
          normalScale={new THREE.Vector2(1.4, 1.4)}
        />
        {boulders.map((b, i) => (
          <Instance key={i} position={b.pos} scale={b.scale} rotation={b.rot} />
        ))}
      </Instances>

      <Instances range={stones.length} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#6a6355" roughness={1} metalness={0} />
        {stones.map((s, i) => (
          <Instance key={i} position={s.pos} scale={s.scale} rotation={s.rot} />
        ))}
      </Instances>

      {/* Crash barrier: W-beam on posts, down the gorge side. */}
      <Instances range={barrierPosts.length} castShadow>
        <boxGeometry args={[0.12, 0.78, 0.12]} />
        <meshStandardMaterial color="#6f7378" roughness={0.62} metalness={0.7} />
        {barrierPosts.map((z, i) => (
          <Instance key={i} position={[barrierX, 0.39, z]} />
        ))}
      </Instances>
      <mesh position={[barrierX, 0.66, roadMidZ]} castShadow>
        <boxGeometry args={[0.07, 0.3, roadLength - 26]} />
        <meshStandardMaterial color="#8d9299" roughness={0.45} metalness={0.78} />
      </mesh>

      {/* Snow poles — black/white banded, cliff side. */}
      {snowPoles.map((z) => (
        <group key={z} position={[-(ROAD_WIDTH_M / 2 + shoulderWidth * 0.7), 0, z]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, 1.8, 6]} />
            <meshStandardMaterial color="#d9dde1" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.42, 0]}>
            <cylinderGeometry args={[0.052, 0.052, 0.26, 6]} />
            <meshStandardMaterial color="#c8352f" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <cylinderGeometry args={[0.052, 0.052, 0.26, 6]} />
            <meshStandardMaterial color="#c8352f" roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
