"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { TerrainMesh } from "./scene/terrain-mesh";
import { WaterPlane } from "./scene/water-plane";
import { RoadRibbon } from "./scene/road-ribbon";
import { Vegetation } from "./scene/vegetation";
import { Rocks } from "./scene/rocks";
import { Buildings } from "./scene/buildings";
import { DefectMarkers } from "./scene/defect-markers";
import { Drone } from "./scene/drone";
import { ElevationWireframe, RiskZoneHalos, CoverageStrip, TrafficDots, DrainageFlow, BridgeDecks } from "./scene/extra-layers";
import { WeatherEffects } from "./scene/weather-effects";
import { TERRAIN_CONFIGS, TERRAIN_SIZE, generateRoadPath, heightAt, type RoadPoint } from "@/lib/road-sense/terrain-config";
import { generateDefects } from "@/lib/road-sense/defects-data";
import { pointOnRoad } from "@/lib/road-sense/build-road-geometry";
import { WEATHER_ENVIRONMENT } from "@/lib/road-sense/weather";
import { usePrefersReducedMotion } from "@/lib/road-sense/use-reduced-motion";
import {
  EYE_HEIGHT,
  LOOK_SENSITIVITY,
  MAX_PITCH,
  WALK_CORRIDOR_HALF,
  WALK_RUN_MULTIPLIER,
  WALK_SPEED,
  createWalkState,
  nearestOnPath,
  type WalkState,
} from "@/lib/road-sense/walk";
import type { TerrainConfig, TerrainType, RoadDefect, WeatherCondition } from "@/lib/road-sense/types";
import type { LayerKey } from "@/lib/road-sense/layers";

export interface CameraCommands {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  panTo: (x: number, z: number) => void;
}

export type ViewProjection = "2d" | "3d";
export type ViewStyle = "satellite" | "terrain";

const BASE_CAM = new THREE.Vector3(0, 40, 64);
const TOPDOWN_CAM = new THREE.Vector3(0.01, 150, 0.01);

function droneCamFor(heightScale: number) {
  const camY = 26 + heightScale * 1.05;
  const camZ = 42 + heightScale * 1.35;
  return new THREE.Vector3(0, camY, camZ);
}

/**
 * First-person controller for Walk mode.
 *
 * Owns the camera outright while active: WASD moves relative to where the
 * inspector is looking, pointer drag looks around, and the eye height follows
 * whichever surface is underfoot — the road deck when on the carriageway, the
 * terrain when off it. Movement is clamped to a corridor around the road so an
 * inspector cannot wander off a mountainside into empty space.
 *
 * State lives in a ref, not React state: this runs every frame.
 */
function WalkRig({
  active,
  config,
  path,
  walkStateRef,
}: {
  active: boolean;
  config: TerrainConfig;
  path: RoadPoint[];
  walkStateRef: React.MutableRefObject<WalkState>;
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Drop the inspector onto the road when the mode opens.
  useEffect(() => {
    if (!active || path.length < 2) return;
    const start = path[Math.floor(path.length * 0.18)];
    const ahead = path[Math.min(path.length - 1, Math.floor(path.length * 0.18) + 4)];
    const w = walkStateRef.current;
    w.x = start.x;
    w.z = start.z;
    // Face along the road rather than at whatever the orbit camera last had.
    // A camera at yaw looks along (-sin yaw, -cos yaw), so to look down the
    // tangent (dx, dz) the yaw is atan2(-dx, -dz) — not atan2(dx, -dz), which
    // mirrors the heading and puts you facing the cut face.
    w.yaw = Math.atan2(-(ahead.x - start.x), -(ahead.z - start.z));
    w.pitch = -0.05;
    w.bob = 0;
  }, [active, path, walkStateRef]);

  useEffect(() => {
    if (!active) return;
    const el = gl.domElement;

    function down(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      keys.current.add(e.key.toLowerCase());
    }
    function up(e: KeyboardEvent) {
      keys.current.delete(e.key.toLowerCase());
    }
    function pointerDown(e: PointerEvent) {
      dragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    }
    function pointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      const w = walkStateRef.current;
      w.yaw -= (e.clientX - lastPointer.current.x) * LOOK_SENSITIVITY;
      w.pitch = Math.max(
        -MAX_PITCH,
        Math.min(MAX_PITCH, w.pitch - (e.clientY - lastPointer.current.y) * LOOK_SENSITIVITY),
      );
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
    function pointerUp(e: PointerEvent) {
      dragging.current = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    }

    const held = keys.current;
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    el.addEventListener("pointerdown", pointerDown);
    el.addEventListener("pointermove", pointerMove);
    el.addEventListener("pointerup", pointerUp);
    el.addEventListener("pointercancel", pointerUp);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      el.removeEventListener("pointerdown", pointerDown);
      el.removeEventListener("pointermove", pointerMove);
      el.removeEventListener("pointerup", pointerUp);
      el.removeEventListener("pointercancel", pointerUp);
      held.clear();
      dragging.current = false;
    };
  }, [active, gl, walkStateRef]);

  useFrame((_, rawDelta) => {
    if (!active || path.length < 2) return;
    const delta = Math.min(rawDelta, 0.1);
    const w = walkStateRef.current;
    const held = keys.current;

    let forward = 0;
    let strafe = 0;
    if (held.has("w") || held.has("arrowup")) forward += 1;
    if (held.has("s") || held.has("arrowdown")) forward -= 1;
    if (held.has("a") || held.has("arrowleft")) strafe -= 1;
    if (held.has("d") || held.has("arrowright")) strafe += 1;

    const len = Math.hypot(forward, strafe);
    w.moving = len > 0.001;
    if (w.moving) {
      forward /= len;
      strafe /= len;
      const speed = WALK_SPEED * (held.has("shift") ? WALK_RUN_MULTIPLIER : 1) * delta;
      // Forward is -Z at yaw 0, matching how the rest of the scene is laid out.
      const sin = Math.sin(w.yaw);
      const cos = Math.cos(w.yaw);
      const nx = w.x + (-sin * forward + cos * strafe) * speed;
      const nz = w.z + (-cos * forward - sin * strafe) * speed;

      // Only commit the step if it stays inside the corridor, so walking into
      // the boundary stops rather than sliding along an invisible wall.
      const near = nearestOnPath(path, nx, nz);
      if (near.dist <= WALK_CORRIDOR_HALF) {
        w.x = nx;
        w.z = nz;
      }
      w.bob += delta * (held.has("shift") ? 11 : 7);
    }

    const near = nearestOnPath(path, w.x, w.z);
    // On the carriageway the deck carries you; off it, the ground does.
    const onRoad = near.dist < config.roadWidth / 2;
    const groundY = onRoad ? near.point.y : Math.max(heightAt(config, w.x, w.z), near.point.y - 2.5);
    const bobY = w.moving ? Math.sin(w.bob) * 0.045 : 0;

    camera.position.set(w.x, groundY + EYE_HEIGHT + bobY, w.z);
    // One call rather than assigning .order/.x/.y separately: YXZ applies yaw
    // before pitch, which is what keeps the horizon level as you look around.
    camera.rotation.set(w.pitch, w.yaw, 0, "YXZ");
  });

  return null;
}

function CameraRig({
  projection,
  cameraApiRef,
  dragMode,
  heightScale,
  path,
  driveActive,
  walkActive,
  driveProgressRef,
}: {
  projection: ViewProjection;
  cameraApiRef: React.MutableRefObject<CameraCommands | null>;
  dragMode: "rotate" | "pan";
  heightScale: number;
  path: RoadPoint[];
  driveActive: boolean;
  walkActive: boolean;
  driveProgressRef: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const desiredRef = useRef(BASE_CAM.clone());
  const desiredTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const transitioningRef = useRef(true);
  const lookAtTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    desiredRef.current = projection === "2d" ? TOPDOWN_CAM.clone() : droneCamFor(heightScale);
    desiredTargetRef.current.set(0, 0, 0);
    transitioningRef.current = true;
  }, [projection, heightScale]);

  useEffect(() => {
    // Re-settle the orbit camera whenever a first-person mode hands back.
    if (!driveActive && !walkActive) transitioningRef.current = true;
  }, [driveActive, walkActive]);

  useEffect(() => {
    cameraApiRef.current = {
      zoomIn: () => {
        const c = controlsRef.current;
        if (!c) return;
        const dir = new THREE.Vector3().subVectors(c.object.position, c.target).multiplyScalar(0.82);
        c.object.position.copy(c.target).add(dir);
        c.update();
      },
      zoomOut: () => {
        const c = controlsRef.current;
        if (!c) return;
        const dir = new THREE.Vector3().subVectors(c.object.position, c.target).multiplyScalar(1.22);
        c.object.position.copy(c.target).add(dir);
        c.update();
      },
      reset: () => {
        desiredRef.current = projection === "2d" ? TOPDOWN_CAM.clone() : droneCamFor(heightScale);
        desiredTargetRef.current.set(0, 0, 0);
        transitioningRef.current = true;
      },
      panTo: (x: number, z: number) => {
        const c = controlsRef.current;
        const offset = c ? new THREE.Vector3().subVectors(c.object.position, c.target) : desiredRef.current.clone();
        desiredTargetRef.current.set(x, 0, z);
        desiredRef.current = new THREE.Vector3(x, 0, z).add(offset);
        transitioningRef.current = true;
      },
    };
  }, [cameraApiRef, projection, heightScale]);

  useFrame((_, delta) => {
    // Walk mode drives the camera itself; stay out of its way entirely.
    if (walkActive) return;
    if (driveActive && path.length > 1) {
      driveProgressRef.current = (driveProgressRef.current + delta * 0.014) % 1;
      const p = pointOnRoad(path, driveProgressRef.current);
      const ahead = pointOnRoad(path, (driveProgressRef.current + 0.008) % 1);
      const eyeHeight = 1.75;
      camera.position.set(p.x, p.y + eyeHeight, p.z);
      lookAtTarget.current.set(ahead.x, ahead.y + eyeHeight * 0.55, ahead.z);
      camera.lookAt(lookAtTarget.current);
      return;
    }
    if (transitioningRef.current) {
      camera.position.lerp(desiredRef.current, 0.045);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(desiredTargetRef.current, 0.045);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(desiredRef.current) < 0.4) transitioningRef.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!driveActive && !walkActive}
      enableDamping
      dampingFactor={0.08}
      minDistance={12}
      maxDistance={220}
      minPolarAngle={projection === "2d" ? 0 : 0.18}
      maxPolarAngle={projection === "2d" ? 0.05 : 1.4}
      target={[0, 0, 0]}
      mouseButtons={{
        LEFT: dragMode === "rotate" ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: dragMode === "rotate" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
      }}
    />
  );
}

function Scene({
  terrainType,
  path,
  aiOverlay,
  xray,
  weather,
  droneActive,
  layers,
  viewStyle,
  selectedDefectId,
  onSelectDefect,
  onRoadClick,
  droneProgressRef,
}: {
  terrainType: TerrainType;
  path: RoadPoint[];
  aiOverlay: boolean;
  xray: boolean;
  weather: WeatherCondition;
  droneActive: boolean;
  layers: Record<LayerKey, boolean>;
  viewStyle: ViewStyle;
  selectedDefectId: string | null;
  onSelectDefect: (d: RoadDefect) => void;
  onRoadClick: () => void;
  droneProgressRef: React.MutableRefObject<number>;
}) {
  const config = TERRAIN_CONFIGS[terrainType];
  const defects = useMemo(() => generateDefects(config.id, config.seed), [config]);
  const reducedMotion = usePrefersReducedMotion();
  const weatherEnv = WEATHER_ENVIRONMENT[weather];
  const bgColor = viewStyle === "satellite" ? "#161a1d" : (weatherEnv.tint ?? config.fogColor);

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, config.fogNear * weatherEnv.fogNearMul, config.fogFar * weatherEnv.fogFarMul]} />
      <hemisphereLight args={["#7fa0bf", "#2a2318", 0.65]} />
      <directionalLight
        position={[60, 90, 30]}
        intensity={0.95}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={4}
        shadow-bias={-0.0006}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-far={260}
      />
      {/* low, shadowless fill light — lifts shadow-side blacks so slopes read as
          naturally shaded rock instead of high-contrast cut paper */}
      <directionalLight position={[-50, 35, -60]} intensity={0.28} color="#9fb8d0" />
      <ambientLight intensity={0.12} />

      <TerrainMesh config={config} path={path} />
      {layers.water && <WaterPlane config={config} weather={weather} />}
      {layers.roads && (
        <RoadRibbon path={path} width={config.roadWidth} defects={defects} aiOverlay={aiOverlay} xray={xray} onClick={onRoadClick} />
      )}
      {layers.vegetation && <Vegetation config={config} path={path} />}
      {layers.soil && <Rocks config={config} path={path} />}
      {config.buildingDensity > 0 && <Buildings config={config} path={path} />}
      {layers.defects && (
        <DefectMarkers defects={defects} path={path} roadWidth={config.roadWidth} selectedId={selectedDefectId} onSelect={onSelectDefect} />
      )}
      {layers.elevation && <ElevationWireframe config={config} />}
      {layers.riskZones && <RiskZoneHalos defects={defects} path={path} />}
      {layers.droneCoverage && <CoverageStrip path={path} roadWidth={config.roadWidth} />}
      {layers.trafficLoad && <TrafficDots path={path} />}
      {layers.drainage && <DrainageFlow config={config} path={path} />}
      {layers.bridges && <BridgeDecks config={config} path={path} />}

      <WeatherEffects config={config} weather={weather} reducedMotion={reducedMotion} />

      <Drone path={path} active={droneActive} progressRef={droneProgressRef} />
    </>
  );
}

export function TerrainCanvas({
  terrainType,
  aiOverlay,
  xray = false,
  weather = "normal",
  droneActive,
  driveActive = false,
  walkActive = false,
  walkStateRef,
  layers,
  viewProjection,
  viewStyle,
  cameraApiRef,
  selectedDefectId,
  onSelectDefect,
  onRoadClick,
  droneProgressRef,
  driveProgressRef,
  dragMode,
}: {
  terrainType: TerrainType;
  aiOverlay: boolean;
  xray?: boolean;
  weather?: WeatherCondition;
  droneActive: boolean;
  driveActive?: boolean;
  walkActive?: boolean;
  walkStateRef?: React.MutableRefObject<WalkState>;
  layers: Record<LayerKey, boolean>;
  viewProjection: ViewProjection;
  viewStyle: ViewStyle;
  cameraApiRef: React.MutableRefObject<CameraCommands | null>;
  selectedDefectId: string | null;
  onSelectDefect: (d: RoadDefect) => void;
  onRoadClick: () => void;
  droneProgressRef: React.MutableRefObject<number>;
  driveProgressRef?: React.MutableRefObject<number>;
  dragMode: "rotate" | "pan";
}) {
  const config = TERRAIN_CONFIGS[terrainType];
  const heightScale = config.heightScale;
  const path = useMemo(() => generateRoadPath(config), [config]);
  const fallbackDriveProgress = useRef(0.1);
  const resolvedDriveProgressRef = driveProgressRef ?? fallbackDriveProgress;
  const fallbackWalkState = useRef<WalkState>(createWalkState());
  const resolvedWalkStateRef = walkStateRef ?? fallbackWalkState;

  return (
    <Canvas shadows="soft" dpr={[1, 1.6]} gl={{ antialias: true }}>
      <PerspectiveCamera makeDefault position={BASE_CAM.toArray()} fov={48} near={0.5} far={500} />
      <CameraRig
        projection={viewProjection}
        cameraApiRef={cameraApiRef}
        dragMode={dragMode}
        heightScale={heightScale}
        path={path}
        driveActive={driveActive}
        walkActive={walkActive}
        driveProgressRef={resolvedDriveProgressRef}
      />
      <WalkRig active={walkActive} config={config} path={path} walkStateRef={resolvedWalkStateRef} />
      <Scene
        terrainType={terrainType}
        path={path}
        aiOverlay={aiOverlay}
        xray={xray}
        weather={weather}
        droneActive={droneActive}
        layers={layers}
        viewStyle={viewStyle}
        selectedDefectId={selectedDefectId}
        onSelectDefect={onSelectDefect}
        onRoadClick={onRoadClick}
        droneProgressRef={droneProgressRef}
      />
    </Canvas>
  );
}

export { TERRAIN_SIZE };
