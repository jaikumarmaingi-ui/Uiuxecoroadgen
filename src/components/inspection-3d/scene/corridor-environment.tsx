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
  roadSurfaceY,
  type PitCut,
} from "@/lib/inspection-3d/terrain";
import type { CorridorRegime } from "@/lib/inspection-3d/regimes";
import { makeGravelMaps, makeRoadMaps, makeRockMaps, makeTerrainDetailMaps } from "@/lib/inspection-3d/textures";
import { TrialPit } from "./trial-pit";

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

const REGIME_SEED: Record<string, number> = {
  mountain: 4171,
  hilly: 5281,
  plains: 6299,
  desert: 7307,
  forest: 8419,
};

/** Terrain, carriageway, shoulders and roadside furniture for the corridor. */
export function CorridorEnvironment({
  regime,
  distress,
  pit,
}: {
  regime: CorridorRegime;
  distress?: number;
  pit?: PitCut;
}) {
  const surfaceDistress = distress ?? regime.surfaceDistress;
  const terrain = useMemo(() => buildCorridorTerrain(regime, { pit }), [regime, pit]);
  const roadGeometry = useMemo(() => buildRoadGeometry({ pit }), [pit]);

  const roadMaps = useMemo(
    () => makeRoadMaps({ widthM: ROAD_WIDTH_M, lengthM: ROAD_TEXTURE_LENGTH, distress: surfaceDistress }),
    [surfaceDistress],
  );
  const gravelMaps = useMemo(() => makeGravelMaps(), []);
  const rockMaps = useMemo(() => makeRockMaps(), []);
  const terrainMaps = useMemo(() => makeTerrainDetailMaps(), []);

  // Geometry and textures are owned by the memo, and react-three-fiber
  // disposes the objects it mounted when the canvas unmounts. Disposing them
  // from an effect cleanup would free live GPU resources on StrictMode's
  // double-invoke, since the memo does not re-run to replace them.

  const roadLength = ROAD_START_Z - ROAD_END_Z;
  const roadMidZ = (ROAD_START_Z + ROAD_END_Z) / 2;

  // Shoulder strips tile at a much tighter scale than the carriageway.
  useEffect(() => {
    const along = Math.round(roadLength / 4.2);
    gravelMaps.map.repeat.set(3, along);
    gravelMaps.normalMap.repeat.set(3, along);
    gravelMaps.roughnessMap.repeat.set(3, along);
    // The terrain UVs are already in metres/12; repeating the detail slower
    // than that keeps the bedding from reading as corduroy stripes.
    for (const t of [terrainMaps.map, terrainMaps.normalMap, terrainMaps.roughnessMap]) {
      t.repeat.set(0.42, 0.42);
    }
  }, [gravelMaps, terrainMaps, roadLength]);

  const shoulderWidth = BENCH_HALF - ROAD_WIDTH_M / 2;
  const shoulderCentre = ROAD_WIDTH_M / 2 + shoulderWidth / 2;
  const seed = REGIME_SEED[regime.id] ?? 4171;

  // Boulders and scree off the cut face. Placed on the real terrain height and
  // sunk slightly, since a boulder balanced on a slope reads as floating.
  const boulders = useMemo(() => {
    const rng = mulberry32(seed);
    const n = regime.props.boulders;
    return Array.from({ length: n }, () => {
      const cliffSide = rng() > 0.32;
      const lateral = BENCH_HALF + 0.3 + rng() * regime.props.boulderSpread;
      const x = cliffSide ? -lateral : lateral;
      const z = ROAD_START_Z - rng() * (roadLength + 60);
      const s = 0.35 + rng() * 1.6;
      return {
        pos: [x, corridorHeight(regime, x, z) - s * 0.18, z] as [number, number, number],
        scale: [s, s * (0.55 + rng() * 0.5), s * (0.8 + rng() * 0.5)] as [number, number, number],
        rot: [rng() * 3, rng() * 6, rng() * 3] as [number, number, number],
      };
    });
  }, [regime, seed, roadLength]);

  // Loose stones spilled onto the shoulder — the detail that sells the scale.
  const stones = useMemo(() => {
    const rng = mulberry32(seed + 101);
    return Array.from({ length: 260 }, () => {
      const x = (rng() > 0.5 ? 1 : -1) * (ROAD_WIDTH_M / 2 - 0.3 + rng() * (shoulderWidth + 0.6));
      const z = ROAD_START_Z - rng() * (roadLength + 40);
      const s = 0.06 + rng() * 0.16;
      return {
        pos: [x, 0.04 + s * 0.4, z] as [number, number, number],
        scale: [s, s * 0.7, s] as [number, number, number],
        rot: [rng() * 3, rng() * 6, rng() * 3] as [number, number, number],
      };
    });
  }, [seed, roadLength, shoulderWidth]);

  // Trees, where the regime has them. Kept off the bench and sat on real
  // ground, with a trunk and a canopy rather than a billboard.
  const trees = useMemo(() => {
    const n = regime.props.trees;
    if (n === 0) return [];
    const rng = mulberry32(seed + 211);
    const [hMin, hMax] = regime.props.treeHeight;
    return Array.from({ length: n }, () => {
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (BENCH_HALF + 2 + rng() * 70);
      const z = ROAD_START_Z + 40 - rng() * (roadLength + 120);
      const h = hMin + rng() * (hMax - hMin);
      return {
        pos: [x, corridorHeight(regime, x, z), z] as [number, number, number],
        h,
        r: h * (0.16 + rng() * 0.08),
        lean: (rng() - 0.5) * 0.1,
        tint: 0.75 + rng() * 0.45,
      };
    });
  }, [regime, seed, roadLength]);

  const scrub = useMemo(() => {
    const n = regime.props.scrub;
    if (n === 0) return [];
    const rng = mulberry32(seed + 307);
    return Array.from({ length: n }, () => {
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (BENCH_HALF + 0.5 + rng() * 26);
      const z = ROAD_START_Z + 20 - rng() * (roadLength + 80);
      const s = 0.25 + rng() * 0.6;
      return {
        pos: [x, corridorHeight(regime, x, z) + s * 0.3, z] as [number, number, number],
        scale: [s, s * (0.6 + rng() * 0.6), s] as [number, number, number],
        rot: [0, rng() * 6, 0] as [number, number, number],
      };
    });
  }, [regime, seed, roadLength]);

  // Wind-blown sand lying across the carriageway, in a desert regime.
  const drifts = useMemo(() => {
    if (!regime.props.sandDrift) return [];
    const rng = mulberry32(seed + 401);
    return Array.from({ length: 46 }, () => {
      const z = ROAD_START_Z - rng() * roadLength;
      const w = 1.6 + rng() * 4.5;
      const side = rng() > 0.5 ? 1 : -1;
      return {
        pos: [side * (ROAD_WIDTH_M / 2 - w * 0.35), roadSurfaceY(0) + 0.004, z] as [number, number, number],
        scale: [w, 1.2 + rng() * 3.5, 1] as [number, number, number],
        rot: (rng() - 0.5) * 0.5,
      };
    });
  }, [regime.props.sandDrift, seed, roadLength]);

  const barrierPosts = useMemo(() => {
    if (!regime.props.barrier) return [];
    const arr: number[] = [];
    for (let z = ROAD_START_Z - 6; z > ROAD_END_Z + 20; z -= 4) arr.push(z);
    return arr;
  }, [regime.props.barrier]);

  const snowPoles = useMemo(() => {
    if (!regime.props.snowPoles) return [];
    const arr: number[] = [];
    for (let z = ROAD_START_Z - 12; z > ROAD_END_Z + 30; z -= 26) arr.push(z);
    return arr;
  }, [regime.props.snowPoles]);

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

      {drifts.length > 0 && (
        <Instances range={drifts.length} limit={drifts.length} receiveShadow>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color="#b9a179" roughness={1} transparent opacity={0.9} side={THREE.DoubleSide} />
          {drifts.map((d, i) => (
            <Instance key={i} position={d.pos} rotation={[-Math.PI / 2, 0, d.rot]} scale={d.scale} />
          ))}
        </Instances>
      )}

      {boulders.length > 0 && (
        <Instances range={boulders.length} limit={boulders.length} castShadow receiveShadow>
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
      )}

      <Instances range={stones.length} limit={stones.length} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#6a6355" roughness={1} metalness={0} />
        {stones.map((s, i) => (
          <Instance key={i} position={s.pos} scale={s.scale} rotation={s.rot} />
        ))}
      </Instances>

      {scrub.length > 0 && (
        <Instances range={scrub.length} limit={scrub.length} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={regime.palette.verdure ? "#4a5a32" : "#6b6046"}
            roughness={1}
            flatShading
          />
          {scrub.map((s, i) => (
            <Instance key={i} position={s.pos} scale={s.scale} rotation={s.rot} />
          ))}
        </Instances>
      )}

      {trees.length > 0 && <Trees trees={trees} verdure={regime.palette.verdure} />}

      {/* Crash barrier: W-beam on posts, down the fill side. */}
      {barrierPosts.length > 0 && (
        <>
          <Instances range={barrierPosts.length} limit={barrierPosts.length} castShadow>
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
        </>
      )}

      {pit && <TrialPit pit={pit} />}

      {/* Snow poles — black/white banded, cut side. */}
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

interface TreeItem {
  pos: [number, number, number];
  h: number;
  r: number;
  lean: number;
  tint: number;
}

/**
 * Trunks and canopies as two instanced passes.
 *
 * Hundreds of trees as individual meshes would cost hundreds of draw calls;
 * two instanced meshes cost two. The canopy is a cone for conifer-shaped
 * regimes and reads well enough at the distances the corridor is seen from.
 */
function Trees({ trees, verdure }: { trees: TreeItem[]; verdure: readonly [number, number, number] | null }) {
  const canopy = useMemo(() => {
    const base = verdure ?? [0.2, 0.28, 0.14];
    return new THREE.Color(base[0], base[1], base[2]).multiplyScalar(1.5);
  }, [verdure]);

  return (
    <group>
      <Instances range={trees.length} limit={trees.length} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 1, 1, 6]} />
        <meshStandardMaterial color="#3b3026" roughness={1} />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.pos[0], t.pos[1] + t.h * 0.2, t.pos[2]]}
            scale={[t.r * 0.32, t.h * 0.4, t.r * 0.32]}
            rotation={[t.lean, 0, t.lean]}
          />
        ))}
      </Instances>
      <Instances range={trees.length} limit={trees.length} castShadow>
        <coneGeometry args={[1, 1, 7]} />
        <meshStandardMaterial color={canopy} roughness={0.95} flatShading />
        {trees.map((t, i) => (
          <Instance
            key={i}
            position={[t.pos[0], t.pos[1] + t.h * 0.62, t.pos[2]]}
            scale={[t.r, t.h * 0.85, t.r]}
            rotation={[t.lean, i * 0.7, t.lean]}
          />
        ))}
      </Instances>
    </group>
  );
}
