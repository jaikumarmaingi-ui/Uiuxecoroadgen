"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { roadSurfaceY, type PitCut } from "@/lib/inspection-3d/terrain";
import { LAYER_THICKNESS, PAVEMENT_LAYERS } from "../pavement-layers";

/**
 * Depth of the saw kerf band at the rim — the blade slot between the road
 * edge and the block that was cut out.
 *
 * It is modelled as a vertical band rather than a flat collar on purpose. The
 * carriageway is cambered, so it is ~60mm higher at the edge of the cut
 * nearest the centreline than at the outer edge; a horizontal collar at one
 * height would float above the road on one side and sink into it on the
 * other. A vertical band taller than that difference reads correctly all the
 * way round, whatever the crown is doing.
 */
const KERF_H = 0.12;
/** Clearance below the deepest layer before the pit floor. */
const FLOOR_CLEARANCE = 0.16;

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

/**
 * The trial pit cut into the carriageway at the flagged defect.
 *
 * The opening is a real hole — `buildRoadGeometry` and `buildCorridorTerrain`
 * both skip the cells inside `pit` — so this lines it: four walls carrying the
 * same stratigraphy as the extracted core, a subgrade floor, the saw kerf
 * around the rim, and the spoil and cones that go with an open cut on a live
 * carriageway. Because the wall strata mirror the core's layers, lifting the
 * core out leaves its own section visible in the wall it came from.
 *
 * It is part of the permanent scene, not the inspection flow: the pit is
 * already open when you drive up to the defect.
 */
export function TrialPit({ pit }: { pit: PitCut }) {
  const side = pit.half * 2;
  const depth = PAVEMENT_LAYERS.length * LAYER_THICKNESS;
  // Anchor the rim to the highest point of the road around the opening, so no
  // gap can ever open up between the wall top and the cut edge of the asphalt.
  const rimY = Math.max(roadSurfaceY(pit.x - pit.half), roadSurfaceY(pit.x + pit.half)) + 0.012;
  const strataTopY = rimY - KERF_H;
  const floorY = strataTopY - depth - FLOOR_CLEARANCE;

  // Wall strata are the undistressed base colours: the surrounding pavement is
  // the reference the extracted core is being judged against.
  const strata = useMemo(
    () =>
      PAVEMENT_LAYERS.map((layer, i) => ({
        key: layer.key,
        color: new THREE.Color(layer.baseColor).multiplyScalar(0.82),
        y: strataTopY - (i * LAYER_THICKNESS + LAYER_THICKNESS / 2),
      })),
    [strataTopY],
  );

  // Each wall is a plane facing into the pit. Rotations put them on the four
  // sides of the opening; DoubleSide keeps them solid from a grazing angle.
  const walls = useMemo(
    () =>
      [
        { pos: [0, 0, -pit.half] as const, rot: [0, 0, 0] as const },
        { pos: [0, 0, pit.half] as const, rot: [0, Math.PI, 0] as const },
        { pos: [-pit.half, 0, 0] as const, rot: [0, Math.PI / 2, 0] as const },
        { pos: [pit.half, 0, 0] as const, rot: [0, -Math.PI / 2, 0] as const },
      ] as const,
    [pit.half],
  );

  // Spoil: what came out of the hole, heaped on the shoulder side of it.
  const spoil = useMemo(() => {
    const rng = mulberry32(5501);
    return Array.from({ length: 14 }, () => {
      const s = 0.1 + rng() * 0.22;
      return {
        pos: [
          pit.x - pit.half - 0.5 - rng() * 0.9,
          rimY + s * 0.32,
          pit.z + (rng() - 0.5) * 2.6,
        ] as [number, number, number],
        scale: [s, s * 0.6, s] as [number, number, number],
        rot: [rng() * 3, rng() * 6, rng() * 3] as [number, number, number],
      };
    });
  }, [pit.x, pit.z, pit.half, rimY]);

  return (
    <group>
      {/* Walls: the pavement in section, layer by layer. */}
      <group position={[pit.x, 0, pit.z]}>
        {walls.map((w, wi) =>
          strata.map((layer) => (
            <mesh key={`${wi}-${layer.key}`} position={[w.pos[0], layer.y, w.pos[2]]} rotation={w.rot} receiveShadow>
              <planeGeometry args={[side, LAYER_THICKNESS]} />
              <meshStandardMaterial color={layer.color} roughness={0.95} side={THREE.DoubleSide} />
            </mesh>
          )),
        )}

        {/* Compacted subgrade floor, and the shaft below the bound layers. */}
        {walls.map((w, wi) => (
          <mesh
            key={`base-${wi}`}
            position={[w.pos[0], (floorY + strataTopY - depth) / 2, w.pos[2]]}
            rotation={w.rot}
            receiveShadow
          >
            <planeGeometry args={[side, FLOOR_CLEARANCE]} />
            <meshStandardMaterial color="#3b3026" roughness={1} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <mesh position={[0, floorY, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[side, side]} />
          <meshStandardMaterial color="#2b231b" roughness={1} />
        </mesh>

        {/* Saw kerf: the dark blade slot immediately below the cut edge of the
            asphalt, running right around the opening. */}
        {walls.map((w, wi) => (
          <mesh key={`kerf-${wi}`} position={[w.pos[0], rimY - KERF_H / 2, w.pos[2]]} rotation={w.rot}>
            <planeGeometry args={[side, KERF_H]} />
            <meshStandardMaterial color="#090c0f" roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Survey marker on the rim of the cut. This is the product's cyan
            accent, kept with the opening rather than on the core, so it stays
            put when the core lifts out. */}
        <mesh position={[0, rimY + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[pit.half + 0.1, pit.half + 0.16, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#35e0d0" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      </group>

      {/* Spoil heap from the excavation. */}
      {spoil.map((sp, i) => (
        <mesh key={`spoil-${i}`} position={sp.pos} scale={sp.scale} rotation={sp.rot} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5a5145" roughness={1} />
        </mesh>
      ))}

      {/* Traffic cones — an open cut on a live carriageway is coned off. */}
      {[
        [pit.x - pit.half - 0.7, pit.z - pit.half - 0.7],
        [pit.x + pit.half + 0.7, pit.z - pit.half - 0.7],
        [pit.x - pit.half - 0.7, pit.z + pit.half + 0.7],
        [pit.x + pit.half + 0.7, pit.z + pit.half + 0.7],
      ].map(([cx, cz], i) => (
        <group key={`cone-${i}`} position={[cx, roadSurfaceY(cx), cz]}>
          <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.34, 0.04, 0.34]} />
            <meshStandardMaterial color="#1a1d21" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.3, 0]} castShadow>
            <coneGeometry args={[0.15, 0.56, 12]} />
            <meshStandardMaterial color="#d8541f" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <coneGeometry args={[0.107, 0.1, 12]} />
            <meshStandardMaterial color="#e9edf0" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
