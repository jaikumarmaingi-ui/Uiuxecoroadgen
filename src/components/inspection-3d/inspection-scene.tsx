"use client";

/* eslint-disable react-hooks/immutability --
 * This scene mutates a shared `world` ref (vehicle/character position, heading, speed)
 * every animation frame inside useFrame to drive the drive/walk physics for the
 * react-three-fiber render loop. It is intentionally never routed through React state —
 * doing so would re-render on every frame and break the 60fps loop. The mutated value is
 * a ref (its identity never changes, and it is only ever written outside React's render
 * phase, inside useFrame/event-handler callbacks), which is exactly the imperative escape
 * hatch refs exist for: https://react.dev/learn/referencing-values-with-refs
 */

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { RoadSegment } from "@/lib/types";
import { RISK_META } from "@/lib/risk";
import { PavementCrossSection } from "./pavement-cross-section";
import {
  APPROACH_RANGE,
  DEFECT_Z,
  PARK_HEADING,
  PARK_X,
  PARK_Z,
  PIT_POSITION,
  ROAD_HALF_DRIVABLE,
  START_Z,
  type FlowState,
  type WorldRefState,
} from "./types";

const MAX_SPEED = 11;
const MAX_REVERSE = 4;
const ACCEL = 9;
const BRAKE = 15;
const FRICTION = 5;
const TURN_RATE = 1.55;
const WALK_SPEED = 3.4;
const WALK_BOUNDS = { minX: -7, maxX: 6, minZ: DEFECT_Z - 9, maxZ: PARK_Z + 5 };

export function InspectionScene({
  flow,
  world,
  keys,
  segment,
  selectedLayer,
  onApproach,
  onSelectLayer,
}: {
  flow: FlowState;
  world: React.RefObject<WorldRefState>;
  keys: React.RefObject<Set<string>>;
  segment: RoadSegment;
  selectedLayer: number | null;
  onApproach: () => void;
  onSelectLayer: (index: number) => void;
}) {
  const vehicleRef = useRef<THREE.Group>(null);
  const characterRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const scanT = useRef(0);

  const driveable = flow === "driving" || flow === "approaching";
  const walkable = flow === "onfoot";
  const showVehicle = flow !== "intro";
  const showCharacter = flow === "onfoot" || flow === "inspecting" || flow === "exploded" || flow === "analyzing" || flow === "results";
  const pitActive = flow === "inspecting" || flow === "exploded" || flow === "analyzing" || flow === "results";
  const exploded = flow === "exploded" || flow === "analyzing" || flow === "results";
  const interactiveLayers = flow === "exploded" || flow === "results";
  const orbitEnabled = flow === "onfoot" || flow === "inspecting" || flow === "exploded" || flow === "results";

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const w = world.current;
    const v = w.vehicle;
    const keySet = keys.current;

    if (driveable) {
      let accel = 0;
      if (keySet.has("w") || keySet.has("arrowup")) accel = 1;
      if (keySet.has("s") || keySet.has("arrowdown")) accel = -1;
      let steer = 0;
      if (keySet.has("a") || keySet.has("arrowleft")) steer = 1;
      if (keySet.has("d") || keySet.has("arrowright")) steer = -1;

      if (accel > 0) v.speed = Math.min(MAX_SPEED, v.speed + ACCEL * delta);
      else if (accel < 0) v.speed = Math.max(-MAX_REVERSE, v.speed - BRAKE * delta);
      else if (v.speed > 0) v.speed = Math.max(0, v.speed - FRICTION * delta);
      else if (v.speed < 0) v.speed = Math.min(0, v.speed + FRICTION * delta);

      if (Math.abs(v.speed) > 0.05) {
        const dirSign = v.speed > 0 ? 1 : -1;
        v.heading += steer * TURN_RATE * delta * dirSign * Math.min(1, Math.abs(v.speed) / 4);
      }

      v.x += Math.sin(v.heading) * v.speed * delta;
      v.z -= Math.cos(v.heading) * v.speed * delta;
      v.x = THREE.MathUtils.clamp(v.x, -ROAD_HALF_DRIVABLE, ROAD_HALF_DRIVABLE);

      if (flow === "driving" && v.z <= DEFECT_Z + APPROACH_RANGE) {
        onApproach();
      }
    } else if (flow === "parked" && !w.parked) {
      v.x = THREE.MathUtils.damp(v.x, PARK_X, 4, delta);
      v.z = THREE.MathUtils.damp(v.z, PARK_Z, 4, delta);
      v.heading = THREE.MathUtils.damp(v.heading, PARK_HEADING, 4, delta);
      v.speed = THREE.MathUtils.damp(v.speed, 0, 6, delta);
      if (Math.abs(v.x - PARK_X) < 0.04 && Math.abs(v.z - PARK_Z) < 0.04) w.parked = true;
    }

    if (vehicleRef.current) {
      vehicleRef.current.position.set(v.x, 0, v.z);
      vehicleRef.current.rotation.y = v.heading;
    }

    if (walkable) {
      const c = w.character;
      let mx = 0;
      let mz = 0;
      if (keySet.has("w") || keySet.has("arrowup")) mz -= 1;
      if (keySet.has("s") || keySet.has("arrowdown")) mz += 1;
      if (keySet.has("a") || keySet.has("arrowleft")) mx -= 1;
      if (keySet.has("d") || keySet.has("arrowright")) mx += 1;
      const len = Math.hypot(mx, mz);
      if (len > 0.001) {
        mx /= len;
        mz /= len;
        c.x = THREE.MathUtils.clamp(c.x + mx * WALK_SPEED * delta, WALK_BOUNDS.minX, WALK_BOUNDS.maxX);
        c.z = THREE.MathUtils.clamp(c.z + mz * WALK_SPEED * delta, WALK_BOUNDS.minZ, WALK_BOUNDS.maxZ);
        c.heading = Math.atan2(mx, -mz);
      }
    }
    if (characterRef.current) {
      characterRef.current.position.set(w.character.x, 0, w.character.z);
      characterRef.current.rotation.y = w.character.heading;
      characterRef.current.visible = showCharacter;
    }

    // camera
    const camera = state.camera;
    if (flow === "intro") {
      const t = state.clock.elapsedTime * 0.06;
      camera.position.lerp(new THREE.Vector3(Math.sin(t) * 26, 12, START_Z + Math.cos(t) * 26 - 10), 0.02);
      camera.lookAt(0, 1, START_Z - 10);
    } else if (driveable) {
      const behind = new THREE.Vector3(Math.sin(v.heading), 0, -Math.cos(v.heading)).multiplyScalar(-8);
      const desired = new THREE.Vector3(v.x + behind.x, 3.4, v.z + behind.z);
      camera.position.lerp(desired, 1 - Math.pow(0.0008, delta));
      const lookAhead = new THREE.Vector3(v.x + Math.sin(v.heading) * 6, 1, v.z - Math.cos(v.heading) * 6);
      camera.lookAt(lookAhead);
    } else if (flow === "parked") {
      const desired = new THREE.Vector3(v.x + 4.2, 2.6, v.z + 3.6);
      camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
      camera.lookAt(v.x - 0.6, 1, v.z - 1.5);
    }

    if (controlsRef.current) {
      if (flow === "onfoot") {
        controlsRef.current.target.set(w.character.x, 1.1, w.character.z);
      } else if (pitActive) {
        controlsRef.current.target.set(PIT_POSITION[0], -0.4, PIT_POSITION[2]);
      }
      controlsRef.current.update();
    }

    if (flow === "analyzing" && scanRef.current) {
      scanT.current += delta * 0.9;
      const y = -0.6 + Math.sin(scanT.current * 2.4) * 1.6;
      scanRef.current.position.set(PIT_POSITION[0], y, PIT_POSITION[2]);
      const mat = scanRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(scanT.current * 8) * 0.15;
    }
  });

  return (
    <>
      <color attach="background" args={["#060a10"]} />
      <fog attach="fog" args={["#060a10", 30, 130]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={["#6f8faf", "#0c0f14", 0.6]} />
      <directionalLight position={[24, 30, 10]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40, 1, 100]} />
      </directionalLight>

      <RoadEnvironment segment={segment} />
      <DefectMarker visible={flow !== "inspecting" && flow !== "exploded" && flow !== "analyzing" && flow !== "results"} />

      <group ref={vehicleRef} visible={showVehicle}>
        <VehicleMesh />
      </group>

      <group ref={characterRef}>
        <CharacterMesh />
      </group>

      {pitActive && (
        <PavementCrossSection
          segment={segment}
          position={PIT_POSITION}
          exploded={exploded}
          interactive={interactiveLayers}
          selectedLayer={selectedLayer}
          onSelectLayer={onSelectLayer}
        />
      )}

      {flow === "analyzing" && (
        <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 2.6, 48]} />
          <meshBasicMaterial color="#35e0d0" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {orbitEnabled && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.5}
          maxDistance={16}
          maxPolarAngle={Math.PI / 2 - 0.03}
        />
      )}
    </>
  );
}

function RoadEnvironment({ segment }: { segment: RoadSegment }) {
  const riskColor = RISK_META[segment.riskLevel].color;

  const props = useMemo(() => {
    const rng = mulberry32(7);
    const items: { x: number; z: number; scale: number; kind: "tree" | "rock"; hue: number }[] = [];
    for (let i = 0; i < 46; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (4.2 + rng() * 9);
      const z = START_Z - rng() * (START_Z - DEFECT_Z + 40);
      items.push({ x, z, scale: 0.6 + rng() * 0.9, kind: rng() > 0.35 ? "rock" : "tree", hue: rng() });
    }
    return items;
  }, []);

  const dashes = useMemo(() => {
    const arr: number[] = [];
    for (let z = START_Z - 4; z > DEFECT_Z - 30; z -= 3.2) arr.push(z);
    return arr;
  }, []);

  const mountains = useMemo(() => {
    const rng = mulberry32(3);
    return Array.from({ length: 10 }, (_, i) => ({
      x: (i - 4.5) * 22 + rng() * 10,
      z: DEFECT_Z - 70 - rng() * 40,
      h: 16 + rng() * 20,
      r: 10 + rng() * 8,
    }));
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#171c16" roughness={1} />
      </mesh>

      <mesh position={[0, -0.1, (START_Z + DEFECT_Z - 40) / 2]} receiveShadow>
        <boxGeometry args={[6, 0.2, START_Z - DEFECT_Z + 70]} />
        <meshStandardMaterial color="#23272c" roughness={0.9} />
      </mesh>

      {dashes.map((z, i) => (
        <mesh key={i} position={[0, 0.01, z]}>
          <boxGeometry args={[0.15, 0.01, 1.4]} />
          <meshStandardMaterial color="#d7dee3" emissive="#8a939a" emissiveIntensity={0.15} />
        </mesh>
      ))}

      {props.map((p, i) =>
        p.kind === "tree" ? (
          <group key={i} position={[p.x, 0, p.z]} scale={p.scale}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.12, 1, 6]} />
              <meshStandardMaterial color="#3d2c1f" />
            </mesh>
            <mesh position={[0, 1.15, 0]} castShadow>
              <coneGeometry args={[0.55, 1.3, 7]} />
              <meshStandardMaterial color={p.hue > 0.5 ? "#274d33" : "#2f5c3d"} />
            </mesh>
          </group>
        ) : (
          <mesh key={i} position={[p.x, 0.25 * p.scale, p.z]} scale={p.scale} castShadow>
            <dodecahedronGeometry args={[0.4, 0]} />
            <meshStandardMaterial color="#5a5b57" roughness={1} flatShading />
          </mesh>
        ),
      )}

      {mountains.map((m, i) => (
        <mesh key={i} position={[m.x, m.h * 0.3, m.z]}>
          <coneGeometry args={[m.r, m.h, 5]} />
          <meshStandardMaterial color="#3a4450" roughness={1} flatShading />
        </mesh>
      ))}

      <mesh position={[3.6, 1.6, START_Z - 2]}>
        <boxGeometry args={[0.1, 1.4, 0.4]} />
        <meshStandardMaterial color="#1a1f25" />
      </mesh>
      <Html position={[3.6, 2.5, START_Z - 2]} center distanceFactor={14}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ borderColor: riskColor, color: riskColor, background: "rgba(10,15,22,0.85)" }}>
          {segment.routeNumber} · {segment.segmentLabel}
        </div>
      </Html>
    </group>
  );
}

function DefectMarker({ visible }: { visible: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.12;
    ringRef.current.scale.set(s, s, s);
  });
  if (!visible) return null;
  return (
    <group position={[-4.4, 0.02, DEFECT_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 24]} />
        <meshStandardMaterial color="#15171a" roughness={1} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.35, 1.55, 32]} />
        <meshBasicMaterial color="#ff4d4d" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[0, 1.6, 0]} center distanceFactor={12}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border border-critical/50 bg-critical/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-critical shadow-lg">
          Defect flagged
        </div>
      </Html>
    </group>
  );
}

function VehicleMesh() {
  return (
    <group>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[1.9, 0.68, 3.9]} />
        <meshStandardMaterial color="#c3c9ce" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.1, -0.35]} castShadow>
        <boxGeometry args={[1.6, 0.5, 1.9]} />
        <meshStandardMaterial color="#161b20" roughness={0.3} metalness={0.4} />
      </mesh>
      {[
        [-0.85, 0.36, 1.3],
        [0.85, 0.36, 1.3],
        [-0.85, 0.36, -1.3],
        [0.85, 0.36, -1.3],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.28, 14]} />
          <meshStandardMaterial color="#101214" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[-0.55, 0.78, 1.92]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#fff1c2" emissive="#ffe27a" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.55, 0.78, 1.92]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#fff1c2" emissive="#ffe27a" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function CharacterMesh() {
  return (
    <group>
      <mesh position={[0, 0.95, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.8, 4, 8]} />
        <meshStandardMaterial color="#35e0d0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.19, 12, 12]} />
        <meshStandardMaterial color="#e7c19c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.3, 0.18]}>
        <boxGeometry args={[0.3, 0.14, 0.1]} />
        <meshStandardMaterial color="#f0b93d" emissive="#f0b93d" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

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
