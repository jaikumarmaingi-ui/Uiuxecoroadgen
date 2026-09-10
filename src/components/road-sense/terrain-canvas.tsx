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
import { TERRAIN_CONFIGS, TERRAIN_SIZE, generateRoadPath } from "@/lib/road-sense/terrain-config";
import { generateDefects } from "@/lib/road-sense/defects-data";
import type { TerrainType, RoadDefect } from "@/lib/road-sense/types";
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
}: {
  projection: ViewProjection;
  cameraApiRef: React.MutableRefObject<CameraCommands | null>;
  dragMode: "rotate" | "pan";
  heightScale: number;
}) {
  const { camera } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const desiredRef = useRef(BASE_CAM.clone());
  const desiredTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const transitioningRef = useRef(true);

  useEffect(() => {
    desiredRef.current = projection === "2d" ? TOPDOWN_CAM.clone() : droneCamFor(heightScale);
    desiredTargetRef.current.set(0, 0, 0);
    transitioningRef.current = true;
  }, [projection, heightScale]);

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

  useFrame(() => {
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
  aiOverlay,
  droneActive,
  layers,
  viewStyle,
  selectedDefectId,
  onSelectDefect,
  onRoadClick,
  droneProgressRef,
}: {
  terrainType: TerrainType;
  aiOverlay: boolean;
  droneActive: boolean;
  layers: Record<LayerKey, boolean>;
  viewStyle: ViewStyle;
  selectedDefectId: string | null;
  onSelectDefect: (d: RoadDefect) => void;
  onRoadClick: () => void;
  droneProgressRef: React.MutableRefObject<number>;
}) {
  const config = TERRAIN_CONFIGS[terrainType];
  const path = useMemo(() => generateRoadPath(config), [config]);
  const defects = useMemo(() => generateDefects(config.id, config.seed), [config]);

  return (
    <>
      <color attach="background" args={[viewStyle === "satellite" ? "#161a1d" : config.fogColor]} />
      <fog attach="fog" args={[viewStyle === "satellite" ? "#161a1d" : config.fogColor, config.fogNear, config.fogFar]} />
      <hemisphereLight args={["#6f8caf", "#181510", 0.4]} />
      <directionalLight
        position={[60, 90, 30]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-camera-far={260}
      />

      <TerrainMesh config={config} />
      {layers.water && <WaterPlane config={config} />}
      {layers.roads && (
        <RoadRibbon path={path} width={config.roadWidth} defects={defects} aiOverlay={aiOverlay} onClick={onRoadClick} />
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

      <Drone path={path} active={droneActive} progressRef={droneProgressRef} />
    </>
  );
}

export function TerrainCanvas({
  terrainType,
  aiOverlay,
  droneActive,
  layers,
  viewProjection,
  viewStyle,
  cameraApiRef,
  selectedDefectId,
  onSelectDefect,
  onRoadClick,
  droneProgressRef,
  dragMode,
}: {
  terrainType: TerrainType;
  aiOverlay: boolean;
  droneActive: boolean;
  layers: Record<LayerKey, boolean>;
  viewProjection: ViewProjection;
  viewStyle: ViewStyle;
  cameraApiRef: React.MutableRefObject<CameraCommands | null>;
  selectedDefectId: string | null;
  onSelectDefect: (d: RoadDefect) => void;
  onRoadClick: () => void;
  droneProgressRef: React.MutableRefObject<number>;
  dragMode: "rotate" | "pan";
}) {
  const heightScale = TERRAIN_CONFIGS[terrainType].heightScale;
  return (
    <Canvas shadows dpr={[1, 1.6]} gl={{ antialias: true }}>
      <PerspectiveCamera makeDefault position={BASE_CAM.toArray()} fov={48} near={0.5} far={500} />
      <CameraRig projection={viewProjection} cameraApiRef={cameraApiRef} dragMode={dragMode} heightScale={heightScale} />
      <Scene
        terrainType={terrainType}
        aiOverlay={aiOverlay}
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
