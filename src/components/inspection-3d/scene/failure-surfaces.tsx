"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Instance, Instances } from "@react-three/drei";
import { roadSurfaceY } from "@/lib/inspection-3d/terrain";
import { FAILURE_META } from "@/lib/inspection-3d/regimes";
import { SEVERITY_HEX, type CorridorDefect } from "@/lib/inspection-3d/corridor-defects";

/**
 * How each failure actually looks on the carriageway.
 *
 * The marker above a defect tells you something is there; this is the thing
 * itself. Each form is drawn from the mechanism rather than from a generic
 * blob — rutting is two parallel troughs in the wheel paths, an edge break
 * crumbles inward from the verge, a washout scours out sideways — because an
 * engineer reading the scene should be able to name the failure before
 * reading the label.
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

/** Numeric hash of a defect id, so each patch scatters differently. */
function idSeed(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Sits a hair above the carriageway so it is never in a depth fight with it. */
const LIFT = 0.006;

export function FailureSurfaces({
  defects,
  excludeId,
}: {
  defects: CorridorDefect[];
  /**
   * The defect whose trial pit is currently open. Its surface treatment is
   * suppressed: the pavement there has been cut out and lifted, so drawing
   * potholes floating over the open hole would contradict the excavation.
   */
  excludeId?: string | null;
}) {
  return (
    <group>
      {defects
        .filter((d) => d.id !== excludeId)
        .map((d) => (
          <FailurePatch key={d.id} defect={d} />
        ))}
    </group>
  );
}

function FailurePatch({ defect }: { defect: CorridorDefect }) {
  const form = FAILURE_META[defect.kind].form;
  const rng = useMemo(() => mulberry32(idSeed(defect.id)), [defect.id]);
  const y = roadSurfaceY(defect.x) + LIFT;

  switch (form) {
    case "pits":
      return <Pits defect={defect} y={y} rng={rng} />;
    case "crazing":
      return <Crazing defect={defect} y={y} rng={rng} />;
    case "seams":
      return <Seams defect={defect} y={y} rng={rng} />;
    case "troughs":
      return <Troughs defect={defect} y={y} rng={rng} />;
    case "erosion":
      return <Erosion defect={defect} y={y} rng={rng} />;
    case "debris":
      return <Debris defect={defect} y={y} rng={rng} />;
    case "heave":
      return <Heave defect={defect} y={y} rng={rng} />;
    case "sheen":
      return <Sheen defect={defect} y={y} />;
    default:
      return null;
  }
}

type PatchProps = { defect: CorridorDefect; y: number; rng: () => number };

/** Potholes: open holes with a dark throat and a broken lip. */
function Pits({ defect, y, rng }: PatchProps) {
  const holes = useMemo(() => {
    const n = 3 + Math.floor(rng() * 4);
    return Array.from({ length: n }, () => {
      const r = 0.22 + rng() * 0.42;
      return {
        x: defect.x + (rng() - 0.5) * defect.widthM,
        z: defect.z + (rng() - 0.5) * defect.lengthM,
        r,
        depth: 0.06 + rng() * 0.1,
        rot: rng() * Math.PI,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defect.id]);

  return (
    <group>
      {holes.map((h, i) => (
        <group key={i} position={[h.x, y, h.z]} rotation={[0, h.rot, 0]}>
          {/* Broken lip of the surface course around the hole. */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[h.r * 0.82, h.r * 1.12, 9]} />
            <meshStandardMaterial color="#2c2a27" roughness={1} />
          </mesh>
          {/* The hole itself: base course exposed, in shadow. */}
          <mesh position={[0, -h.depth, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[h.r * 0.86, 9]} />
            <meshStandardMaterial color="#14120f" roughness={1} />
          </mesh>
          <mesh position={[0, -h.depth / 2, 0]}>
            <cylinderGeometry args={[h.r * 0.86, h.r * 0.7, h.depth, 9, 1, true]} />
            <meshStandardMaterial color="#1c1915" roughness={1} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Crocodile cracking / ravelling: a dense field of short dark fissures. */
function Crazing({ defect, y, rng }: PatchProps) {
  const cracks = useMemo(() => {
    const n = 34 + Math.floor(rng() * 26);
    return Array.from({ length: n }, () => ({
      x: defect.x + (rng() - 0.5) * defect.widthM,
      z: defect.z + (rng() - 0.5) * defect.lengthM,
      len: 0.18 + rng() * 0.5,
      rot: rng() * Math.PI,
      w: 0.018 + rng() * 0.03,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defect.id]);

  return (
    <Instances range={cracks.length} limit={cracks.length}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color="#0d0c0b" roughness={1} side={THREE.DoubleSide} />
      {cracks.map((c, i) => (
        <Instance
          key={i}
          position={[c.x, y, c.z]}
          rotation={[-Math.PI / 2, 0, c.rot]}
          scale={[c.w, c.len, 1]}
        />
      ))}
    </Instances>
  );
}

/** Longitudinal cracking: a long seam with short branches off it. */
function Seams({ defect, y, rng }: PatchProps) {
  const segments = useMemo(() => {
    const n = 12;
    const out: { x: number; z: number; len: number; rot: number; w: number }[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const z = defect.z + (t - 0.5) * defect.lengthM;
      const wobble = (rng() - 0.5) * 0.22;
      out.push({
        x: defect.x + wobble,
        z,
        len: defect.lengthM / n,
        rot: (rng() - 0.5) * 0.12,
        w: 0.03 + rng() * 0.035,
      });
      if (rng() > 0.65) {
        out.push({
          x: defect.x + wobble + (rng() - 0.5) * 0.5,
          z: z + (rng() - 0.5) * 0.4,
          len: 0.2 + rng() * 0.35,
          rot: 0.7 + rng() * 0.7,
          w: 0.02,
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defect.id]);

  return (
    <Instances range={segments.length} limit={segments.length}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color="#0c0b0a" roughness={1} side={THREE.DoubleSide} />
      {segments.map((c, i) => (
        <Instance key={i} position={[c.x, y, c.z]} rotation={[-Math.PI / 2, 0, c.rot]} scale={[c.w, c.len, 1]} />
      ))}
    </Instances>
  );
}

/** Rutting, settlement, corrugation: depressed troughs that hold water. */
function Troughs({ defect, y, rng }: PatchProps) {
  const twin = defect.kind === "rutting";
  const lanes = twin ? [-0.8, 0.8] : [0];
  const depth = defect.severity === "critical" ? 0.075 : defect.severity === "high" ? 0.05 : 0.032;

  return (
    <group>
      {lanes.map((off, i) => (
        <group key={i}>
          {/* The depression itself, sunk below the running surface. */}
          <mesh position={[defect.x + off, y - depth, defect.z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[defect.widthM * (twin ? 0.42 : 1), defect.lengthM, 1, 6]} />
            <meshStandardMaterial color="#23211e" roughness={0.78} />
          </mesh>
          {/* Standing water in the bottom of it — the thing that does the damage. */}
          {defect.severity !== "moderate" && (
            <mesh
              position={[defect.x + off, y - depth + 0.012, defect.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[defect.widthM * (twin ? 0.3 : 0.62), defect.lengthM * 0.72]} />
              <meshStandardMaterial
                color="#141a1c"
                roughness={0.06}
                metalness={0.1}
                envMapIntensity={2.4}
                transparent
                opacity={0.85}
              />
            </mesh>
          )}
          {/* Shoved lips either side of the rut. */}
          {twin &&
            [-1, 1].map((s) => (
              <mesh
                key={s}
                position={[defect.x + off + s * defect.widthM * 0.24, y + 0.012, defect.z]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[defect.widthM * 0.09, defect.lengthM]} />
                <meshStandardMaterial color="#39352f" roughness={0.95} />
              </mesh>
            ))}
        </group>
      ))}
      <ScatterGrit defect={defect} y={y} rng={rng} count={14} />
    </group>
  );
}

/** Edge break and washout: the carriageway edge eaten away. */
function Erosion({ defect, y, rng }: PatchProps) {
  const side = Math.sign(defect.x) || 1;
  const bites = useMemo(() => {
    const n = 7 + Math.floor(rng() * 6);
    return Array.from({ length: n }, (_, i) => {
      const t = (i + 0.5) / n;
      return {
        z: defect.z + (t - 0.5) * defect.lengthM,
        depth: 0.25 + rng() * defect.widthM * 0.8,
        len: defect.lengthM / n,
        drop: 0.05 + rng() * 0.12,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defect.id]);

  return (
    <group>
      {bites.map((b, i) => (
        <group key={i}>
          {/* Missing pavement, showing the base beneath. */}
          <mesh
            position={[defect.x + (side * b.depth) / 2, y - b.drop, b.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[b.depth, b.len]} />
            <meshStandardMaterial color="#2a2118" roughness={1} />
          </mesh>
          {/* The broken vertical face of the remaining bound layer. */}
          <mesh position={[defect.x, y - b.drop / 2, b.z]} rotation={[0, side * Math.PI / 2, 0]}>
            <planeGeometry args={[b.len, b.drop]} />
            <meshStandardMaterial color="#17150f" roughness={1} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <ScatterGrit defect={defect} y={y} rng={rng} count={22} />
    </group>
  );
}

/** Rockfall: slope material lying on the running surface. */
function Debris({ defect, y, rng }: PatchProps) {
  const rocks = useMemo(() => {
    const n = 12 + Math.floor(rng() * 10);
    return Array.from({ length: n }, () => {
      const s = 0.12 + rng() * 0.5;
      return {
        pos: [
          defect.x + (rng() - 0.5) * defect.widthM,
          y + s * 0.42,
          defect.z + (rng() - 0.5) * defect.lengthM,
        ] as [number, number, number],
        scale: [s, s * (0.6 + rng() * 0.5), s * (0.8 + rng() * 0.4)] as [number, number, number],
        rot: [rng() * 3, rng() * 6, rng() * 3] as [number, number, number],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defect.id, y]);

  return (
    <group>
      {/* Impact scars under the debris. */}
      <mesh position={[defect.x, y, defect.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(defect.widthM, defect.lengthM) * 0.34, 12]} />
        <meshStandardMaterial color="#1b1917" roughness={1} transparent opacity={0.75} />
      </mesh>
      <Instances range={rocks.length} limit={rocks.length} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#544d44" roughness={1} />
        {rocks.map((r, i) => (
          <Instance key={i} position={r.pos} scale={r.scale} rotation={r.rot} />
        ))}
      </Instances>
    </group>
  );
}

/** Frost heave: the surface lifted into a broken dome. */
function Heave({ defect, y, rng }: PatchProps) {
  const lift = defect.severity === "critical" ? 0.11 : 0.07;
  return (
    <group>
      <mesh position={[defect.x, y + lift * 0.5, defect.z]} castShadow receiveShadow>
        <sphereGeometry args={[Math.max(defect.widthM, defect.lengthM) * 0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#302c28" roughness={0.97} />
      </mesh>
      <Crazing defect={defect} y={y + lift} rng={rng} />
    </group>
  );
}

/** Bleeding: a slick of binder that has come to the surface. */
function Sheen({ defect, y }: { defect: CorridorDefect; y: number }) {
  return (
    <mesh position={[defect.x, y, defect.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[defect.widthM * 0.7, defect.lengthM]} />
      <meshStandardMaterial
        color="#0b0a09"
        roughness={0.12}
        metalness={0.05}
        envMapIntensity={2.2}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/** Loose material thrown clear of a failure. */
function ScatterGrit({ defect, y, rng, count }: PatchProps & { count: number }) {
  const bits = useMemo(() => {
    return Array.from({ length: count }, () => {
      const s = 0.03 + rng() * 0.07;
      return {
        pos: [
          defect.x + (rng() - 0.5) * defect.widthM * 2.1,
          y + s * 0.4,
          defect.z + (rng() - 0.5) * defect.lengthM * 1.5,
        ] as [number, number, number],
        scale: [s, s * 0.6, s] as [number, number, number],
        rot: [rng() * 3, rng() * 6, rng() * 3] as [number, number, number],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defect.id, y, count]);

  return (
    <Instances range={bits.length} limit={bits.length}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#3d382f" roughness={1} />
      {bits.map((b, i) => (
        <Instance key={i} position={b.pos} scale={b.scale} rotation={b.rot} />
      ))}
    </Instances>
  );
}

export { SEVERITY_HEX };
