"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { WorldRefState } from "../types";

const WHEEL_RADIUS = 0.38;
// The vehicle drives toward -Z, so -Z is the nose: front axle first.
const WHEEL_POSITIONS: [number, number, number][] = [
  [-0.88, WHEEL_RADIUS, -1.32],
  [0.88, WHEEL_RADIUS, -1.32],
  [-0.88, WHEEL_RADIUS, 1.38],
  [0.88, WHEEL_RADIUS, 1.38],
];

const BODY = "#4d5647";
const BODY_DARK = "#454e42";
const TRIM = "#15181c";

/**
 * Inspection vehicle. The shape matters less than the motion: wheels that
 * actually roll and steer, a body that squats under acceleration and leans
 * into corners, and dust off the rear tyres. Static geometry reads as a
 * model; geometry that responds to the physics reads as a vehicle.
 */
export function InspectionVehicle({ world }: { world: React.RefObject<WorldRefState> }) {
  const bodyRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const spin = useRef(0);
  const lastSpeed = useRef(0);
  const pitch = useRef(0);
  const roll = useRef(0);
  const lastHeading = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const v = world.current.vehicle;

    // Wheels roll at the rate the body is actually travelling.
    spin.current += (v.speed / WHEEL_RADIUS) * delta;
    const yawRate = (v.heading - lastHeading.current) / Math.max(delta, 0.0001);
    lastHeading.current = v.heading;
    // Steering angle inferred from how fast the heading is changing.
    const steerAngle = THREE.MathUtils.clamp(yawRate * 0.42, -0.5, 0.5);

    for (let i = 0; i < 4; i++) {
      const w = wheelRefs.current[i];
      if (!w) continue;
      w.rotation.x = spin.current;
      w.rotation.y = i < 2 ? steerAngle : 0;
    }

    // Weight transfer: nose-down under braking, lean out of the turn.
    const accel = (v.speed - lastSpeed.current) / Math.max(delta, 0.0001);
    lastSpeed.current = v.speed;
    pitch.current = THREE.MathUtils.damp(pitch.current, THREE.MathUtils.clamp(-accel * 0.004, -0.05, 0.05), 6, delta);
    roll.current = THREE.MathUtils.damp(roll.current, THREE.MathUtils.clamp(yawRate * v.speed * 0.006, -0.07, 0.07), 6, delta);

    if (bodyRef.current) {
      bodyRef.current.rotation.x = pitch.current;
      bodyRef.current.rotation.z = roll.current;
    }
  });

  return (
    <group>
      <group ref={bodyRef}>
        {/* Lower body / chassis tub */}
        <RoundedBox args={[1.94, 0.72, 4.25]} radius={0.12} smoothness={4} position={[0, 0.72, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={BODY} roughness={0.42} metalness={0.35} envMapIntensity={1.15} />
        </RoundedBox>

        {/* Cabin greenhouse, inset so the shoulder line catches the sun */}
        <RoundedBox args={[1.7, 0.62, 2.1]} radius={0.1} smoothness={4} position={[0, 1.36, 0.22]} castShadow>
          <meshStandardMaterial color={BODY_DARK} roughness={0.4} metalness={0.32} envMapIntensity={1.15} />
        </RoundedBox>

        {/* Glazing */}
        <mesh position={[0, 1.4, -0.83]} rotation={[-0.34, 0, 0]} castShadow>
          <boxGeometry args={[1.56, 0.56, 0.05]} />
          <meshStandardMaterial color="#1b2530" roughness={0.06} metalness={0.2} envMapIntensity={2.2} />
        </mesh>
        <mesh position={[0, 1.4, 1.28]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.5, 0.5, 0.05]} />
          <meshStandardMaterial color="#1b2530" roughness={0.08} metalness={0.2} envMapIntensity={2.2} />
        </mesh>
        {[-0.86, 0.86].map((x) => (
          <mesh key={x} position={[x, 1.4, 0.25]}>
            <boxGeometry args={[0.04, 0.46, 1.7]} />
            <meshStandardMaterial color="#151c23" roughness={0.1} metalness={0.15} />
          </mesh>
        ))}

        {/* Roof rack + light bar */}
        <mesh position={[0, 1.7, 0.22]} castShadow>
          <boxGeometry args={[1.62, 0.06, 1.9]} />
          <meshStandardMaterial color={TRIM} roughness={0.7} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.78, -0.52]} castShadow>
          <boxGeometry args={[1.18, 0.1, 0.14]} />
          <meshStandardMaterial color="#0d1014" roughness={0.45} metalness={0.5} />
        </mesh>
        <mesh position={[0, 1.78, -0.6]}>
          <boxGeometry args={[1.02, 0.045, 0.02]} />
          <meshStandardMaterial color="#e8dcc0" emissive="#f4d79a" emissiveIntensity={0.28} />
        </mesh>

        {/* Bull bar, sills and arches */}
        <mesh position={[0, 0.58, -2.2]} castShadow>
          <boxGeometry args={[1.74, 0.34, 0.16]} />
          <meshStandardMaterial color="#6d7168" roughness={0.5} metalness={0.7} />
        </mesh>
        {[-0.98, 0.98].map((x) => (
          <mesh key={x} position={[x, 0.46, 0]} castShadow>
            <boxGeometry args={[0.1, 0.16, 3.4]} />
            <meshStandardMaterial color={TRIM} roughness={0.85} metalness={0.2} />
          </mesh>
        ))}

        {/* Headlights and tail lights */}
        {[-0.64, 0.64].map((x) => (
          <mesh key={x} position={[x, 0.86, -2.14]}>
            <boxGeometry args={[0.36, 0.16, 0.05]} />
            <meshStandardMaterial color="#eef5ff" emissive="#dce9ff" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        ))}
        {[-0.66, 0.66].map((x) => (
          <mesh key={x} position={[x, 0.88, 2.14]}>
            <boxGeometry args={[0.3, 0.12, 0.05]} />
            <meshStandardMaterial color="#5c1614" emissive="#ff3b2f" emissiveIntensity={0.7} toneMapped={false} />
          </mesh>
        ))}

        {/* Survey livery stripe */}
        {[-0.976, 0.976].map((x) => (
          <mesh key={x} position={[x, 0.78, 0]}>
            <boxGeometry args={[0.012, 0.1, 3.6]} />
            <meshStandardMaterial color="#35e0d0" emissive="#35e0d0" emissiveIntensity={0.35} toneMapped={false} />
          </mesh>
        ))}

        {/* Wheel arches. Flares are most of what separates a vehicle
            silhouette from a box on wheels. */}
        {WHEEL_POSITIONS.map(([wx, , wz], i) => (
          <mesh
            key={`arch-${i}`}
            position={[wx * 1.06, 0.62, wz]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.56, 0.56, 0.14, 16, 1, true, Math.PI, Math.PI]} />
            <meshStandardMaterial color={TRIM} roughness={0.8} metalness={0.15} side={THREE.DoubleSide} />
          </mesh>
        ))}

        {/* Door mirrors */}
        {[-1.06, 1.06].map((x) => (
          <group key={`mirror-${x}`} position={[x, 1.32, -0.52]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.05, 0.05]} />
              <meshStandardMaterial color={TRIM} roughness={0.6} metalness={0.3} />
            </mesh>
            <mesh position={[x > 0 ? 0.13 : -0.13, 0.03, 0]} castShadow>
              <boxGeometry args={[0.08, 0.14, 0.13]} />
              <meshStandardMaterial color={BODY_DARK} roughness={0.45} metalness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Roof survey pod: the sensor head this whole product is fed by —
            a spinning LiDAR can and a forward camera block. */}
        <group position={[0, 1.73, 0.55]}>
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.1, 0.42]} />
            <meshStandardMaterial color="#20252b" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.22, 16]} />
            <meshStandardMaterial color="#2c333a" roughness={0.35} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.135, 0.135, 0.07, 16]} />
            <meshStandardMaterial color="#0c1418" roughness={0.1} metalness={0.2} envMapIntensity={2.4} />
          </mesh>
          <mesh position={[0, 0.06, -0.26]} castShadow>
            <boxGeometry args={[0.26, 0.12, 0.12]} />
            <meshStandardMaterial color="#1a1f25" roughness={0.4} metalness={0.4} />
          </mesh>
        </group>
      </group>

      {WHEEL_POSITIONS.map((pos, i) => (
        <group
          key={i}
          position={pos}
          ref={(el) => {
            wheelRefs.current[i] = el;
          }}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 20]} />
            <meshStandardMaterial color="#0e1013" roughness={0.94} metalness={0.05} />
          </mesh>
          {/* Sidewall + rim so the wheel visibly rotates */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.155, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.03, 12]} />
            <meshStandardMaterial color="#7d838b" roughness={0.35} metalness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.155, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.03, 12]} />
            <meshStandardMaterial color="#7d838b" roughness={0.35} metalness={0.8} />
          </mesh>
          {/* Tread blocks catch the light as the wheel turns */}
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <mesh key={k} rotation={[(k / 6) * Math.PI * 2, 0, 0]} position={[0, 0, 0]}>
              <boxGeometry args={[0.31, 0.06, WHEEL_RADIUS * 2 - 0.02]} />
              <meshStandardMaterial color="#17191d" roughness={0.98} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

const DUST_COUNT = 34;

interface DustParticle {
  x: number;
  y: number;
  z: number;
  life: number;
  ttl: number;
  size: number;
  drift: number;
}

/** Dust kicked off the rear tyres, in world space so it lags behind properly. */
export function VehicleDust({ world, active }: { world: React.RefObject<WorldRefState>; active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // The pool is allocated on the first frame and mutated in place from then on.
  // It deliberately never passes through a hook argument: this is per-frame
  // scratch state for the render loop, not React state.
  const poolRef = useRef<DustParticle[]>([]);
  const spawnTimer = useRef(0);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (poolRef.current.length === 0) {
      poolRef.current = Array.from({ length: DUST_COUNT }, () => ({
        x: 0,
        y: -10,
        z: 0,
        life: 0,
        ttl: 1,
        size: 0,
        drift: 0,
      }));
    }
    const particles = poolRef.current;
    const delta = Math.min(rawDelta, 0.1);
    const v = world.current.vehicle;
    const speed = Math.abs(v.speed);

    spawnTimer.current -= delta;
    if (active && speed > 1.6 && spawnTimer.current <= 0) {
      spawnTimer.current = 0.045;
      const p = particles.find((q) => q.life <= 0);
      if (p) {
        const side = Math.random() > 0.5 ? 0.9 : -0.9;
        // Behind the rear axle, in the vehicle's own frame.
        const bx = Math.sin(v.heading) * -1.5 + Math.cos(v.heading) * side;
        const bz = -Math.cos(v.heading) * -1.5 - Math.sin(v.heading) * side;
        p.x = v.x + bx;
        p.z = v.z + bz;
        p.y = 0.12;
        p.ttl = 0.9 + Math.random() * 0.7;
        p.life = p.ttl;
        p.size = 0.1 + Math.random() * 0.14;
        p.drift = (Math.random() - 0.5) * 0.6;
      }
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life > 0) {
        p.life -= delta;
        p.y += delta * 0.55;
        p.x += p.drift * delta;
        const t = 1 - p.life / p.ttl;
        // Puff out from nothing, then keep expanding as it thins.
        const s = p.size * (0.25 + t * 2.6) * Math.min(1, t * 6);
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(s);
      } else {
        dummy.position.set(0, -50, 0);
        dummy.scale.setScalar(0);
      }
      dummy.rotation.set(0, i * 1.7, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, DUST_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[0.5, 6, 5]} />
      <meshBasicMaterial color="#bcae95" transparent opacity={0.055} depthWrite={false} />
    </instancedMesh>
  );
}
