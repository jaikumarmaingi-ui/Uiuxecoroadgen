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
import { OrbitControls, Html, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
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

// Roughly the vertical midpoint of the fully exploded 5-layer pavement stack
// (see LAYER_THICKNESS/LAYER_EXPLODE_GAP in pavement-layers.ts) — used to
// frame the cross-section camera and orbit target.
const PIT_MID_Y = -1.68;

const SKY_TOP = "#0a1018";
const SKY_HORIZON = "#232f3a";
const FOG_COLOR = "#1b242d";

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

  const driveable = flow === "driving" || flow === "approaching";
  const walkable = flow === "onfoot";
  const showVehicle = flow !== "intro";
  const showCharacter = flow === "onfoot" || flow === "inspecting" || flow === "exploded" || flow === "analyzing" || flow === "results";
  const pitActive = flow === "inspecting" || flow === "exploded" || flow === "analyzing" || flow === "results";
  const exploded = flow === "exploded" || flow === "analyzing" || flow === "results";
  const interactiveLayers = flow === "exploded" || flow === "results";
  const orbitEnabled = flow === "onfoot" || flow === "inspecting" || flow === "exploded" || flow === "results";
  const riskColor = RISK_META[segment.riskLevel].color;

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

    if (flow === "inspecting" && !framedPit.current) {
      // Side-on "layer cake" elevation so the exploded stack reads as a
      // cross-section rather than being foreshortened from directly above.
      camera.position.set(PIT_POSITION[0] + 0.9, PIT_MID_Y + 1.1, PIT_POSITION[2] + 5.4);
      framedPit.current = true;
    } else if (!pitActive) {
      framedPit.current = false;
    }

    if (controlsRef.current) {
      if (flow === "onfoot") {
        controlsRef.current.target.set(w.character.x, 1.1, w.character.z);
      } else if (pitActive) {
        controlsRef.current.target.set(PIT_POSITION[0], PIT_MID_Y, PIT_POSITION[2]);
      }
      controlsRef.current.update();
    }

    if (flow === "analyzing" && scanRef.current) {
      scanT.current += delta * 0.9;
      const y = -0.6 + Math.sin(scanT.current * 2.4) * 1.6;
      scanRef.current.position.set(PIT_POSITION[0], y, PIT_POSITION[2]);
      const mat = scanRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(scanT.current * 8) * 0.1;
    }
  });

  return (
    <>
      <GradientSky />
      <fog attach="fog" args={[FOG_COLOR, 26, 120]} />
      <ambientLight intensity={0.38} />
      <hemisphereLight args={["#4a5c6e", "#0e1216", 0.45]} />
      <directionalLight position={[26, 34, 14]} intensity={1.05} color="#e6edf5" castShadow shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40, 1, 100]} />
      </directionalLight>
      <directionalLight position={[-18, 10, -22]} intensity={0.18} color="#35e0d0" />

      <RoadEnvironment segment={segment} />
      <DefectMarker
        visible={flow !== "inspecting" && flow !== "exploded" && flow !== "analyzing" && flow !== "results"}
        color={riskColor}
        probabilityPct={segment.probabilityOfFailurePct}
      />

      <group ref={vehicleRef} visible={showVehicle}>
        <VehicleMesh />
      </group>

      <group ref={characterRef}>
        <CharacterMesh />
      </group>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={30} blur={2.2} far={4} resolution={256} color="#000000" />

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
          minDistance={2.5}
          maxDistance={16}
          maxPolarAngle={Math.PI / 2 - 0.03}
        />
      )}

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.42} luminanceSmoothing={0.9} intensity={0.55} mipmapBlur radius={0.55} />
        <Vignette eskil={false} offset={0.22} darkness={0.55} />
      </EffectComposer>
    </>
  );
}

function GradientSky() {
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color(SKY_TOP) },
      bottomColor: { value: new THREE.Color(SKY_HORIZON) },
      offset: { value: 8 },
      exponent: { value: 0.6 },
    }),
    [],
  );
  return (
    <mesh>
      <sphereGeometry args={[240, 24, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float offset;
          uniform float exponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
          }
        `}
      />
    </mesh>
  );
}

function RoadEnvironment({ segment }: { segment: RoadSegment }) {
  const riskColor = RISK_META[segment.riskLevel].color;

  const rocks = useMemo(() => {
    const rng = mulberry32(11);
    const items: { x: number; z: number; scale: number; shade: number; tall: number }[] = [];
    for (let i = 0; i < 28; i++) {
      const side = rng() > 0.5 ? 1 : -1;
      const x = side * (4.4 + rng() * 10);
      const z = START_Z - rng() * (START_Z - DEFECT_Z + 40);
      items.push({ x, z, scale: 0.4 + rng() * 0.8, shade: rng(), tall: 0.7 + rng() * 0.9 });
    }
    return items;
  }, []);

  const scrub = useMemo(() => {
    const rng = mulberry32(23);
    return Array.from({ length: 10 }, () => {
      const side = rng() > 0.5 ? 1 : -1;
      return {
        x: side * (3.6 + rng() * 6),
        z: START_Z - rng() * (START_Z - DEFECT_Z + 40),
        h: 0.2 + rng() * 0.3,
      };
    });
  }, []);

  const dashes = useMemo(() => {
    const arr: number[] = [];
    for (let z = START_Z - 4; z > DEFECT_Z - 30; z -= 3.2) arr.push(z);
    return arr;
  }, []);

  const ridge = useMemo(() => {
    const rng = mulberry32(3);
    return Array.from({ length: 12 }, (_, i) => {
      const h = 18 + rng() * 26;
      return {
        x: (i - 5.5) * 20 + rng() * 10,
        z: DEFECT_Z - 75 - rng() * 45,
        h,
        rx: 9 + rng() * 7,
        rz: 9 + rng() * 7,
        snow: h > 30,
      };
    });
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#23231e" roughness={1} />
      </mesh>

      <mesh position={[0, -0.1, (START_Z + DEFECT_Z - 40) / 2]} receiveShadow>
        <boxGeometry args={[6, 0.2, START_Z - DEFECT_Z + 70]} />
        <meshStandardMaterial color="#22262a" roughness={0.92} />
      </mesh>

      {dashes.map((z, i) => (
        <mesh key={i} position={[0, 0.01, z]}>
          <boxGeometry args={[0.15, 0.01, 1.4]} />
          <meshStandardMaterial color="#c4cbd1" emissive="#6b747c" emissiveIntensity={0.1} />
        </mesh>
      ))}

      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, 0.22 * r.scale * r.tall, r.z]}
          scale={[r.scale, r.scale * r.tall, r.scale]}
          rotation={[0, r.shade * 6, 0]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial
            color={new THREE.Color("#4a4741").lerp(new THREE.Color("#615c52"), r.shade)}
            roughness={1}
            flatShading
          />
        </mesh>
      ))}

      {scrub.map((s, i) => (
        <mesh key={i} position={[s.x, s.h / 2, s.z]} castShadow>
          <cylinderGeometry args={[0.015, 0.03, s.h, 4]} />
          <meshStandardMaterial color="#3a382e" roughness={1} />
        </mesh>
      ))}

      {ridge.map((m, i) => (
        <group key={i} position={[m.x, 0, m.z]}>
          <mesh position={[0, m.h * 0.32, 0]} scale={[m.rx / 10, m.h / 10, m.rz / 10]}>
            <icosahedronGeometry args={[10, 0]} />
            <meshStandardMaterial color="#333c47" roughness={1} flatShading />
          </mesh>
          {m.snow && (
            <mesh position={[0, m.h * 0.62, 0]} scale={[(m.rx * 0.32) / 10, (m.h * 0.24) / 10, (m.rz * 0.32) / 10]}>
              <icosahedronGeometry args={[10, 0]} />
              <meshStandardMaterial color="#d7dee3" roughness={0.85} flatShading />
            </mesh>
          )}
        </group>
      ))}

      <mesh position={[3.6, 0.9, START_Z - 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 8]} />
        <meshStandardMaterial color="#1a1f25" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[3.6, 2.05, START_Z - 2]}>
        <boxGeometry args={[1.5, 0.66, 0.04]} />
        <meshStandardMaterial color="#10151b" roughness={0.5} metalness={0.2} />
      </mesh>
      <Html position={[3.6, 2.05, START_Z - 1.97]} center distanceFactor={14}>
        <div
          className="pointer-events-none whitespace-nowrap rounded border px-2.5 py-1 font-mono-tech text-[10px] font-bold uppercase tracking-wide"
          style={{ borderColor: `${riskColor}88`, color: riskColor, background: "rgba(9,13,17,0.6)" }}
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
    <group position={[-4.4, 0.015, DEFECT_Z]}>
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

function VehicleMesh() {
  const wheelPositions: [number, number, number][] = [
    [-0.86, 0.34, 1.35],
    [0.86, 0.34, 1.35],
    [-0.86, 0.34, -1.35],
    [0.86, 0.34, -1.35],
  ];
  return (
    <group>
      <mesh position={[0, 0.58, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.86, 0.62, 4.1]} />
        <meshStandardMaterial color="#4b5142" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[1.92, 0.2, 4.16]} />
        <meshStandardMaterial color="#191c1f" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.04, -0.28]} castShadow>
        <boxGeometry args={[1.6, 0.46, 2.0]} />
        <meshStandardMaterial color="#11151a" roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.29, -0.28]} castShadow>
        <boxGeometry args={[1.66, 0.06, 2.06]} />
        <meshStandardMaterial color="#3a4034" roughness={0.55} />
      </mesh>

      <mesh position={[0, 1.37, -0.9]} castShadow>
        <boxGeometry args={[0.68, 0.09, 0.15]} />
        <meshStandardMaterial color="#0d0f12" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.37, -0.9]}>
        <boxGeometry args={[0.58, 0.04, 0.09]} />
        <meshStandardMaterial color="#f0b93d" emissive="#f0b93d" emissiveIntensity={0.5} />
      </mesh>

      {[0.945, -0.945].map((x) => (
        <mesh key={x} position={[x, 0.64, 0]}>
          <boxGeometry args={[0.01, 0.07, 3.5]} />
          <meshStandardMaterial color="#35e0d0" emissive="#35e0d0" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {wheelPositions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.26, 16]} />
            <meshStandardMaterial color="#0c0d0f" roughness={0.95} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.17, 0.17, 0.27, 10]} />
            <meshStandardMaterial color="#565b62" roughness={0.4} metalness={0.55} />
          </mesh>
        </group>
      ))}

      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.62, 2.04]}>
          <boxGeometry args={[0.32, 0.11, 0.03]} />
          <meshStandardMaterial color="#e9eff2" emissive="#bfe0ff" emissiveIntensity={0.45} />
        </mesh>
      ))}
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.62, -2.04]}>
          <boxGeometry args={[0.26, 0.09, 0.03]} />
          <meshStandardMaterial color="#3a1414" emissive="#ff4d4d" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function CharacterMesh() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.19, 1.0, 8]} />
        <meshStandardMaterial color="#2a2e34" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.5, 4, 8]} />
        <meshStandardMaterial color="#333a33" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.262, 0.262, 0.42, 12, 1, true]} />
        <meshStandardMaterial color="#c98a2b" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.66, 0]} castShadow>
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshStandardMaterial color="#caa27c" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.79, 0]} castShadow>
        <sphereGeometry args={[0.19, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
        <meshStandardMaterial color="#f0b93d" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.735, 0]}>
        <cylinderGeometry args={[0.205, 0.205, 0.03, 16]} />
        <meshStandardMaterial color="#d9a02f" roughness={0.4} />
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
