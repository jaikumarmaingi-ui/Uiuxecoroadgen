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
import { TERRAIN_CONFIGS, TERRAIN_SIZE, generateRoadPath, type RoadPoint } from "@/lib/road-sense/terrain-config";
import { generateDefects } from "@/lib/road-sense/defects-data";
import { pointOnRoad } from "@/lib/road-sense/build-road-geometry";
import { WEATHER_ENVIRONMENT } from "@/lib/road-sense/weather";
import { usePrefersReducedMotion } from "@/lib/road-sense/use-reduced-motion";
import type { TerrainType, RoadDefect, WeatherCondition } from "@/lib/road-sense/types";
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

function CameraRig({
  projection,
  cameraApiRef,
  dragMode,
  heightScale,
  path,
  driveActive,
  driveProgressRef,
}: {
  projection: ViewProjection;
  cameraApiRef: React.MutableRefObject<CameraCommands | null>;
  dragMode: "rotate" | "pan";
  heightScale: number;
  path: RoadPoint[];
  driveActive: boolean;
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
    if (!driveActive) transitioningRef.current = true;
  }, [driveActive]);

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
      enabled={!driveActive}
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

      <TerrainMesh config={config} />
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
        driveProgressRef={resolvedDriveProgressRef}
      />
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
