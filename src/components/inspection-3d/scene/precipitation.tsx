"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ConditionSpec } from "@/lib/inspection-3d/conditions";

/**
 * Rain, snow and blown dust.
 *
 * One system for all three: they differ in how fast they fall, how far the
 * wind carries them sideways, how big and how bright they are, and whether
 * they streak. A separate implementation per condition would be three copies
 * of the same recycling logic.
 *
 * The field is a box that rides with the camera and wraps. Particles are never
 * created or destroyed — one that leaves the box is repositioned on the
 * opposite face, so a kilometre of driving costs exactly as much as standing
 * still. Rain over a 1.55 km corridor drawn as world-space geometry would be
 * either a million particles or a visibly empty sky.
 */

const FIELD = { w: 90, h: 46, d: 90 };

interface Profile {
  count: number;
  /** Fall speed, world units per second. */
  fall: number;
  /** Lateral drift per unit of wind. */
  drift: number;
  size: number;
  color: string;
  opacity: number;
  /** Vertical stretch; >1 draws a streak rather than a dot. */
  stretch: number;
  /** How much each particle wanders, for snow and dust. */
  flutter: number;
}

interface ParticleField {
  n: number;
  pos: Float32Array;
  phase: Float32Array;
  dummy: THREE.Object3D;
}

function makeField(count: number): ParticleField {
  const pos = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * FIELD.w;
    pos[i * 3 + 1] = Math.random() * FIELD.h;
    pos[i * 3 + 2] = (Math.random() - 0.5) * FIELD.d;
    phase[i] = Math.random() * Math.PI * 2;
  }
  return { n: count, pos, phase, dummy: new THREE.Object3D() };
}

const PROFILES: Record<"rain" | "snow" | "dust", Profile> = {
  rain: { count: 3000, fall: 34, drift: 7, size: 0.045, color: "#b9cddd", opacity: 0.5, stretch: 10, flutter: 0 },
  // Snow and dust were drawn at a size that read as floating slabs rather than
  // flakes and grains. Smaller and far more numerous costs the same on an
  // instanced draw and reads as weather instead of debris.
  snow: { count: 4200, fall: 3.2, drift: 4.5, size: 0.055, color: "#f2f7fb", opacity: 0.9, stretch: 1, flutter: 1.4 },
  dust: { count: 5200, fall: 1.1, drift: 26, size: 0.07, color: "#c9a475", opacity: 0.4, stretch: 1.8, flutter: 2.2 },
};

export function Precipitation({ spec }: { spec: ConditionSpec }) {
  const kind = spec.fx.precip;
  const rate = spec.fx.precipRate;
  const wind = spec.fx.wind;

  const profile = kind ? PROFILES[kind] : null;
  const count = profile ? Math.max(1, Math.round(profile.count * rate)) : 0;

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

  // The particle field lives in a ref, built on the first frame that needs it.
  // A useMemo result is immutable to the compiler, and this array is written
  // every frame by design, so memoising it is the wrong tool — and building it
  // lazily means a clear sky allocates nothing at all.
  const stateRef = useRef<ParticleField | null>(null);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh || !profile || count === 0) return;
    if (!stateRef.current || stateRef.current.n !== count) {
      stateRef.current = makeField(count);
    }
    const state = stateRef.current;
    // Clamped: a long frame on a software rasteriser would otherwise teleport
    // the whole field and read as a flicker.
    const delta = Math.min(rawDelta, 0.08);
    const t = performance.now() * 0.001;

    // The field follows the camera on the ground plane only. Tying it to
    // camera height as well would make the rain climb with the drone view.
    const cx = camera.position.x;
    const cz = camera.position.z;

    const { pos, phase, dummy } = state;
    const fall = profile.fall * delta;
    const sideways = profile.drift * wind * delta;

    for (let i = 0; i < count; i++) {
      const o = i * 3;
      pos[o + 1] -= fall;
      pos[o] += sideways;

      // Wrap through the box rather than respawning, so density is constant.
      if (pos[o + 1] < 0) {
        pos[o + 1] += FIELD.h;
        pos[o] = (Math.random() - 0.5) * FIELD.w;
        pos[o + 2] = (Math.random() - 0.5) * FIELD.d;
      }
      if (pos[o] > FIELD.w / 2) pos[o] -= FIELD.w;
      if (pos[o] < -FIELD.w / 2) pos[o] += FIELD.w;

      let wx = 0;
      let wz = 0;
      if (profile.flutter > 0) {
        const p = phase[i];
        wx = Math.sin(t * 1.3 + p) * profile.flutter;
        wz = Math.cos(t * 0.9 + p * 1.7) * profile.flutter;
      }

      dummy.position.set(cx + pos[o] + wx, pos[o + 1], cz + pos[o + 2] + wz);
      // Lean the streak into the wind so driven rain does not fall vertically
      // through a gale.
      dummy.rotation.set(0, 0, Math.atan2(profile.drift * wind, profile.fall) * 0.6);
      dummy.scale.set(1, profile.stretch, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (!profile || count === 0) return null;

  return (
    <instancedMesh
      key={`${kind}-${count}`}
      ref={meshRef}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <planeGeometry args={[profile.size, profile.size]} />
      <meshBasicMaterial
        color={profile.color}
        transparent
        opacity={profile.opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
