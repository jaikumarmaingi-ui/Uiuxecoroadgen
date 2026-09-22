"use client";

import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import * as THREE from "three";
import {
  BENCH_HALF,
  ROAD_END_Z,
  ROAD_START_Z,
  ROAD_WIDTH_M,
  meshHeightAt,
  roadSurfaceY,
} from "@/lib/inspection-3d/terrain";
import type { CorridorRegime } from "@/lib/inspection-3d/regimes";

/**
 * Material shed onto the corridor by a slope failure.
 *
 * Debris comes off the cut face, so it is densest against the toe and thins
 * across the carriageway — it does not arrive evenly from both sides. It is
 * also not continuous: a slide happens at a place, so the material is grouped
 * into runs along the corridor with clear road between them.
 *
 * A real slide closes the road outright. This leaves a passable line down the
 * offside, which is both what a partially cleared route looks like — BRO opens
 * one lane before the full clearance — and what keeps the survey drivable. A
 * blockade that stopped the vehicle would end the inspection rather than
 * describe the hazard.
 */

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

interface Rock {
  pos: [number, number, number];
  scale: number;
  rot: [number, number, number];
  tint: number;
}

export function SlopeDebris({
  regime,
  amount,
}: {
  regime: CorridorRegime;
  /** 0-1; scales how much material came down and how far it reached. */
  amount: number;
}) {
  const rocks = useMemo<Rock[]>(() => {
    if (amount <= 0.01) return [];
    const rng = mulberry32(91_711 + Math.round(amount * 1000));
    const out: Rock[] = [];

    // Slide runs: a handful of places along the corridor, not a ribbon.
    const runs = Math.max(2, Math.round(5 * amount));
    for (let r = 0; r < runs; r++) {
      const centreZ = ROAD_START_Z - 120 - rng() * (ROAD_START_Z - ROAD_END_Z - 240);
      const spread = 18 + rng() * 34;
      const perRun = Math.round((26 + rng() * 34) * amount);

      for (let i = 0; i < perRun; i++) {
        const z = centreZ + (rng() - 0.5) * spread * 2;
        if (z > ROAD_START_Z || z < ROAD_END_Z) continue;

        // Reach falls off across the carriageway: heaped on the cut side,
        // scattered at the centre, sparse beyond it.
        const t = Math.pow(rng(), 1.9);
        const x = -BENCH_HALF - 3 + t * (BENCH_HALF + 3 + ROAD_WIDTH_M * 0.62 * amount);

        const onRoad = Math.abs(x) <= ROAD_WIDTH_M / 2;
        const ground = onRoad ? roadSurfaceY(x) : meshHeightAt(regime, x, z);
        const scale = (0.22 + Math.pow(rng(), 2.2) * 1.5) * (onRoad ? 0.7 : 1);

        out.push({
          pos: [x, ground + scale * 0.32, z],
          scale,
          rot: [rng() * Math.PI, rng() * Math.PI, rng() * Math.PI],
          tint: 0.72 + rng() * 0.5,
        });
      }
    }
    return out;
  }, [regime, amount]);

  // The regime palette is linear RGB triples, not a colour string.
  const base = useMemo(() => {
    const [r, g, b] = regime.palette.rockDark;
    return new THREE.Color(r, g, b);
  }, [regime.palette.rockDark]);

  if (rocks.length === 0) return null;

  return (
    <Instances limit={rocks.length} range={rocks.length} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.95} metalness={0.02} flatShading />
      {rocks.map((r, i) => (
        <Instance
          key={i}
          position={r.pos}
          rotation={r.rot}
          scale={[r.scale, r.scale * 0.72, r.scale * 0.9]}
          color={base.clone().multiplyScalar(r.tint)}
        />
      ))}
    </Instances>
  );
}
