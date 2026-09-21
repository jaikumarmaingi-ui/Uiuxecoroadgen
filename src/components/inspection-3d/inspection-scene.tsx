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
import { EffectComposer, Bloom, Vignette, SSAO, SMAA } from "@react-three/postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { RoadSegment } from "@/lib/types";
import { RISK_META } from "@/lib/risk";
import { PavementCrossSection } from "./pavement-cross-section";
import { Atmosphere } from "./scene/atmosphere";
import { CorridorEnvironment } from "./scene/corridor-environment";
import { InspectionVehicle, VehicleDust } from "./scene/vehicle";
import { BENCH_HALF, ROAD_CAMBER, ROAD_WIDTH_M } from "@/lib/inspection-3d/terrain";
import { LAYER_EXPLODE_RISE } from "./pavement-layers";
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

// Vertical midpoint of the exploded stack once it has lifted clear of the pit
// (see LAYER_EXPLODE_RISE) — used to frame the cross-section camera and to
// aim the orbit target. Both stay above ground, so the camera never ends up
// under the terrain looking out through it.
const STACK_MID_Y = LAYER_EXPLODE_RISE * 0.5;
/** Aim point while the core is still collapsed in the pit. */
const PIT_TOP_Y = 0.3;

const BASE_FOV = 52;

/** Height of the cambered carriageway at a given offset from the centreline. */
function roadSurfaceY(x: number): number {
  const nx = THREE.MathUtils.clamp(x / (ROAD_WIDTH_M / 2), -1, 1);
  return 0.05 + ROAD_CAMBER * (1 - nx * nx);
}

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
  const framedPit = useRef(false);
  const framedExploded = useRef(false);
  // Damped camera aim. Snapping `lookAt` straight onto a moving target is what
  // makes a chase camera feel robotic; easing the aim point is what makes it
  // feel like a camera operator riding along.
  const lookTarget = useRef(new THREE.Vector3(0, 1, START_Z - 10));
  const camShake = useRef(0);

  const driveable = flow === "driving" || flow === "approaching";
  const walkable = flow === "onfoot";
  const showVehicle = flow !== "intro";
  const showCharacter = flow === "onfoot" || flow === "inspecting" || flow === "exploded" || flow === "analyzing" || flow === "results";
  const pitActive = flow === "inspecting" || flow === "exploded" || flow === "analyzing" || flow === "results";
  const exploded = flow === "exploded" || flow === "analyzing" || flow === "results";
  const interactiveLayers = flow === "exploded" || flow === "results";
  const orbitEnabled = flow === "onfoot" || flow === "inspecting" || flow === "exploded" || flow === "results";
  const riskColor = RISK_META[segment.riskLevel].color;
  // Scaled well below 1: this drives hairline cracking density in the road
  // texture, and even a critical segment is not a shattered carriageway.
  const distress = Math.min(0.5, Math.max(0.15, segment.distress.cracking / 200));

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
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
      vehicleRef.current.position.set(v.x, roadSurfaceY(v.x), v.z);
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
      characterRef.current.position.set(w.character.x, roadSurfaceY(w.character.x), w.character.z);
      characterRef.current.rotation.y = w.character.heading;
      characterRef.current.visible = showCharacter;
    }

    // ------------------------------------------------------------ camera ---
    const camera = state.camera as THREE.PerspectiveCamera;
    let desiredFov = BASE_FOV;

    if (flow === "intro") {
      // Slow establishing arc down the corridor.
      const t = state.clock.elapsedTime * 0.055;
      const desired = new THREE.Vector3(Math.sin(t) * 22 - 3, 7.5 + Math.sin(t * 1.7) * 1.6, START_Z + Math.cos(t) * 22 - 14);
      camera.position.lerp(desired, 1 - Math.pow(0.12, delta));
      lookTarget.current.lerp(new THREE.Vector3(0, 1.4, START_Z - 22), 1 - Math.pow(0.05, delta));
      desiredFov = 48;
    } else if (driveable) {
      const speedT = Math.min(1, Math.abs(v.speed) / MAX_SPEED);
      // Chase camera pulls back and drops as speed builds.
      const dist = 8.8 + speedT * 2.4;
      const behind = new THREE.Vector3(Math.sin(v.heading), 0, -Math.cos(v.heading)).multiplyScalar(-dist);
      const desired = new THREE.Vector3(v.x + behind.x, roadSurfaceY(v.x) + 3.45 - speedT * 0.4, v.z + behind.z);
      // Critically-damped follow: firm enough to keep up, soft enough to lag
      // slightly through a steering input.
      camera.position.lerp(desired, 1 - Math.pow(0.0016, delta));

      const ahead = 9 + speedT * 7;
      const aim = new THREE.Vector3(
        v.x + Math.sin(v.heading) * ahead,
        roadSurfaceY(v.x) + 1.1,
        v.z - Math.cos(v.heading) * ahead,
      );
      lookTarget.current.lerp(aim, 1 - Math.pow(0.002, delta));

      // Speed widens the lens — the oldest trick for conveying velocity.
      desiredFov = BASE_FOV + speedT * 8;
      // Surface rumble, scaled by speed.
      camShake.current += delta * (6 + speedT * 22);
      camera.position.y += Math.sin(camShake.current) * 0.012 * speedT;
      camera.position.x += Math.cos(camShake.current * 1.7) * 0.008 * speedT;
    } else if (flow === "parked") {
      const desired = new THREE.Vector3(v.x + 4.6, roadSurfaceY(v.x) + 2.5, v.z + 4.2);
      camera.position.lerp(desired, 1 - Math.pow(0.0018, delta));
      lookTarget.current.lerp(new THREE.Vector3(v.x - 0.8, 1.0, v.z - 1.6), 1 - Math.pow(0.004, delta));
      desiredFov = 46;
    }

    if (flow === "intro" || driveable || flow === "parked") {
      camera.lookAt(lookTarget.current);
    }

    if (Math.abs(camera.fov - desiredFov) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, desiredFov, 3, delta);
      camera.updateProjectionMatrix();
    }

    if (exploded && !framedExploded.current) {
      // The stack is four metres tall once it lifts; pull back and up so the
      // whole cake is in shot rather than growing out of the top of frame.
      camera.position.set(PIT_POSITION[0] + 3.6, STACK_MID_Y + 2.4, PIT_POSITION[2] + 8.4);
      framedExploded.current = true;
    } else if (!exploded) {
      framedExploded.current = false;
    }

    if (flow === "inspecting" && !framedPit.current) {
      // Standing eye-height, slightly off-axis: a side elevation of the core
      // in its pit, which then reads as a layer cake once it lifts out.
      camera.position.set(PIT_POSITION[0] + 2.3, 2.3, PIT_POSITION[2] + 5.2);
      framedPit.current = true;
    } else if (!pitActive) {
      framedPit.current = false;
    }

    if (controlsRef.current) {
      if (flow === "onfoot") {
        controlsRef.current.target.set(w.character.x, 1.1, w.character.z);
      } else if (pitActive) {
        // Rides up with the stack as it lifts, so the framing follows the
        // animation instead of cutting to it.
        const aimY = THREE.MathUtils.damp(
          controlsRef.current.target.y,
          exploded ? STACK_MID_Y : PIT_TOP_Y,
          4.5,
          delta,
        );
        controlsRef.current.target.set(PIT_POSITION[0], aimY, PIT_POSITION[2]);
      }
      controlsRef.current.update();
    }

    if (flow === "analyzing" && scanRef.current) {
      scanT.current += delta * 0.9;
      // Sweep the full height of the lifted stack.
      const y = STACK_MID_Y + Math.sin(scanT.current * 2.4) * (LAYER_EXPLODE_RISE * 0.6);
      scanRef.current.position.set(PIT_POSITION[0], y, PIT_POSITION[2]);
      const mat = scanRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(scanT.current * 8) * 0.1;
    }
  });

  return (
    <>
      <Atmosphere />

      <CorridorEnvironment distress={distress} />
      <CorridorSign segment={segment} riskColor={riskColor} />

      <DefectMarker
        visible={flow !== "inspecting" && flow !== "exploded" && flow !== "analyzing" && flow !== "results"}
        color={riskColor}
        probabilityPct={segment.probabilityOfFailurePct}
      />

      <group ref={vehicleRef} visible={showVehicle}>
        <InspectionVehicle world={world} />
      </group>
      <VehicleDust world={world} active={showVehicle && driveable} />

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
          <ringGeometry args={[0.15, 2.4, 48]} />
          <meshBasicMaterial color="#35e0d0" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {orbitEnabled && (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={18}
          maxPolarAngle={1.45}
        />
      )}

      <EffectComposer multisampling={0} enableNormalPass>
        {/* Contact darkening in the creases the shadow map is too coarse for:
            under the vehicle, the toe of the cut face, inside the trial pit. */}
        <SSAO
          samples={16}
          rings={4}
          radius={0.18}
          intensity={18}
          luminanceInfluence={0.55}
          distanceThreshold={0.4}
          distanceFalloff={0.12}
          // Half-resolution: AO is a low-frequency signal, and this is by far
          // the most expensive pass in the composer.
          resolutionScale={0.5}
        />
        <Bloom luminanceThreshold={0.82} luminanceSmoothing={0.22} intensity={0.3} mipmapBlur radius={0.6} />
        <Vignette eskil={false} offset={0.26} darkness={0.5} />
        <SMAA />
      </EffectComposer>
    </>
  );
}

/** Roadside chainage board on the cliff-side shoulder. */
function CorridorSign({ segment, riskColor }: { segment: RoadSegment; riskColor: string }) {
  const x = -(ROAD_WIDTH_M / 2 + (BENCH_HALF - ROAD_WIDTH_M / 2) * 0.55);
  const z = START_Z - 4;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.06, 1.8, 8]} />
        <meshStandardMaterial color="#8a8f95" roughness={0.55} metalness={0.65} />
      </mesh>
      <mesh position={[0, 2.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.66, 0.05]} />
        <meshStandardMaterial color="#121820" roughness={0.45} metalness={0.25} />
      </mesh>
      <Html position={[0, 2.05, 0.04]} center distanceFactor={14} occlude>
        <div
          className="pointer-events-none whitespace-nowrap rounded border px-2.5 py-1 font-mono-tech text-[10px] font-bold uppercase tracking-wide"
          style={{ borderColor: `${riskColor}88`, color: riskColor, background: "rgba(9,13,17,0.72)" }}
        >
          {segment.routeNumber} · {segment.segmentLabel}
        </div>
      </Html>
    </group>
  );
}

function DefectMarker({
  visible,
  color,
  probabilityPct,
}: {
  visible: boolean;
  color: string;
  probabilityPct: number;
}) {
  const ping1 = useRef<THREE.Mesh>(null);
  const ping2 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (const [ref, phase] of [
      [ping1, 0],
      [ping2, 1.1],
    ] as const) {
      const mesh = ref.current;
      if (!mesh) continue;
      const cycle = ((t + phase) % 2.2) / 2.2;
      const s = 0.35 + cycle * 0.9;
      mesh.scale.set(s, s, s);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 * (1 - cycle);
    }
  });

  if (!visible) return null;
  return (
    <group position={[PIT_POSITION[0], 0.075, DEFECT_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.05, 32]} />
        <meshStandardMaterial color="#0b0d10" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ping1} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.94, 0.98, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ping2} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.94, 0.98, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Html position={[0, 1.35, 0]} center distanceFactor={12}>
        <div
          className="pointer-events-none whitespace-nowrap rounded border px-2 py-1 font-mono-tech text-[10px] font-semibold uppercase tracking-wider shadow-lg"
          style={{ borderColor: `${color}55`, color, background: "rgba(8,12,16,0.88)" }}
        >
          Flagged Defect · {probabilityPct}% Failure Risk
        </div>
      </Html>
    </group>
  );
}

function CharacterMesh() {
  // Subtle idle sway so the figure doesn't read as a mannequin.
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.2) * 0.012;
  });
  const hiVis = useMemo(() => new THREE.Color("#f0b93d"), []);
  return (
    <group ref={ref}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.19, 1.0, 10]} />
        <meshStandardMaterial color="#2a2e34" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.5, 6, 12]} />
        <meshStandardMaterial color="#333a33" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.262, 0.262, 0.42, 14, 1, true]} />
        <meshStandardMaterial color="#c98a2b" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.66, 0]} castShadow>
        <sphereGeometry args={[0.17, 14, 14]} />
        <meshStandardMaterial color="#caa27c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.79, 0]} castShadow>
        <sphereGeometry args={[0.19, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
        <meshStandardMaterial color={hiVis} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.735, 0]}>
        <cylinderGeometry args={[0.205, 0.205, 0.03, 18]} />
        <meshStandardMaterial color="#d9a02f" roughness={0.4} />
      </mesh>
    </group>
  );
}
